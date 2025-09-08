import { AlignJustify } from "lucide-react";
import { useCanvas } from "../context/CanvasContext";
import { useAuth } from "../hooks/useAuth.js";
import { SharePopUp } from "./UI/sharePopUp.jsx";
import { useState } from "react";
import { UpperToolbar } from "./UpperToolbar.jsx";

export function Header() {
    const { canvasId, setCanvasId } = useCanvas();
    const { user } = useAuth();
    const [open, setOpen] = useState();

    async function shareCanvas(){
        if(!canvasId){
            try{
                const res = await fetch("http://localhost:3000/canvas/", {
                    body: { user },
                    headers: {
                        "authorization" : toString(localStorage.getItem("token"))
                    },
                    method: "POST"
                });

                if(!res){
                    console.log("something error in header.jsx in line 23");
                }
                const data = await res.json();
                const id = data.id;
                setCanvasId(id);
            }catch(err){
                console.error("Fetch error in Header.jsx:", err);
            }
        }

        setOpen(true);
    }

    return <>
        <div className="flex justify-between mt-3">
            <div >
                <button className="ml-6 p-2 rounded bg-gray-200 dark:bg-gray-400 hover:shadow">
                    <AlignJustify  className="w-5 h-5 dark:color:white" />
                </button>
            </div>
            <UpperToolbar />
            <div>
                <button className="bg-indigo-400 rounded h-10 w-16 mr-6" onClick={shareCanvas}>
                    Share
                </button>
            </div>
        </div>

        {open && (
            <SharePopUp isOpen={open} onClose={() => setOpen(false)}>
                <p>This is your room Id, copy and share it </p>
                <p className="font-bold">{`${canvasId}`}</p>
            </SharePopUp>
        )}
    </>
}