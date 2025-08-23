import { Router } from 'express';
import { addShape, deleteShape, updateShape } from '../../controllers/shape.controller.js';

const shapesRouter = Router();

shapesRouter.post('/', addShape);
shapesRouter.patch('/:id', updateShape);
shapesRouter.delete('/:id', deleteShape);

export default shapesRouter;