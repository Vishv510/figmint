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

const server = new WebSocketServer({port: process.env.PORT});

const canvasClient = new Map();

function broadCast(message, canvasId, sender){
    const set = canvasClient.get(canvasId);
    if(!set || set.size === 0) return;
    
    for(const client of set){
        if(client !== sender && client.readyState === client.OPEN){
            client.send(message);
        }
    }
}

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
                // in this i use canvasId in general have one extra table which have canvasId(one) and userId(many) and generated string which use for joining time
                if(!canvasClient.has(canvasId)) {
                    canvasClient.set(canvasId, new Set());
                }

                ws.canvasId = canvasId;
                canvasClient.get(canvasId).add(ws);

                console.log(`Client joined canvas ${canvasId}`);
                
                try{
                    const shapes = await prisma.shape.findMany({
                        where: {canvasId},
                    });
                    console.log('Fetched initial id:', userId, canvasId);
                    const collborators = await prisma.collaboration.create({
                        data: {
                            canvasId,
                            userId,
                            role:  role.toUpperCase()
                        }
                    })
                    ws.send(JSON.stringify({
                        type: 'initialShapes',
                        data: shapes,
                        collaborators_space: collborators
                    }));
                } catch (err) {
                    console.error('Error fetching shapes:', err);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to fetch initial shapes'
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
                const { shape } = data;
                const shapeType = typeof shape.type === "string" ? shape.type.toUpperCase() : null;

                const allowedTypes = ["RECTANGLE", "CIRCLE", "LINE", "ARROW", "DIAMOND", "TEXT", "FREEHAND"];
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
                    return ;
                }

                const clients = canvasClient.get(canvasId) || [];

                if(clients.size === 0){
                    console.error(`Client not part of canvas ${canvasId}`);
                    return;
                }
                try{
                    console.log('Draw shape request:', shape);
                    const shapeData = await prisma.shape.create({
                        data: {
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
                        }
                    });
                    console.log('Shape saved:', shapeData);
                    await prisma.history.create({
                        data: {
                            canvasId,
                            action: "add_shape",
                            data: shapeData
                        }
                    });
                    // console.log('Broadcasting new shape to other clients');
                    broadCast(JSON.stringify({
                        type: 'newShape', 
                        data: shapeData
                    }), canvasId, ws);
                }catch(err) {
                    console.error('Error saving shape:', err);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to save shape'
                    }));
                    return ;
                }
            }

            if(type === 'deleteShape'){
                console.log('Delete shape request:', data);
                const { id } = data;
                if(!id) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Shape ID is required for deletion"
                    }));
                    return ;
                }

                try{
                    const deletedShape = await prisma.Shape.delete({
                        where: {
                            id: data.id
                        }
                    });

                    if(!deletedShape.count){
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Shape not found or already deleted'
                        }));
                        return;
                    }

                    await prisma.History.create({
                        data: {
                            canvas: {
                                connect: {id: ws.canvasId}
                            },
                            action: "delete_shape",
                            data: deletedShape
                        }
                    });

                    broadCast(JSON.stringify({type: 'shapeDeleted', data: deletedShape}), canvasId, ws);
                }catch (err){
                    console.error("error deleting shape: ", err);
                    if(err.code === "P2025"){
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "Shape not found or already deleted"
                        }));
                    }else{
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "failed to deleted shape"
                        }));
                    }
                }
            }


            if(type === 'moveShape'){
                const shapeId = data.shape.id;
                const shape = data.shape;
                try{
                    const updatedShape = await prisma.Shape.update({
                        where: {id: shapeId},
                        data: {
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
                    });

                    await prisma.History.create({
                        data: {
                            canvas: {
                                connect: {id: data.canvasId}
                            },
                            action: "move_shape",
                            data: updatedShape
                        }
                    });

                    broadCast(JSON.stringify({type: 'shapeMoved', data: updatedShape}), canvasId, ws);
                }catch(err) {
                    console.error('Error moving shape:', err);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to move shape'
                    }));
                }
            }
        }catch(err) {
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

            await prisma.Collaboration.deleteMany({
                where: {
                    canvasId: ws.canvasId,
                    userId: userId
                }
            })

            broadCast(JSON.stringify({
                type: 'userDisconnected',
                data: {userId, canvasId: ws.canvasId}
            }), ws.canvasId,ws);
        }
    });
});

server.on("listening", () => {
    console.log(` WebSocket server running on ws://localhost:${process.env.PORT}`);
})