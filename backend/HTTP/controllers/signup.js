import prisma from '../../config/db.js';
import { hashPassword } from '../utils/encryp.js';

const signupController = async (req, res) => {
    const { username, mail, password } = req.body;
    try{
        const existingUser = await prisma.User.findUnique({
            where: {
                email: mail,
            }
        });

        if(existingUser){
            res.status(400).json({
                message: "User already exists."
            })
            return ;
        }

        const encryptedPassword = await hashPassword(password);

        const newUser = await prisma.User.create({
            data:{
                username: username,
                email: mail,
                password: encryptedPassword
            }
        });

        res.status(201).json({
            message: "User created successfully.",
            user:{
                id: newUser.id,
                username: newUser.username,
                mail: newUser.mail
            }
        });
    }catch(err){
        console.error("Signup error:", err);
        res.status(500).json({
            message: "Internal server error."
        })
    }
}

export default signupController;