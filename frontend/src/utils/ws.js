// websocket.js
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.canvasId = null;
    this.userId = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(canvasId, userId, role = 'EDITOR') {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket is already connecting or open.");
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      try {
        this.canvasId = canvasId;
        this.userId = userId;
        
        // Connect to WebSocket server
        this.ws = new WebSocket(`ws://localhost:${import.meta.env.VITE_WS_PORT || 8080}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Join canvas
          this.send({
            type: 'joinCanvas',
            data: {
              canvasId: this.canvasId,
              userId: this.userId,
              role: role
            }
          });

          // Send queued messages
          this.flushMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };

      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  handleMessage(message) {
    const { type, data } = message;
    
    // Call registered event handlers
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Register event handler
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    // Optional: prevent duplicate identical functions
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  // Unregister event handler
  off(eventType, handler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Send message to server
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      const state = this.ws ? this.ws.readyState : 'NULL';
      console.warn(`WebSocket not ready (State: ${state}). Queuing message:`, message.type);
      this.messageQueue.push(message);
    }
  }

  // Flush queued messages
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  // Draw live shape (real-time preview)
  drawLiveShape(shape, userId) {
    this.send({
      type: 'drawLiveShape',
      data: {
        shape,
        userId,
        canvasId: this.canvasId
      }
    });
  }

  // Draw shape (finalize and save to DB)
  drawShape(shape) {
    this.send({
      type: 'drawShape',
      data: {
        shape,
        canvasId: this.canvasId
      }
    });
  }

  // Delete shape
  deleteShape(shapeId) {
    console.log("WS Client sending delete request for ID:", shapeId);
    this.send({
      type: 'deleteShape',
      data: {
        id: shapeId,
        canvasId: this.canvasId
      }
    });
  }

  // Move shape
  moveShape(shape) {
    this.send({
      type: 'moveShape',
      data: {
        shape,
        canvasId: this.canvasId
      }
    });
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.canvasId && this.userId) {
          this.connect(this.canvasId, this.userId);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
const wsClient = new WebSocketClient();

export default wsClient;