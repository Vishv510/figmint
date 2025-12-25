import { CloudSnow } from "lucide-react";
import { createContext, useState, useEffect} from "react";

const AuthContext = createContext(null);
export default AuthContext;
 
export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storeUser = localStorage.getItem('user');
        if (storeUser) {
            setUser(JSON.parse(storeUser));
        }

        setLoading(false);
    }, []);
    
    async function login(email, password) {
        try {
            const res = await fetch(
                "http://localhost:3000/auth/signin",{
                    method: "POST",
                    body: JSON.stringify({
                        email, 
                        password
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            );

            if(!res.ok)
                throw new Error("Signup failed, input data not correct");

            const data = await res.json();
            setUser(data.user); 
            localStorage.setItem("Token", data.authentication.token);
            localStorage.setItem('userInfo', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                email: data.user.email
            }));
            
            let userId = data.user.id;
            let canvasId= localStorage.getItem("canvasId") || null;
            if(!canvasId){
                const resC = await fetch("http://localhost:3000/canvas/", {
                        method: "POST",
                        headers: {
                            "authorization": `Bearer ${localStorage.getItem("Token")}`,
                            "Content-Type": "application/json", 
                        },
                        body: JSON.stringify({
                            name: "My canvas"
                        })
                    }
                );

                if(!resC.ok)
                    throw new Error("canvas creation failed");
      
                const canvasData = await resC.json();
                canvasId = canvasData.canvasId;
            }
            localStorage.setItem("currentCanvasId", canvasId);
            
            return {canvasId, userId};
        } catch (err){
            throw new Error(err.message);
        }    
    }

    async function signup(name, email, password) {
        try{
            const res = await fetch("http://localhost:3000/auth/signup",{
                    method: "POST",
                    body: JSON.stringify({
                        username: name, 
                        mail: email,
                        password
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            );
            
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.message || "Signup failed");

            }

            setUser(data.user);

            localStorage.setItem("userInfo", JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                email: data.user.email
            }));
            return data;
        }catch (err) {
            alert(err.message);
            return null;
        }
    } 

    async function logout(){
        await fetch(
            "http://localhost:3000/logout",{
                method: "POST",
            }
        )

        setUser(null);
        localStorage.removeItem("user");
    }

    const value = { user, login, signup, logout};

    if(loading)
        return <div>Loading...</div>

    return (
        <AuthContext.Provider value= {value}>
            {children}
        </AuthContext.Provider>    
    )
}