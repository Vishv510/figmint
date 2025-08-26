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

  // New state for undo/redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const wsRef = useRef(null);
  const lastEraseTime = useRef(0);
  const ERASE_DEBOUNCE_MS = 50;
  const deletedShapeIds = useRef(new Set()); // Track already deleted shapes
  
  //websocket setup
  useEffect(() => {
    if(!wsRef.current){
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connencted");
        ws.send(JSON.stringify({
          type: "joinCanvas",
          data: {canvasId, userId}
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
  }, [setShapes]);

  const redrawCanvas = useCallback(
    (ctx) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw shapes
      shapes.forEach((shape) => {
        drawShape(ctx, shape);
      });
      
      if(myTempShape) {
        drawShape(ctx, myTempShape);
      }
      
      liveShapes.forEach((shape) => drawShape(ctx, shape));
      
      // Draw eraser path (visual feedback)
      if (tool === "eraser" && eraserPath.length > 0) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        eraserPath.forEach((point, index) => {
          if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
      
      // Draw current eraser position
      if (eraserPath.length > 0) {
        const lastPoint = eraserPath[eraserPath.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  },[shapes, myTempShape, liveShapes, tool, eraserPath]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    redrawCanvas(ctx);
    
    if(tool === "eraser" && isErasing){
      ctx.beginPath();
      ctx.arc(startX, startY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [canvasRef, redrawCanvas, tool, isErasing, startX, startY]);
  
  const eraseAtPosition = useCallback((x, y) => {
    console.log('Eraser at position:', x, y);
    const now = Date.now();
    if (now - lastEraseTime.current < ERASE_DEBOUNCE_MS) {
      return;
    }
    lastEraseTime.current = now;

    const validShapes = shapes.filter(shape => shape && shape.id);
    const shapesToDelete = validShapes.filter(shape => {
      if(deletedShapeIds.current.has(shape.id)) return false;
      return isPointInsideShape(x, y, shape);
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
    
    setIsDrawing(true);
    setStartX(offsetX);
    setStartY(offsetY);

    deletedShapeIds.current.clear();

    if(tool === "eraser"){
      console.log('Eraser clicked at:', offsetX, offsetY);
      setIsErasing(true);
      eraseAtPosition(offsetX, offsetY);
      setEraserPath([{x: offsetX, y: offsetY}]);
      return ;
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
    if (!isDrawing || !myTempShape) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if(tool === "eraser" && isErasing){
      eraseAtPosition(offsetX, offsetY);
      setEraserPath(prev => [...prev, {x: offsetX, y: offsetY}]);
      return ;
    }
    
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
          Math.pow(offsetX - startY, 2) + Math.pow(offsetY - startY, 2)
        );
        break;

      case "freehand":
        updatedShape.points = [...freehandPoints, {x: offsetX, y:offsetY}];
        setFreehandPoints(updatedShape.points);
        break;
    }

    setMyTempShape(updatedShape);

    if(tool !== "eraser" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "drawLiveShape",
        data: {canvasId, shapes: updatedShape}
      }));
    }
  }, [isDrawing, myTempShape, startX, startY, tool, freehandPoints, isErasing, eraseAtPosition]); 

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

    if (tool === "rectangle") {
      const x = Math.min(startX, offsetX);
      const y = Math.min(startY, offsetY);
      const width = Math.abs(offsetX - startX);
      const height = Math.abs(offsetY - startY);
      addShape({ type: "rectangle", x, y, width, height, color, strokeWidth });
    }
    else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2)
      );
      addShape({ type: "circle", x: startX, y: startY, radius, color, strokeWidth });
    }
    else if (tool === "line") {
      const width = offsetX - startX;
      const height = offsetY - startY;
      addShape({ type: "line", x: startX, y: startY, width, height, color, strokeWidth });
    }
    else if (tool === "arrow") {
      const width = offsetX - startX;
      const height = offsetY - startY;
      addShape({ type: "arrow", x: startX, y: startY, width, height, color, strokeWidth });
    }
    else if (tool === "diamond") {
      const width = offsetX - startX;
      const height = offsetY - startY;
      const x = startX + width / 2;
      const y = startY + height / 2;
      addShape({ type: "diamond", x, y, width, height, color, strokeWidth });
    }
    else if (tool === "freehand") {
      addShape({ type: "freehand", points: freehandPoints, color, strokeWidth });
      setFreehandPoints([]);
    }
    else if (tool === "text") {
      addShape({
        type: "text",
        x: startX,
        y: startY,
        text: "Your Text",
        color,
        fontSize: 16,
      });
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
  }, [isDrawing, startX, startY, tool, freehandPoints, myTempShape, history, historyIndex, addShape, color, strokeWidth]);

  const undo = useCallback(() => {
    if(historyIndex > -1){
      const lastAction = history[historyIndex];
      setHistoryIndex(prev => prev -1);

      if(lastAction.type === "add"){
        const shapeIdToDelete = lastAction.shape.id;
        setShapes(prev => prev.filter(s => s.id !== shapeIdToDelete));

        if(wsRef && wsRef.current.readyState === WebSocket.OPEN){
         const shapeIdToDelete = lastAction.shape.id;
          // Only proceed if we have a valid ID
          if (shapeIdToDelete) {
            setShapes(prev => prev.filter(s => s.id !== shapeIdToDelete));

            if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
              wsRef.current.send(JSON.stringify({
                type: "deleteShape",
                data: {
                  id: shapeIdToDelete,
                  canvasId
                }
              }));
            }
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
    }
  }, [history, historyIndex, setShapes]);

  // const redo = useCallback(() => {
  //   if(historyIndex < history.length - 1){
  //     const nextAction = history[historyIndex + 1];
  //     setHistoryIndex(prev => prev + 1);

  //     if(nextAction.type === "add"){
  //       setShapes(prev => [...prev, nextAction.shape]);

  //       if(wsRef && wsRef.current.readyState === WebSocket.OPEN){
  //         wsRef.current.send(JSON.stringify({
  //           type: "drawShape",
  //           data: {
  //             canvasId,
  //             shape: nextAction.shape
  //           }
  //         }));
  //       }
  //     }
  //   }
  // }, [history, historyIndex, setShapes]);
    

  return { handleMouseDown, handleMouseMove, handleMouseUp, undo };
}



//helper function:
function isPointInsideShape(x, y, shape){
  if(!shape )return false;

  switch (shape.type.toLowerCase()) {
    case "rectangle" : 
      return (
        x >= shape.x &&
        x <= shape.x + (shape.width || 0) &&
        y >= shape.y && 
        y <= shape.y + (shape.height || 0)
      );

    case "circle":  {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const radius = shape.radius || 0;
      return dx * dx + dy * dy <= radius * radius;
    }

    case "line":
    case "arrow": 
      return pointNearLine(
        x, y, 
        shape.x, shape.y, 
        shape.x + (shape.width || 0), 
        shape.y + (shape.height || 0)
      );

    case "freehand":{
      if(!shape.points || shape.points.length === 0)  return false;

      return shape.points?.some(p => 
        Math.abs(x - p.x) < 10 && Math.abs(y - p.y) < 10
      );}

    case "text":{
      const textWidth = (shape.text || '').length * (shape.fontSize || 16) * 0.6;
      const textHeight = shape.fontSize || 16;
      return (
        x >= shape.x &&
        x <= shape.x + textWidth &&
        y >= shape.y - textHeight &&
        y <= shape.y
      )
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
