import jwt from 'jsonwebtoken';

const authentication = async (req, res, next) => {

    try{
        const authHeader = req.headers.authorization || '';
        const [,jwtToken] = authHeader.split(' ');
         
        if(!jwtToken){
            return res.status(401).json({
                message: "Authorization token is missing."
            });
        }
        
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

        req.user = {
            _id: decoded.id
        }

        console.log("Succes fully doen middelware");
        next();
    }catch( err){
        console.error(err);
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({
                message: "Token has expired."
            });
        }
        return res.status(500).json({
            message: "Internal server error12."
        })
    }
}

export default authentication;