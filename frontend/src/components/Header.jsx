import { AlignJustify } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { SharePopUp } from "./UI/sharePopUp.jsx";
import { useState, useContext } from "react";
import { UpperToolbar } from "./UpperToolbar.jsx";
import { canvasContext } from "../context/canvasContext";

export function Header() {
    const { canvasId, setCanvasId, userID } = useContext(canvasContext); // Use Context directly
    const [open, setOpen] = useState(false);
    const [canvasDetails, setCanvasDetails] = useState(null);

    async function shareCanvas(){
        if(!canvasId){
            try{
                const res = await fetch("http://localhost:3000/canvas/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "authorization": `Bearer ${localStorage.getItem("Token")}`,
                    },
                    body: JSON.stringify({ userId: userID }) // Body must be stringified
                });

                const data = await res.json();
                // if(data.id) setCanvasId(data.id);
                setCanvasDetails(data);
            } catch(err){
                console.error("Fetch error:", err);
            }
        }
        setOpen(true);
    }

    return (
        <div className="flex justify-between items-center p-2 border-b bg-white z-20 relative">
            <button className="ml-4 p-2 rounded bg-gray-100 hover:bg-gray-200">
                <AlignJustify className="w-5 h-5" />
            </button>
            
            <UpperToolbar />
            
            <button className="bg-indigo-500 text-white px-4 py-2 rounded mr-4 hover:bg-indigo-600 transition" onClick={shareCanvas}>
                Share
            </button>

            {open && (
                <SharePopUp isOpen={open} onClose={() => setOpen(false)}>
                    <div className="p-4">
                        <p className="text-sm text-gray-600">Share this Room ID with collaborators:</p>
                        <p className="font-mono bg-gray-100 p-2 mt-2 rounded border">{canvasDetails || "Generating..."}</p>
                    </div>
                </SharePopUp>
            )}
        </div>
    );
}