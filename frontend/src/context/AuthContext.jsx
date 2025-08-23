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
                throw new Error("Signup failed");

            const data = await res.json();
            setUser(data.user); 
            localStorage.setItem("Token", JSON.stringify(data.authentication.token));
            localStorage.setItem("canvasId", JSON.stringify(data.user.id));

            return data;
        } catch (err){
            throw new Error(err.message);
        }    
    }

    async function signup(name, email, password) {
        try{
            console.log("hello");
            const res = await fetch(
                "http://localhost:3000/auth/signup",{
                    method: "POST",
                    body: JSON.stringify({
                        username: name, 
                        mail: email,
                        password
                    }),
                     headers: { "Content-Type": "application/json" },
                }
            );
            console.log(res);
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.message || "Signup failed");

            }

            setUser(data.user);

            localStorage.setItem("userId", JSON.stringify(data.user.id));
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