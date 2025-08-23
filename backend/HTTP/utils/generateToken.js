import jwt from 'jsonwebtoken';

const generateToken = (userid) => {
    const token = jwt.sign({
        id: userid
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    return token;
}
export default generateToken;