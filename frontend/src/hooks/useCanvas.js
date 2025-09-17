import { useEffect, useState, useCallback, useRef } from "react";
import { drawShape } from "../utils/drawShape.js";
import { useCanvas } from "../context/CanvasContext.jsx";

const canvasId = localStorage.getItem("canvasId");
const userId = localStorage.getItem('userId');

export default function useCanvasDrawing(canvasRef) {
  const { shapes, addShape, setShapes, tool, color, strokeWidth } = useCanvas();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [freehandPoints, setFreehandPoints] = useState([]);
  const [eraserPath, setEraserPath] = useState([]);


  const [myTempShape, setMyTempShape] = useState(null);
  const [liveShapes, setLiveShape] = useState(new Map());

  const [smoothPoints, setSmoothPoints] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);
  const [pressure, setPressure] = useState(1);


  // New state for undo/redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const wsRef = useRef(null);
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
            console.log("Unknow message type:", message.type);
          }
        };

        ws.onclose = () =>{ 
          console.log("Websocket disconnected");
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

  const redrawCanvas = useCallback((ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw shapes
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
    
    if(myTempShape) {
      // drawShape(ctx, myTempShape);
      if (myTempShape.type === 'freehand' && smoothPoints.length > 0) {
        drawSmoothFreehand(ctx, smoothPoints, myTempShape.color, myTempShape.strokeWidth);
      } else {
        drawShape(ctx, myTempShape);
      }
    }
    
    liveShapes.forEach((shape) => drawShape(ctx, shape));
    
    // Draw eraser path (visual feedback)
    if (tool === "eraser" && eraserPath.length > 0) {
      drawEraserPath(ctx, eraserPath);
    }
  },[shapes, myTempShape, liveShapes, tool, eraserPath, smoothPoints]);
  
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

  const drawEraserPath = useCallback((ctx, path) => {
    if (path.length === 0) return;

    ctx.save();
    
    // Draw eraser trail
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw eraser cursor
    if (path.length > 0) {
      const lastPoint = path[path.length - 1];
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
     // Set canvas properties for better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    redrawCanvas(ctx);
    
  }, [canvasRef, redrawCanvas, shapes, tool, isErasing, eraserPath]);
  
  const eraseAtPosition = useCallback((x, y) => {
    console.log('Eraser at position:', x, y);
    const now = Date.now();
    if (now - lastEraseTime.current < ERASE_DEBOUNCE_MS) {
      return;
    }
    lastEraseTime.current = now;

    const validShapes = [...shapes, ...Array.from(liveShapes.values())];
    const shapesToDelete = validShapes.filter(shape => {
      if(deletedShapeIds.current.has(shape.id)) return false;
      return isPointInsideShape(x, y, shape, 15);
    });  
    
    if (shapesToDelete.length > 0) { // Ensure shape has an ID    
      shapesToDelete.forEach(shape => {
        deletedShapeIds.current.add(shape.id);
      });

      const shapeIdsToDelete = shapesToDelete.map(shape => shape.id);
      setShapes(prev => prev.filter(s => !shapeIdsToDelete.includes(s.id)));
      
      shapesToDelete.forEach(shapeToDelete => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "deleteShape",
            data: { 
              id: shapeToDelete.id, // Make sure this is the database ID
              canvasId: canvasId 
            }
          }));
        }
      });

      const newHistory = history.slice(0, historyIndex + 1);
      shapesToDelete.forEach(shapeToDelete => {
        newHistory.push({
          type: "delete", shape: shapeToDelete 
        })
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1); 
    }else {
      console.log('No shape found at position or shape missing ID');
    }
  }, [ shapes, history, historyIndex]);

  const handleMouseDown = useCallback((e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const currentPressure = e.nativeEvent.pressure || 1;
    
    setIsDrawing(true);
    setStartX(offsetX);
    setStartY(offsetY);
    setPressure(currentPressure);

    deletedShapeIds.current.clear();

    if(tool === "eraser"){
      console.log('Eraser clicked at:', offsetX, offsetY);
      setIsErasing(true);
      eraseAtPosition(offsetX, offsetY);
      setEraserPath([{x: offsetX, y: offsetY}]);
      return ;
    }

    const initialPoint = {x: offsetX, y: offsetY, pressure: currentPressure};
    
    if (tool === "freehand") {
      setSmoothPoints([initialPoint]);
      setLastPoint(initialPoint);
    }

    const tempShape = {
      type: tool,
      x: offsetX,
      y: offsetY,
      color,
      strokeWidth,

      width: 0,
      height: 0,
      redius: 0,
      point: tool === "freehand" ? [{x : offsetX, y: offsetY}] : []
    };

    setMyTempShape(tempShape);

    if(tool !== "eraser" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "drawLiveShape",
        data: { canvasId, shape: tempShape }
      }));
    }

  }, [tool, color, strokeWidth, eraseAtPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing ) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const currentPressure = e.nativeEvent.pressure || 1;
    const currentPoint = {x: offsetX, y: offsetY, pressure: currentPressure};

    if(tool === "eraser" && isErasing){
      eraseAtPosition(offsetX, offsetY);
      setEraserPath(prev => [...prev, currentPoint]);
      
      return ;
    }
    if (!myTempShape) return;

    let updatedShape = { ...myTempShape };
    switch (tool) {
      case "rectangle":
      case "line":
      case "arrow":
      case "diamond":
        updatedShape.width = offsetX - startX;
        updatedShape.height = offsetY - startY;
        break;
      
      case "circle":
        updatedShape.radius = Math.sqrt(
          Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2)
        );
        break;

      case "freehand":
        if (lastPoint && getDistance(lastPoint, currentPoint) > MIN_DISTANCE) {
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
      if(tool !== "eraser" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
        wsRef.current.send(JSON.stringify({
          type: "drawLiveShape",
          data: {canvasId, shapes: updatedShape}
        }));
      }
    });
  }, [isDrawing, myTempShape, startX, startY, tool, freehandPoints, isErasing, eraseAtPosition, lastPoint, getDistance, smoothPoints]); 

  const handleMouseUp = useCallback((e) => {
    if (!isDrawing || !myTempShape) return;
    setIsDrawing(false);
    
    if( tool === "eraser"){
      setIsErasing(false);
      setEraserPath([]);
      deletedShapeIds.current.clear();
      return ;
    }
    
    const { offsetX, offsetY } = e.nativeEvent;
    let finalShape = {...myTempShape};

    switch(tool) {
      case "rectangle":{
        const x = Math.min(startX, offsetX);
        const y = Math.min(startY, offsetY);
        const width = Math.abs(offsetX - startX);
        const height = Math.abs(offsetY - startY);
        finalShape = { type: "rectangle", x, y, width, height, color, strokeWidth };
        addShape(finalShape);
        break;
      }

      case "circle": {
        const radius = Math.sqrt(
          Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2)
        );
        finalShape = { type: "circle", x: startX, y: startY, radius, color, strokeWidth };
        addShape(finalShape);
        break;
      }

      case "line": {
        const width = offsetX - startX;
        const height = offsetY - startY;
        finalShape = { type: "line", x: startX, y: startY, width, height, color, strokeWidth };
        addShape(finalShape);
        break;
      }

      case "arrow": {
        const width = offsetX - startX;
        const height = offsetY - startY;
        finalShape = { type: "arrow", x: startX, y: startY, width, height, color, strokeWidth };
        addShape(finalShape);
        break;
      }

      case "diamond": {
        const width = offsetX - startX;
        const height = offsetY - startY;
        const x = startX + width / 2;
        const y = startY + height / 2;
        finalShape = { type: "diamond", x, y, width, height, color, strokeWidth };
        addShape(finalShape);
        break;
      }

      case "freehand": {
        finalShape = { type: "freehand", points: smoothPoints, color, strokeWidth };
        addShape(finalShape);
        setSmoothPoints([]);
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
        };
        addShape(finalShape);
        break;
      }
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ type: "add", shape: finalShape });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "drawShape",
        data: { canvasId, shape: finalShape}
      }));
    }

    setMyTempShape(null);
    setFreehandPoints([]);
    setFreehandPoints([]);
  }, [isDrawing, startX, startY, tool, myTempShape, history, historyIndex, addShape, color, strokeWidth, smoothPoints]);

  const undo = useCallback(() => {
    if(historyIndex > -1){
      const lastAction = history[historyIndex];
      setHistoryIndex(prev => prev -1);

      if(lastAction.type === "add"){
        const shapeIdToDelete = lastAction.shape.id;
        if (shapeIdToDelete) {
          setShapes(prev => prev.filter(s => s.id !== shapeIdToDelete));

          if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify({
              type: "deleteShape",
              data: { id: shapeIdToDelete, canvasId }
            }));
          }
        }
      }else if (lastAction.type === "delete") {
      // Redo a deletion (add the shape back)
        if (lastAction.shape.id) {
          setShapes(prev => [...prev, lastAction.shape]);
          
          if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify({
              type: "drawShape",
              data: {
                canvasId,
                shape: lastAction.shape
              }
            }));
          }
        }
      }
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, setShapes]);

  const redo = useCallback(() => {
    if(historyIndex < history.length - 1){
      const nextAction = history[historyIndex + 1];
      // setHistoryIndex(prev => prev + 1);

      if(nextAction.type === "add"){
        setShapes(prev => [...prev, nextAction.shape]);

        if(wsRef && wsRef.current.readyState === WebSocket.OPEN){
          wsRef.current.send(JSON.stringify({
            type: "drawShape",
            data: {
              canvasId,
              shape: nextAction.shape
            }
          }));
        }
      }else if(nextAction.type === "delete"){
        const shapeIdToDelete = nextAction.shape.id;
        if (shapeIdToDelete) {
          setShapes(prev => prev.filter(s => s.id !== shapeIdToDelete));

          if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify({
              type: "deleteShape", 
              data: { id: shapeIdToDelete, canvasId }
            }));
          }
        }
      }  
      setHistoryIndex(i => i + 1);
    }
  }, [history, historyIndex, setShapes]);
  return { handleMouseDown, handleMouseMove, handleMouseUp, undo, redo, isDrawing, isErasing };
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
