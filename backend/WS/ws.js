import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import prisma from '../config/db.js';
import path from "path";

// Global first
dotenv.config({
  path: path.resolve(process.cwd(), "../config/.env")
});

// WS-specific
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true
});

const server = new WebSocketServer({port: process.env.PORT , maxPayload: 1024 * 1024 * 10}); // 10 MB

const canvasClient = new Map();

// ====== DATABASE RETRY LOGIC ======
async function retryDatabaseOperation(operation, maxRetries = 3, initialDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            // Check if it's a connection error
            if (error.code === 'P1001' || error.code === 'P1017') {
                console.log(`Database connection failed (attempt ${attempt}/${maxRetries})`);
                
                if (attempt === maxRetries) {
                    throw error; // Give up after max retries
                }
                
                // Exponential backoff: wait longer each time
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Try to reconnect Prisma
                try {
                    await prisma.$connect();
                } catch (reconnectError) {
                    console.log('Prisma reconnect attempt failed, will retry operation');
                }
            } else {
                // If it's not a connection error, throw immediately
                throw error;
            }
        }
    }
}

// Wrapper functions for database operations
async function createShape(data) {
    return retryDatabaseOperation(() => prisma.shape.create({ data }));
}

async function findManyShapes(where) {
    return retryDatabaseOperation(() => prisma.shape.findMany({ where }));
}

async function createCollaboration(data) {
    return retryDatabaseOperation(() => prisma.collaboration.create({ data }));
}

async function createHistory(data) {
    return retryDatabaseOperation(() => prisma.history.create({ data }));
}

async function deleteShape(where) {
    return retryDatabaseOperation(() => prisma.shape.delete({ where }));
}

async function updateShape(where, data) {
    return retryDatabaseOperation(() => prisma.shape.update({ where, data }));
}

async function deleteCollaborations(where) {
    return retryDatabaseOperation(() => prisma.collaboration.deleteMany({ where }));
}

// ====== BROADCAST FUNCTION ======
function broadCast(message, canvasId, sender){
    const set = canvasClient.get(canvasId);
    if(!set || set.size === 0) return;
    
    for(const client of set){
        if(client.readyState === client.OPEN){
            client.send(message);
        }
    }
}

