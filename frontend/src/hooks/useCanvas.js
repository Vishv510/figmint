import { useEffect, useState, useCallback, useRef } from "react";
import { drawShape } from "../utils/drawShape.js";
import { useCanvas } from "../context/CanvasContext.jsx";

const canvasId = localStorage.getItem("canvasId");
const userId = localStorage.getItem('userId');

export default function useCanvasDrawing(canvasRef) {
  const { shapes, addShape, setShapes, tool, color, strokeWidth } = useCanvas();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [freehandPoints, setFreehandPoints] = useState([]);

  const [myTempShape, setMyTempShape] = useState(null);
  const [liveShapes, setLiveShape] = useState(new Map());

  // New state for undo/redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const wsRef = useRef(null);

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
          case "initialShapes":
            setShapes(message.data);
            break;

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
      shapes.forEach((shape) => drawShape(ctx, shape));

      if(myTempShape) {
        drawShape(ctx, myTempShape);
      }

      liveShapes.forEach((shape) => drawShape(ctx, shape));
    },
    [shapes, myTempShape, liveShapes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    redrawCanvas(ctx);
  }, [canvasRef, redrawCanvas]);

  const handleMouseDown = useCallback((e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    
    setIsDrawing(true);
    setStartX(offsetX);
    setStartY(offsetY);

    // let shapeType = tool;
    // let shapeColor = color;
    // let shapeStrokeWidth = strokeWidth;
    
    if (tool === "earser") {
      const clickedShapeId = shapes.findLast(
        s => isPointInsideShape(offsetX, offsetY, s) 
      )?.id;
  
      if(clickedShapeId) {
        setShapes(prev => prev.filter(s => s.id !== clickedShapeId));
      }

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

    // if (tool === "freehand") {
    //   setFreehandPoints([{ x: offsetX, y: offsetY }]);
    // }

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "drawLiveShape",
        data: { canvasId, shape: tempShape }
      }));
    }

  }, [tool, color, strokeWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !myTempShape) return;
    const { offsetX, offsetY } = e.nativeEvent;

    let updatedShape = { ...myTempShape };

    // if (tool === "freehand") {
    //   setFreehandPoints((prev) => [...prev, { x: offsetX, y: offsetY }]);
    // }

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

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({
        type: "drawLiveShape",
        data: {canvasId, shapes: updatedShape}
      }));
    }
  }, [isDrawing, myTempShape, startX, startY, tool, freehandPoints]); 

  const handleMouseUp = useCallback((e) => {
    if (!isDrawing || !myTempShape) return;
    setIsDrawing(false);

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
  }, [isDrawing, startX, startY, tool, freehandPoints, myTempShape, history, historyIndex]);

  const undo = useCallback(() => {
    if(historyIndex > -1){
      const lastAction = history[historyIndex];
      setHistoryIndex(prev => prev -1);

      if(lastAction.type === "add"){
        const shapeIdToDelete = lastAction.shape.id;
        setShapes(prev => prev.filter(s => s.id !== shapeIdToDelete));

        if(wsRef && wsRef.current.readyState === WebSocket.OPEN){
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
  }, [history, historyIndex, setShapes]);

  const redo = useCallback(() => {
    if(historyIndex < history.length - 1){
      const nextAction = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);

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
      }
    }
  }, [history, historyIndex, setShapes]);

  return { handleMouseDown, handleMouseMove, handleMouseUp, undo, redo };
}



//helper function:
function isPointInsideShape(x, y, shape){
  switch (shape.type) {
    case "rectangle" : 
      return (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y && 
        y <= shape.y + shape.height
      );

    case "circle":  {
      const dx = x - shape.cx;
      const dy = y - shape.cy;
      return dx * dx + dy * dy <= shape.r * shape.r;
    }

    case "line":
    case "arrow": 
      return pointNearLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2);

    case "freehand":
    case "text":
      return (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y - shape.fontSize &&
        y <= shape.y
      )
  }
}

function pointNearLine(px, py, x1, y1, x2, y2, tolerance = 5){
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

  return dx * dx + dy * dy <= tolerance * tolerance;

}