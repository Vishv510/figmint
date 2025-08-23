import {Router} from 'express';
import authentication from '../middleware/authentication.js';
import authRouter from './auth/auth.routes.js';
import canvasRouter from './canvas/canvas.routes.js';
import shapesRouter from './shapes/shapes.routes.js';

const router = Router();


router.use('/auth', authRouter);

router.use(authentication);
router.use('/canvas', canvasRouter);

router.use('/shapes', shapesRouter);

export default router;