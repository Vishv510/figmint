import prisma from '../../config/db.js';
import { comparePassword } from '../utils/encryp.js';
import generateToken from "../utils/generateToken.js";

const signinController = async (req, res) =>{
    const {email, password} = req.body;

    try{
        const user = await prisma.User.findUnique({
            where: {
                email: email,
            }
        })

        if(!user){
            return res.status(404).json({
                message: "User not found."
            })
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if(!isPasswordValid){
            res.status(401).json({
                message: "Invalid password."
            })
            return ;
        }

        const jwtToken = generateToken(user.id);

        res.status(200).json({
            message: "Signin successful.",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            authentication: {
                token: jwtToken
            }
        })
    }catch(err){
        console.error("Signin error:", err);
        res.status(500).json({
            message: "Internal server error."
        });
    }
}

export default signinController;