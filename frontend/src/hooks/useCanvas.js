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
  const deletedInSession = useRef(new Set());
  // Add this ref at the top of useCanvas
  const lastUpdateRef = useRef(0);
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
    // Clear the whole canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    shapes.forEach((shape) => drawShape(ctx, shape));
    
   
    ctx.restore();
  }, [shapes, panOffset, zoomLevel, mainCanvasRef]);

  // Canvas Resolution
  useEffect(() => {
    const resize = () => {
        const canvas = mainCanvasRef.current;
        if (canvas) {
            // Set internal resolution to match display size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            // Trigger a redraw after resizing
            drawAllShapes();
        }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [mainCanvasRef, drawAllShapes]);
  
  useEffect(() => {
    console.log('Redrawing all shapes due to shapes change');
    console.log('Current shapes:', shapes);
    drawAllShapes();
  }, [drawAllShapes, shapes]);

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
      lineWidth: 2,
      points: [worldPos]
    };

    if (selectedShape === "pencil") {
      newShape.points = [worldPos];
    }

    liveShapeRef.current = newShape;

    if (selectedShape === "eraser") {
      // 1. Find the shape being clicked
      const shapeToDelete = shapes.find(s => isPointInShape(worldPos.x, worldPos.y, s, 20));
      
      if (shapeToDelete) {
          // 2. Remove from local UI immediately
          console.log("Found shape to delete:", shapeToDelete);
          // 3. Tell the server to delete it from DB and other users
          if (shapeToDelete.id && wsClient?.readyState === WebSocket.OPEN) {
            setShapes(prev => prev.filter(s => s.id !== shapeToDelete.id));
            deleteShapeFromServer(shapeToDelete.id);
          } else {
            console.warn("Shape found but has no ID yet (still syncing with server)");
          }
      } else {
        console.log("No shape found at position:", worldPos);
      }
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

    if (isDrawing.current && selectedShape === "eraser") {
        // Check for shapes under the cursor while moving
        const shapeToDelete = shapes.find(s => isPointInShape(worldPos.x, worldPos.y, s, 20));
        
        if (shapeToDelete && shapeToDelete.id && !deletedInSession.current.has(shapeToDelete.id)) {
          deletedInSession.current.add(shapeToDelete.id);  
          setShapes(prev => prev.filter(s => s.id !== shapeToDelete.id));
            deleteShapeFromServer(shapeToDelete.id);
        }
    }

    // Update live shape
    if (selectedShape === "pencil") {
      // Ensure the points array exists
      if (!liveShapeRef.current.points) {
          liveShapeRef.current.points = [startPos];
      }
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
    
    const now = Date.now();
    if (now - lastUpdateRef.current > 30 && selectedShape !== "eraser") { 
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.drawLiveShape(liveShapeRef.current, userIdRef.current);
      }
      lastUpdateRef.current = now;
    }
  }, [screenToWorld, panOffset, zoomLevel, tempCanvasRef, selectedShape, wsClient]);

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    isPanning.current = false;
    
    isDrawing.current = false;
    deletedInSession.current.clear();
    const tempCtx = tempCanvasRef.current?.getContext("2d");
    tempCtx?.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);

    if (liveShapeRef.current && selectedShape !== "eraser") {
      addShapeToServer(liveShapeRef.current);
    }
    liveShapeRef.current = null;
  }, [addShapeToServer, selectedShape, tempCanvasRef]);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};