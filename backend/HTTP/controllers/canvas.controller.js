import prisma from '../../config/db.js';

export const createCanvas = async (req, res) => {
    try{
        console.log("You are reach in createCanvas endpoint");
        const canvas = await prisma.Canvas.create({
            data: {
                name: req.body.name || "My Canvas",
                ownerId: req.user._id,
                zoomLevel: req.body.zoomLevel || 1.0,
                panX: req.body.panX || 0,
                panY: req.body.panY || 0,
                isReadOnly: req.body.isReadOnly || false,
                shareToken: req.body.shareToken || null,
            }
        });
        res.status(201).json({
            message: "successfully created canvas",
            canvasId: canvas.id
        });
    }catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."
        });
    }
}

export const getCanvas = async (req, res) => {
    const id = req.params.id;
    try{
        const canvas = await prisma.Canvas.findUnique({
            where: {
                id : id
            },
            include: {
                collaborators: true,
            }
        });
        res.json(canvas);
    } catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."
        });
    }
}

export const updateCanvas = async (req, res) => {
    const id = req.params.id;
    try{
        const canvas = await prisma.Canvas.update({
            where: {
                id: id
            },
            data: {
                name: req.body.name,
                zoomLevel: req.body.zoomLevel,
                panX: req.body.panX,
                panY: req.body.panY,
                isReadOnly: req.body.isReadOnly,
                shareToken: req.body.shareToken
            }
        })
        res.json(canvas);
    }catch(err){
        res.status(500).json({
            message: err.message || "Internal server error."
        });
    }
}