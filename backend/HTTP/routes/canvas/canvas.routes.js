import { Router } from 'express';
import { createCanvas, getCanvas, updateCanvas } from '../../controllers/canvas.controller.js';
const canvasRouter = Router();

canvasRouter.post('/', createCanvas);
canvasRouter.get('/:id', getCanvas);
canvasRouter.patch('/:id', updateCanvas);;

export default canvasRouter;