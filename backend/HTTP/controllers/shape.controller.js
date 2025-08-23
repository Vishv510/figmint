import prisma from '../../config/db.js';
import { LineType } from '../../config/generated/prisma/index.js';

export const addShape = async (req, res) => {
    const id = req.body.canvasId;
    try{
        const shape = await prisma.Shape.create({
            data : {
                canvas : {
                    connect: { 
                        id: id
                    }
                },
                type: req.body.type,
                x: req.body.x,
                y: req.body.y,
                width: req.body.width || null,
                height: req.body.height || null,
                radius: req.body.radius || null,
                points: req.body.point || null,
                rotation: req.body.rotation || 0,
                lineType: req.body.lineType || LineType.SOLID,
                color: req.body.color,
                fillColor: req.body.fillColor || null,
            },
        });

        res.json(shape);
    }catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."    
        })
    }
}

export const updateShape = async (req, res) => {
    try{
        const shape = await prisma.Shape.update({
            where : {
                id : req.params.id
            },
            data:{
                type: req.body.type,
                x: req.body.x,
                y: req.body.y,
                width: req.body.width || null,
                height: req.body.height || null,
                radius: req.body.radius || null,
                points: req.body.point || null,
                rotation: req.body.rotation || 0,
                lineType: req.body.lineType || LineType.SOLID,
                color: req.body.color,
                fillColor: req.body.fillColor || null,
            }
        });
        res.json(shape);
    }catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."
        });
    }
};

export const deleteShape = async (req, res) => {
    try{
        const deletedShape = await prisma.Shape.delete({
            where:{
                id: req.params.id
            }
        });
        res.json({
            shape: deletedShape,
            message: "Shape deleted"
        })
    } catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."
        })
    }
};