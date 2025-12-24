import { createContext, useRef, useState, useEffect } from "react";
import wsClient from "../utils/ws";

export const canvasContext = createContext(null);

export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState(null);
  const isDrawing = useRef(false);
  const historyRef = useRef({
    undoStack: [],
    redoStack: [],
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasID = localStorage.getItem("currentCanvasId");
  const userID = JSON.parse(localStorage.getItem("userInfo")).id;
  // const userId = localStorage.getItem("userId");
  
  useEffect(() => {
    // Get data from localStorage
    const savedCanvasID = localStorage.getItem("currentCanvasId");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const savedUserID = userInfo.id;

    if (savedCanvasID && savedUserID) {
      console.log("Auto-connecting to WebSocket...");
      initializeWebSocket(savedCanvasID, savedUserID);
    }

    // Cleanup function: runs when the app closes or component unmounts
    return () => {
      // console.log("Cleaning up WebSocket...");
      wsClient.disconnect();
      // This prevents the "multiple logs" by clearing old listeners
      if (wsClient.eventHandlers) {
        wsClient.eventHandlers.clear();
      }
    };
  }, []);


  // Initialize WebSocket connection
  const initializeWebSocket = async (canvasId, userId, role = 'EDITOR') => {
    try {
      await wsClient.connect(canvasId || canvasID, userId || userID, role);
      setIsConnected(true);
      console.log(userID, 'connected to canvas', canvasID);
      // Handle initial shapes
      wsClient.on('initialShapes', (data) => {
        console.log('Received initial shapes:', data);
        setShapes(data.data || []);
        setCollaborators(data.collaborators_space);
      });

      // Handle new shape from other users
      wsClient.on('newShape', (data) => {
        console.log('New shape received:', data);
        setShapes(prev => {
          // Replace temp shape with real shape from server
          if (data.tempId) {
            return prev.map(shape => 
              shape.id === data.tempId ? data.shapeData : shape
            );
          }
          // Add new shape from other users
          return [...prev, data.shapeData];
        });
      });

      // Handle live shape updates (real-time drawing preview)
      wsClient.on('liveShapeUpdate', (data) => {
        console.log('Live shape update:', data);
        // You can implement real-time cursor/drawing preview here
      });

      // Handle shape deletion
      wsClient.on('deleteShape', (data) => {
        console.log('Shape deleted:', data);
        setShapes(prev => prev.filter(shape => shape.id !== data.id));
      });

      // Handle shape movement
      wsClient.on('shapeMoved', (data) => {
        console.log('Shape moved:', data);
        setShapes(prev => 
          prev.map(shape => shape.id === data.id ? data : shape)
        );
      });

      // Handle user disconnection
      wsClient.on('userDisconnected', (data) => {
        console.log('User disconnected:', data);
      });

      // Handle errors
      wsClient.on('error', (data) => {
        const errorMsg = data?.message || "An unknown error occurred";
        console.error('WebSocket error:', errorMsg);
        alert(errorMsg);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Disconnect WebSocket on unmount
  useEffect(() => {
    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Helper to push state into history
  const pushToHistory = (newShapes) => {
    historyRef.current.undoStack.push([...shapes]);
    historyRef.current.redoStack = [];
    setShapes(newShapes);
  };

  // Undo action
  const undo = () => {
    const { undoStack, redoStack } = historyRef.current;
    if (undoStack.length === 0) return;
    redoStack.push([...shapes]);
    const previous = undoStack.pop();
    setShapes(previous);
  };

  // Redo action
  const redo = () => {
    const { undoStack, redoStack } = historyRef.current;
    if (redoStack.length === 0) return;
    undoStack.push([...shapes]);
    const next = redoStack.pop();
    setShapes(next);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Send shape to server via WebSocket
  const addShapeToServer = (shape) => {
    // Generate temporary ID
    wsClient.drawShape(shape);
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const shapeWithTempId = { ...shape, id: tempId };
    
    // Add to local state immediately for responsiveness
    setShapes(prev => [...prev, shapeWithTempId]);
    
    // Send to server
    // wsClient.drawShape(shape);
  };

  // Delete shape via WebSocket
  const deleteShapeFromServer = (shapeId) => {
    // Remove from local state immediately
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
    
    // Send delete request to server
    wsClient.deleteShape(shapeId);
  };

  // Move shape via WebSocket
  const moveShapeOnServer = (shape) => {
    // Update local state immediately
    setShapes(prev => 
      prev.map(s => s.id === shape.id ? shape : s)
    );
    
    // Send to server
    wsClient.moveShape(shape);
  };

  return (
    <canvasContext.Provider
      value={{
        shapes,
        setShapes,
        selectedShape,
        setSelectedShape,
        isDrawing,
        pushToHistory,
        undo,
        redo,
        zoomLevel,
        setZoomLevel,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        panOffset,
        setPanOffset,
        isPanning,
        lastPanPoint,
        // WebSocket specific
        isConnected,
        initializeWebSocket,
        addShapeToServer,
        deleteShapeFromServer,
        moveShapeOnServer,
        wsClient,
        collaborators,
        canvasID,
        userID,
      }}
    >
      {children}
    </canvasContext.Provider>
  );
}