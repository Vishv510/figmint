import { createContext, useRef, useState, useEffect, useCallback } from "react";
import wsClient from "../utils/ws";

export const canvasContext = createContext(null);

export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
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
  const listenersRef = useRef(false);
  const currentCanvasIdRef = useRef(null);
  const lastErrorTimeRef = useRef(0);
  
  useEffect(() => {
    // Get data from localStorage
    const savedCanvasID = localStorage.getItem("currentCanvasId");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const savedUserID = userInfo.id;

    let isSubscribed = true;
    if (savedCanvasID && savedUserID && isSubscribed) {
      console.log("Auto-connecting to WebSocket...");
      if (!isConnected) {
        initializeWebSocket(savedCanvasID, savedUserID);
      }
    }

    return () => {
      isSubscribed = false;
      wsClient.disconnect();
    };
  }, []);


  // Initialize WebSocket connection
  const initializeWebSocket = useCallback( async (canvasId, userId, role = 'EDITOR') => {
    console.log("You are in InitailizeWebsocket");
    console.log("CanvasId: " + canvasId);
    console.log("userId: " + userId);

     const isNewCanvas = currentCanvasIdRef.current !== canvasId;
    
    if (listenersRef.current && !isNewCanvas) {
      console.log("Listeners already registered, skipping...");
      return;
    }

    if (isNewCanvas && listenersRef.current) {
      console.log("Switching to new canvas, cleaning up old connection...");
      // Clean up old connection
      wsClient.disconnect();
      listenersRef.current = false;
      setShapes([]); // Clear old shapes
    }

    try {
      await wsClient.connect(canvasId , userId , role);
      setIsConnected(true);
      setConnectionError(null);
      currentCanvasIdRef.current = canvasId; 

      // CRITICAL: Remove all existing listeners before adding new ones
      // to prevent the "5x log" and duplicate execution bug.
      wsClient.off('initialShapes'); 
      wsClient.off('newShape');
      wsClient.off('deleteShape');
      wsClient.off('shapeMoved');
      wsClient.off('liveShapeUpdate');
      wsClient.off('userDisconnected');
      wsClient.off('error');

      console.log(userId, 'connected to canvas', canvasId);
      // Handle initial shapes
      wsClient.on('initialShapes', (data) => {
        console.log('Received initial shapes:', data);
        if (data) {
          const shapesData = Array.isArray(data) ? data : (data.data || []);
          setShapes(shapesData);
          if (data.collaborators_space) {
            setCollaborators(data.collaborators_space);
          }
        }
      });

      // Handle new shape from other users
      wsClient.on('newShape', (data) => {
        console.log('New shape received:', data);
        setShapes(prev => {
          if (data.tempId) {
            console.log(`Replacing temp shape ${data.tempId} with real shape ID ${data.shapeData.id}`);
            
            const updated = prev.map(shape => {
              if (shape.id === data.tempId) {
                console.log('Found and replaced temp shape');
                return data.shapeData;
              }
              return shape;
            });
            
            // Verify replacement happened
            const foundReplacement = updated.some(s => s.id === data.shapeData.id);
            if (!foundReplacement) {
              console.warn('Temp shape not found, adding new shape instead');
              return [...prev, data.shapeData];
            }
            
            return updated;
          }
          
          // Add new shape from other users (not our temp shape)
          const shapeId = data.shapeData?.id || data.id;
          const exists = prev.some(s => s.id === shapeId);
          
          if (exists) {
            console.log('Shape already exists, skipping:', shapeId);
            return prev;
          }
          
          console.log('Adding new shape from other user:', shapeId);
          return [...prev, data.shapeData || data];
        });
        console.log("All shapes: " + shapes);
      });

      // Handle live shape updates (real-time drawing preview)
      wsClient.on('liveShapeUpdate', (data) => {
        console.log('Live shape update:', data);
        drawShape()
        // You can implement real-time cursor/drawing preview here
      });

      // Handle shape deletion
      wsClient.on('deleteShape', (data) => {
        console.log('Shape deleted: ', data);
        setShapes(prev => prev.filter(shape => shape.id !== data.id));
        pendingDeletions.current.delete(data.id);
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
        const now = Date.now();
        console.log('ERROR - Full data object:', data);
        console.log('ERROR - data type:', typeof data);
        console.log('ERROR - data keys:', data ? Object.keys(data) : 'data is null/undefined');
        
        const errorMsg = data?.message || data?.error || data?.msg || JSON.stringify(data) || "An unknown error occurred";
        
        console.error('WebSocket error:', errorMsg);
        alert(errorMsg);
        lastErrorTimeRef.current = now;
      });

      listenersRef.current = true;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setIsConnected(false);
      setConnectionError(error.message || 'Failed to connect');
    }
  }, []);

  // Disconnect WebSocket on unmount
  useEffect(() => {
    return () => {
      wsClient.disconnect();
      listenersRef.current = false;
      currentCanvasIdRef.current = null;
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
    // wsClient.drawShape(shape);
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const shapeWithTempId = { ...shape, id: tempId };
    
    // Add to local state immediately for responsiveness
    setShapes(prev => [...prev, shapeWithTempId]);
    
    // Send to server
    if (isConnected) {
      wsClient.drawShape(shape, tempId);
    } else {
      console.warn('Not connected to server, shape only stored locally');
      setConnectionError('Not connected - shape saved locally only');
    }
  };

  // Delete shape via WebSocket
  const pendingDeletions = useRef(new Set());
  const deleteShapeFromServer = (shapeId) => {
    if (pendingDeletions.current.has(shapeId)) {
      console.log('Delete already pending for:', shapeId);
      return;
    }

    // Handle temporary shapes (not yet synced to server)
    if (shapeId.startsWith('temp_')) {
      console.log('Removing temp shape locally (not synced to server yet):', shapeId);
      setShapes(prev => prev.filter(shape => shape.id !== shapeId));
      return;
    }
    
    pendingDeletions.current.add(shapeId);
    console.log("Sending delete to server for:", shapeId);
    
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
    
    if (isConnected) {
      wsClient.deleteShape(shapeId);
    } else {
      console.warn('Not connected to server, delete queued');
    }

    // Clear from pending after a short delay or when confirmed
    setTimeout(() => pendingDeletions.current.delete(shapeId), 1000);
  };

  // Move shape via WebSocket
  const moveShapeOnServer = (shape) => {
    // Update local state immediately
    setShapes(prev => 
      prev.map(s => s.id === shape.id ? shape : s)
    );
    
    // Send to server
    if (isConnected) {
      wsClient.moveShape(shape);
    } else {
      console.warn('Not connected to server, move only local');
    }
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
      }}
    >
      {children}
    </canvasContext.Provider>
  );
}