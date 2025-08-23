import {Router} from 'express';
import signupController from '../../controllers/signup.js';
import signinController from '../../controllers/signin.js';


const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/signin", signinController);

export default authRouter;