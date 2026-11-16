import { useEffect, useState, useCallback, useRef } from "react";
import { drawShape } from "../utils/drawShape.js";
import { useCanvas } from "../context/CanvasContext.jsx";

const canvasId = localStorage.getItem("canvasId");
const userId = localStorage.getItem('userId');

const ERASER_RADIUS = 14;   // screen pixels; matches the .cursor-eraser ring in App.css
const MIN_DRAG = 3;         // screen pixels; a shorter drag is a stray click, not a shape
const FILLABLE = ["rectangle", "circle", "diamond"];
const LOCAL_ID_PREFIX = "local-"; // id of a shape drawn here that the server has not confirmed

// A mouse always reports the same pressure, so only a pen's value is meaningful.
const penPressure = (e) => (e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 1);

export default function useCanvasDrawing(canvasRef) {
  const {
    shapes, addShape, setShapes,
    tool, color, strokeWidth, opacity, fill,
    view, setView, zoomTo,
  } = useCanvas();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [eraserPath, setEraserPath] = useState([]);


  const [myTempShape, setMyTempShape] = useState(null);
  const [liveShapes, setLiveShape] = useState(new Map());

  const [smoothPoints, setSmoothPoints] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

  // Size of the canvas element in CSS pixels, and how many device pixels make one CSS pixel.
  const [viewport, setViewport] = useState({ width: 0, height: 0, dpr: 1 });
  // "connecting" | "online" | "offline"
  const [connection, setConnection] = useState("connecting");

  // New state for undo/redo history
  // const [history, setHistory] = useState([]);
  // const [historyIndex, setHistoryIndex] = useState(-1);

  const wsRef = useRef(null);
  const panStart = useRef(null);   // last pointer position while dragging with the hand tool
  const lastEraseTime = useRef(0);
  const ERASE_DEBOUNCE_MS = 5;
  const deletedShapeIds = useRef(new Set()); // Track already deleted shapes
  const animationFrameRef = useRef(null);
  const SMOOTHING_FACTOR = 0.85;
  const MIN_DISTANCE = 2;

  //websocket setup
  useEffect(() => {
    if(!wsRef.current){
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connencted");
        setConnection("online");
        ws.send(JSON.stringify({
          type: "joinCanvas",
          data: {canvasId, userId, role: "owner"}
        }));
      };

      ws.onmessage = (event) => {
        console.log("Message:", event.data);
        const message = JSON.parse(event.data);
        switch(message.type) {
          case "initialShapes": {
            const shapesWithIds = message.data.map(shape => ({
              ...shape,
              id: shape.id || `temp-${Date.now()}-${Math.random()}` // Fallback ID
            }));
            setShapes(shapesWithIds);
            break;
          }

          case "newShape":
            setShapes(prev => [...prev, message.data]);
            break;

            case "liveShapeUpdate":
              setLiveShape(prev => {
              const newMap = new Map(prev);
              newMap.set(message.data.id, message.data);
              return newMap
            })
            break;

          case "deleteShape":
            setShapes(prev => prev.filter(s => s.id !== message.data.id));
            break;

          default:
            console.log("Unknow message type:", message);
          }
        };

        ws.onclose = () =>{
          console.log("Websocket disconnected");
          setConnection("offline");
        };
    }

    return () => {
      if(animationFrameRef.current){
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [setShapes]);

  // smooth line interpolation function
  const interpolatePoints = useCallback((p1, p2, factor = 0.5) => {
    return {
      x: p1.x + (p2.x - p1.x) * factor,
      y: p1.y + (p2.y - p1.y) * factor,
      pressure: p1.pressure + (p2.pressure - p1.pressure) * factor
    }
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Shapes are stored in canvas ("world") coordinates, so they stay where they are
  // when the view pans or zooms. Pointer events arrive in screen coordinates.
  const toWorld = useCallback((screenX, screenY) => ({
    x: (screenX - view.x) / view.zoom,
    y: (screenY - view.y) / view.zoom,
  }), [view]);

  const drawSmoothFreehand = useCallback((ctx, points, color, strokeWidth) => {
    if( points.length < 2) return ;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Use quadratic curves for smooth drawing
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const controlPoint = interpolatePoints(currentPoint, nextPoint, 0.5);

      // Vary line width based on pressure if available
      if (currentPoint.pressure) {
        ctx.lineWidth = strokeWidth * currentPoint.pressure;
      }

      ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlPoint.x, controlPoint.y);
    }

    // Draw the last point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
    ctx.restore();
  }, [interpolatePoints]);

  // Faint trail behind the eraser while it is being dragged.
  const drawEraserPath = useCallback((ctx, path) => {
    if(!isDrawing)  return;
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(113, 113, 122, 0.25)';
    ctx.lineWidth = (ERASER_RADIUS * 2) / view.zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.restore();
  }, [isDrawing, view.zoom]);

  const redrawCanvas = useCallback((ctx) => {
    const { dpr } = viewport;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // From here on everything is drawn in world coordinates.
    ctx.setTransform(dpr * view.zoom, 0, 0, dpr * view.zoom, dpr * view.x, dpr * view.y);

    // Draw shapes
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });

    if(myTempShape) {
      if (myTempShape.type === 'freehand' && smoothPoints.length > 0) {
        drawSmoothFreehand(ctx, smoothPoints, myTempShape.color, myTempShape.strokeWidth);
      } else {
        drawShape(ctx, myTempShape);
      }
    }

    liveShapes.forEach((shape) => drawShape(ctx, shape));

    // Draw eraser path (visual feedback)
    if (tool === "eraser" && eraserPath.length > 0 ) {
      drawEraserPath(ctx, eraserPath);
    }
  }, [shapes, myTempShape, liveShapes, tool, eraserPath, smoothPoints, view, viewport, drawSmoothFreehand, drawEraserPath]);

  // Keep track of the canvas element's size (it fills the window).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => setViewport({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      dpr: window.devicePixelRatio || 1,
    });

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match the drawing buffer to the real pixel size so lines stay sharp on any screen.
    const width = Math.round(viewport.width * viewport.dpr);
    const height = Math.round(viewport.height * viewport.dpr);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    // Set canvas properties for better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    redrawCanvas(ctx);
  }, [canvasRef, redrawCanvas, viewport]);

  // Wheel scrolls the canvas; Ctrl/Cmd + wheel (or a trackpad pinch) zooms around the pointer.
  // Registered by hand because React's onWheel is passive and cannot stop the page from zooming.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1; // Firefox reports lines, not pixels
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * unit * 0.0015);
        zoomTo((zoom) => zoom * factor, e.offsetX, e.offsetY);
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit }));
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasRef, zoomTo, setView]);

  const eraseAtPosition = useCallback((x, y) => {
    // if(!isErasing) return ;
    console.log('Eraser at position:', x, y);
    const now = Date.now();
    if (now - lastEraseTime.current < ERASE_DEBOUNCE_MS) {
      return;
    }
    lastEraseTime.current = now;

    const validShapes = [...shapes, ...Array.from(liveShapes.values())];
    const shapesToDelete = validShapes.filter(shape => {
      if(deletedShapeIds.current.has(shape.id)) return false;
      return isPointInsideShape(x, y, shape, ERASER_RADIUS / view.zoom);
    });

    if (shapesToDelete.length > 0) { // Ensure shape has an ID
      shapesToDelete.forEach(shape => {
        deletedShapeIds.current.add(shape.id);
      });

      const shapeIdsToDelete = shapesToDelete.map(shape => shape.id);
      setShapes(prev => prev.filter(s => !shapeIdsToDelete.includes(s.id)));

      shapesToDelete.forEach(shapeToDelete => {
        // A shape drawn in this session only has a local id, which the server does not know,
        // so there is nothing to ask it to delete. It will come back on reload until the
        // server reports saved ids to the sender.
        if (String(shapeToDelete.id).startsWith(LOCAL_ID_PREFIX)) return;

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "deleteShape",
            data: {
              id: shapeToDelete.id, // Make sure this is the database ID
              canvasId: canvasId
            }
          }));
        }
        console.log('Deleted shape ID:', shapeToDelete.id);
      });

      // const newHistory = history.slice(0, historyIndex + 1);
      // shapesToDelete.forEach(shapeToDelete => {
      //   wsRef.current.send(JSON.stringify({
      //     type: "undo",
      //     data: {
      //       id: shapeToDelete.id, // Make sure this is the database ID
      //       canvasId: canvasId
      //     }
      //   }))
      // });
      // setHistory(newHistory);
      // setHistoryIndex(newHistory.length - 1);
    }else {
      console.log('No shape found at position or shape missing ID');
    }
  }, [shapes, liveShapes, setShapes, view.zoom]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    // Keep receiving move/up events even when the pointer leaves the canvas or
    // passes over a toolbar, so a stroke can never get stuck half-finished.
    e.currentTarget.setPointerCapture?.(e.pointerId);

    if (tool === "hand") {
      panStart.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
      setIsPanning(true);
      return;
    }
    if (tool === "select") return;

    const { x, y } = toWorld(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    const currentPressure = penPressure(e);

    setIsDrawing(true);
    setStartX(x);
    setStartY(y);

    deletedShapeIds.current.clear();

    if(tool === "eraser"){
      setIsErasing(true);
      eraseAtPosition(x, y);
      setEraserPath([{ x, y }]);
      return ;
    }

    const initialPoint = { x, y, pressure: currentPressure };

    if (tool === "freehand") {
      setSmoothPoints([initialPoint]);
      setLastPoint(initialPoint);
    }

    const tempShape = {
      type: tool,
      x,
      y,
      color,
      strokeWidth,

      width: 0,
      height: 0,
      radius: 0,
      points: tool === "freehand" ? [{ x, y }] : [],
      // Preview with the same fill and opacity the finished shape will have.
      ...(FILLABLE.includes(tool) ? { fill, opacity } : {}),
    };

    setMyTempShape(tempShape);

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "drawLiveShape",
        data: { canvasId, shape: tempShape }
      }));
    }

  }, [tool, color, strokeWidth, fill, opacity, toWorld, eraseAtPosition]);

  const handlePointerMove = useCallback((e) => {
    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    if (panStart.current) {
      const dx = screenX - panStart.current.x;
      const dy = screenY - panStart.current.y;
      panStart.current = { x: screenX, y: screenY };
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      return;
    }

    if (!isDrawing) return;

    const { x, y } = toWorld(screenX, screenY);
    const currentPressure = penPressure(e);
    const currentPoint = { x, y, pressure: currentPressure };

    if (isErasing) {
      eraseAtPosition(x, y);
      setEraserPath(prev => [...prev, currentPoint]);
      return ;
    }
    if (!myTempShape) return;

    let updatedShape = { ...myTempShape };
    // Use the shape's own type: the tool may have been switched from the keyboard mid-drag.
    switch (myTempShape.type) {
      case "rectangle":
      case "line":
      case "arrow":
        updatedShape.width = x - startX;
        updatedShape.height = y - startY;
        break;

      case "diamond":
        // A diamond is positioned by its centre (see drawShape), like the finished shape.
        updatedShape.width = x - startX;
        updatedShape.height = y - startY;
        updatedShape.x = startX + updatedShape.width / 2;
        updatedShape.y = startY + updatedShape.height / 2;
        break;

      case "circle":
        updatedShape.radius = Math.sqrt(
          Math.pow(x - startX, 2) + Math.pow(y - startY, 2)
        );
        break;

      case "freehand":
        if (lastPoint && getDistance(lastPoint, currentPoint) > MIN_DISTANCE / view.zoom) {
          // Add smoothed intermediate points
          const smoothedPoint = {
            x: lastPoint.x * SMOOTHING_FACTOR + currentPoint.x * (1 - SMOOTHING_FACTOR),
            y: lastPoint.y * SMOOTHING_FACTOR + currentPoint.y * (1 - SMOOTHING_FACTOR),
            pressure: currentPressure
          };

          setSmoothPoints(prev => [...prev, smoothedPoint, currentPoint]);
          updatedShape.points = [...smoothPoints, smoothedPoint, currentPoint];
          setLastPoint(currentPoint);
        }
        break;
    }

    setMyTempShape(updatedShape);
    // Throttle WebSocket updates for better performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
        wsRef.current.send(JSON.stringify({
          type: "drawLiveShape",
          data: {canvasId, shapes: updatedShape}
        }));
      }
    });
  }, [isDrawing, isErasing, myTempShape, startX, startY, toWorld, eraseAtPosition, lastPoint, smoothPoints, getDistance, setView, view.zoom]);

  const handlePointerUp = useCallback((e) => {
    if (panStart.current) {
      panStart.current = null;
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (isErasing || !myTempShape) {
      setIsErasing(false);
      setEraserPath([]);
      deletedShapeIds.current.clear();
      setMyTempShape(null);
      return ;
    }

    const { x: endX, y: endY } = toWorld(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    const dragged = Math.hypot(endX - startX, endY - startY) * view.zoom >= MIN_DRAG;
    let finalShape = null;

    switch(myTempShape.type) {
      case "rectangle":{
        if (!dragged) break;
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        finalShape = { type: "rectangle", x, y, width, height, color, strokeWidth, opacity, fill };
        break;
      }

      case "circle": {
        if (!dragged) break;
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        finalShape = { type: "circle", x: startX, y: startY, radius, color, strokeWidth, fill, opacity};
        break;
      }

      case "line": {
        if (!dragged) break;
        const width = endX - startX;
        const height = endY - startY;
        finalShape = { type: "line", x: startX, y: startY, width, height, color, strokeWidth };
        break;
      }

      case "arrow": {
        if (!dragged) break;
        const width = endX - startX;
        const height = endY - startY;
        finalShape = { type: "arrow", x: startX, y: startY, width, height, color, strokeWidth };
        break;
      }

      case "diamond": {
        if (!dragged) break;
        const width = endX - startX;
        const height = endY - startY;
        const x = startX + width / 2;
        const y = startY + height / 2;
        finalShape = { type: "diamond", x, y, width, height, color, strokeWidth, fill, opacity };
        break;
      }

      case "freehand": {
        if (smoothPoints.length < 2) break;
        finalShape = { type: "freehand", points: smoothPoints, color, strokeWidth };
        break;
      }

      case "text": {
        finalShape = {
          type: "text",
          x: startX,
          y: startY,
          text: "Your Text",
          color,
          fontSize: 16,
          fill
        };
        break;
      }
    }

    setMyTempShape(null);
    setSmoothPoints([]);
    if (!finalShape) return;

    // The server does not tell the sender which id it saved the shape under, so give the
    // local copy an id of its own. Without one, erasing a new shape removed every new shape.
    addShape({ ...finalShape, id: `${LOCAL_ID_PREFIX}${crypto.randomUUID()}` });

    // const newHistory = history.slice(0, historyIndex + 1);
    // newHistory.push({ type: "add", shape: finalShape });
    // setHistory(newHistory);
    // setHistoryIndex(newHistory.length - 1);

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "drawShape",
        data: { canvasId, shape: finalShape}
      }));
    }
  }, [isDrawing, isErasing, startX, startY, myTempShape, addShape, color, strokeWidth, opacity, fill, smoothPoints, toWorld, view.zoom]);

  const undo = useCallback(() => {
    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "undo",
        data: { canvasId, userId }
      }));
    }
  }, []);

  const redo = useCallback(() => {
    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "redo",
        data: { canvasId, userId }
      }));
    }
  }, []);

  return {
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, redo,
    isDrawing, isErasing, isPanning,
    connection,
  };
}



