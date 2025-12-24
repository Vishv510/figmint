import { useCallback, useContext, useRef, useState, useEffect } from "react";
import { canvasContext } from "../context/canvasContext";
import { drawShape } from "../utils/drawShape";
import { isPointInShape } from "../utils/shapeUtils";

export const useCanvas = (mainCanvasRef, tempCanvasRef) => {
  const {
    setShapes,
    isDrawing,
    selectedShape,
    shapes,
    panOffset,
    setPanOffset,
    isPanning,
    lastPanPoint,
    zoomLevel,
    addShapeToServer,
    deleteShapeFromServer,
    wsClient,
    initializeWebSocket // Make sure this is pulled from context
  } = useContext(canvasContext);

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const liveShapeRef = useRef(null);
  const eraserSizeRef = useRef(20);
  const erasePoint = useRef([]);
  const userIdRef = useRef(JSON.parse(localStorage.getItem("userInfo")).id);
  console.log('useCanvas userIdRef:', userIdRef.current);

  // FIX: Initialize WebSocket on mount
  useEffect(() => {
    const canvasId = localStorage.getItem("currentCanvasId"); // Or get from URL params
    initializeWebSocket(canvasId, userIdRef.current);
  }, [initializeWebSocket]);

  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - panOffset.x) / zoomLevel,
      y: (screenY - panOffset.y) / zoomLevel,
    };
  }, [panOffset, zoomLevel]);

  const drawAllShapes = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    shapes.forEach((shape) => drawShape(ctx, shape));
    ctx.restore();
  }, [shapes, panOffset, zoomLevel, mainCanvasRef]);

  useEffect(() => {
    drawAllShapes();
  }, [drawAllShapes]);

  const handleMouseDown = useCallback((e) => {
    if (!selectedShape) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const worldPos = screenToWorld(offsetX, offsetY);

    if (selectedShape === "hand") {
      isPanning.current = true;
      lastPanPoint.current = { x: offsetX, y: offsetY };
      return;
    }

    isDrawing.current = true;
    setStartPos(worldPos);

    // FIX: Structure shapes to match what shapeUtils.js expects (startPos/endPos)
    let newShape = {
      type: selectedShape.toLowerCase(),
      startPos: worldPos,
      endPos: worldPos,
      color: "#000000",
      lineWidth: 2
    };

    if (selectedShape === "pencil") {
      newShape.points = [worldPos];
    }

    liveShapeRef.current = newShape;

    if (selectedShape === "eraser") {
      // Immediate erase logic
      setShapes(prev => prev.filter(s => !isPointInShape(worldPos.x, worldPos.y, s, 10, eraserSizeRef.current)));
    }
  }, [selectedShape, screenToWorld, isDrawing, isPanning, setShapes]);

  const handleMouseMove = useCallback((e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const worldPos = screenToWorld(offsetX, offsetY);
    const tempCtx = tempCanvasRef.current?.getContext("2d");

    if (isPanning.current) {
      const dx = offsetX - lastPanPoint.current.x;
      const dy = offsetY - lastPanPoint.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: offsetX, y: offsetY };
      return;
    }

    if (!isDrawing.current || !liveShapeRef.current) return;

    // Update live shape
    if (selectedShape === "pencil") {
      liveShapeRef.current.points.push(worldPos);
    } else {
      liveShapeRef.current.endPos = worldPos;
    }

    // Draw Preview
    if (tempCtx) {
      tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
      tempCtx.save();
      tempCtx.translate(panOffset.x, panOffset.y);
      tempCtx.scale(zoomLevel, zoomLevel);
      drawShape(tempCtx, liveShapeRef.current);
      tempCtx.restore();
    }
    
    // Send preview to others
    wsClient.drawLiveShape(liveShapeRef.current, userIdRef.current);
  }, [screenToWorld, panOffset, zoomLevel, tempCanvasRef, selectedShape, wsClient]);

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    isPanning.current = false;
    
    const tempCtx = tempCanvasRef.current?.getContext("2d");
    tempCtx?.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);

    if (liveShapeRef.current && selectedShape !== "eraser") {
      addShapeToServer(liveShapeRef.current);
    }
    liveShapeRef.current = null;
  }, [addShapeToServer, selectedShape, tempCanvasRef]);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};