// ====== WEBSOCKET SERVER ======
server.on('connection', (ws, req) => {
    ws.on('error', console.error);

    let canvasId = null;
    let userId = null;

    console.log('new client connected');

    ws.on('message', async(message) => {
        try{
            const {type, data} = JSON.parse(message);
            canvasId = data.canvasId;
            const role = data.role || 'EDITOR';

            if(type === 'joinCanvas'){
                userId = data.userId;
                
                if(!canvasClient.has(canvasId)) {
                    canvasClient.set(canvasId, new Set());
                }

                ws.canvasId = canvasId;
                canvasClient.get(canvasId).add(ws);

                console.log(`Client joined canvas ${canvasId}`);
                
                try{
                    const shapes = await findManyShapes({canvasId});
                    console.log('Fetched initial shapes for:', userId, canvasId);
                    
                    const collaborators = await createCollaboration({
                        canvasId,
                        userId,
                        role: role.toUpperCase()
                    });
                    
                    ws.send(JSON.stringify({
                        type: 'initialShapes',
                        data: shapes,
                        collaborators_space: collaborators
                    }));
                } catch (err) {
                    console.error('Error fetching shapes:', err);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to fetch initial shapes. Database may be starting up.'
                    }));
                }
            }

            if(type === 'drawLiveShape') {
                const { shape } = data;
                const canvasId = data.canvasId;

                broadCast(JSON.stringify({ 
                    type: 'liveShapeUpdate', 
                    data: shape 
                }), canvasId, ws);
            }

            if(type === 'drawShape'){
                const { shape, tempId } = data;
                const shapeType = typeof shape.type === "string" ? shape.type.toUpperCase() : null;

                const allowedTypes = ["RECTANGLE", "CIRCLE", "LINE", "ARROW", "DIAMOND", "TEXT", "PENCIL", "ERASER"];
                if (!allowedTypes.includes(shapeType)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Invalid shape type"
                    }));
                    return;
                }
                
                if(role === 'VIEWER'){
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'You do not have permission to draw shapes'
                    }));
                    return;
                }

                const clients = canvasClient.get(canvasId) || [];

                if(clients.size === 0){
                    console.error(`Client not part of canvas ${canvasId}`);
                    return;
                }
                
                try{
                    console.log('Draw shape request:', shape);
                    
                    const shapeData = await createShape({
                        canvas:{
                            connect: {id: canvasId}
                        },
                        type: shapeType,
                        x: shape.startPos.x, 
                        y: shape.startPos.y,
                        width: Math.abs(shape.endPos.x - shape.startPos.x) || 0,
                        height: Math.abs(shape.endPos.y - shape.startPos.y) || 0,
                        radius: shape.radius || null,
                        points: shape.points || null,
                        rotation: shape.rotation || 0,
                        lineType: shape.lineType || 'SOLID',
                        color: shape.color || '#ffffff',
                        fillColor: shape.fillColor || null
                    });
                    
                    console.log('Shape saved:', shapeData);
                    
                    // Save to history (non-blocking, don't wait)
                    createHistory({
                        canvasId,
                        action: "add_shape",
                        data: shapeData
                    }).catch(err => console.error('Failed to save history:', err));
                    
                    broadCast(JSON.stringify({
                        type: 'newShape', 
                        data: {
                            shapeData,
                            tempId: tempId
                        }
                    }), canvasId, ws);
                    
                } catch(err) {
                    console.error('Error saving shape:', err);
                    
                    const errorMessage = err.code === 'P1001' 
                        ? 'Database connection lost. Your drawing is shown but not saved. Please try again.'
                        : 'Failed to save shape';
                    
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: errorMessage
                    }));
                    return;
                }
            }

            if(type === 'deleteShape'){
                console.log('Delete shape request:', data);
                const { id } = data;
                
                if(!id) {
                    console.error('Shape ID is required for deletion');
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Shape ID is required for deletion"
                    }));
                    return;
                }

                try{
                    const deletedShape = await deleteShape({id});
                    console.log('Successfully deleted shape:', deletedShape);

                    // Save to history (non-blocking)
                    createHistory({
                        canvasId: ws.canvasId,
                        action: "delete_shape",
                        data: deletedShape
                    }).catch(err => console.error('Failed to save history:', err));

                    broadCast(JSON.stringify({type: 'deleteShape', data: {id}}), canvasId, ws);
                    
                } catch (err){
                    console.error("error deleting shape: ", err);
                    
                    if(err.code === "P2025"){
                        console.log(`Shape ${id} already deleted. Ignoring.`);
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "Shape not found or already deleted"
                        }));
                    } else {
                        console.error("Error deleting shape:", err);
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "Failed to delete shape"
                        }));
                    }
                }
            }

            if(type === 'moveShape'){
                const shapeId = data.shape.id;
                const shape = data.shape;
                
                try{
                    const updatedShape = await updateShape(
                        {id: shapeId},
                        {
                            canvas: {
                                connect: {id: data.canvasId}
                            },
                            x: shape.x,
                            y: shape.y,
                            width: shape.width || null,
                            height: shape.height || null,
                            radius: shape.radius || null,
                            points: shape.points || [],
                            rotation: shape.rotation || 0,
                            lineType: shape.lineType || 'SOLID',
                            color: shape.color || '#ffffff',
                            fillColor: shape.fillColor || null
                        }
                    );

                    // Save to history (non-blocking)
                    createHistory({
                        canvasId: data.canvasId,
                        action: "move_shape",
                        data: updatedShape
                    }).catch(err => console.error('Failed to save history:', err));

                    broadCast(JSON.stringify({type: 'shapeMoved', data: updatedShape}), canvasId, ws);
                    
                } catch(err) {
                    console.error('Error moving shape:', err);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to move shape'
                    }));
                }
            }
        } catch(err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', async () => {
        if(ws.canvasId && canvasClient.has(ws.canvasId) && userId){
            canvasClient.get(ws.canvasId).delete(ws);

            if(canvasClient.get(ws.canvasId).size === 0){
                canvasClient.delete(ws.canvasId);
                console.log(`All clients disconnected from canvas ${ws.canvasId}`);
            }

            try {
                await deleteCollaborations({
                    canvasId: ws.canvasId,
                    userId: userId
                });
            } catch (err) {
                console.error('Error removing collaboration:', err);
            }

            broadCast(JSON.stringify({
                type: 'userDisconnected',
                data: {userId, canvasId: ws.canvasId}
            }), ws.canvasId, ws);
        }
    });
});

server.on("listening", () => {
    console.log(`WebSocket server running on ws://localhost:${process.env.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
});