//helper function:
function isPointInsideShape(x, y, shape, tolerance = 10){
  if(!shape )return false;

  switch (shape.type.toLowerCase()) {
    case "rectangle" :{
      const padding = tolerance;
      return (
        x >= shape.x - padding &&
        x <= shape.x + (shape.width || 0) + padding &&
        y >= shape.y - padding &&
        y <= shape.y + (shape.height || 0) + padding
      );
    }
    case "circle":  {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const radius = shape.radius || 0;
      return dx * dx + dy * dy <= (radius + tolerance) * (radius + tolerance);
    }

    case "line":
    case "arrow":
      return pointNearLine(
        x, y,
        shape.x, shape.y,
        shape.x + (shape.width || 0),
        shape.y + (shape.height || 0),
        tolerance
      );

    case "freehand":{
      if(!shape.points || shape.points.length === 0)  return false;

      return shape.points.some(p =>
        Math.abs(x - p.x) < tolerance && Math.abs(y - p.y) < tolerance
      );
    }

    case "text":{
      const textWidth = (shape.text || '').length * (shape.fontSize || 16) * 0.6;
      const textHeight = shape.fontSize || 16;
      const padding = tolerance;

      return (
        x >= shape.x - padding &&
        x <= shape.x + textWidth + padding &&
        y >= shape.y - textHeight - padding &&
        y <= shape.y + padding
      )
    }

    case "diamond": {
      const dx = Math.abs(x - shape.x);
      const dy = Math.abs(y - shape.y);
      const halfWidth = (shape.width || 0) / 2 + tolerance;
      const halfHeight = (shape.height || 0) / 2 + tolerance;

      // Diamond detection using bounding box approach
      return dx / halfWidth + dy / halfHeight <= 1;
    }

    default :
      return false;
  }
}

function pointNearLine(px, py, x1, y1, x2, y2, tolerance = 15){
   if (x1 === x2 && y1 === y2) {
    const dx = px - x1;
    const dy = py - y1;
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
  }

  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if(lenSq !== 0)
    param = dot / lenSq;

  let xx, yy;
  if(param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1){
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}
