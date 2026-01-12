import { useContext, useState } from "react";
import { SharePopUp } from "./UI/sharePopUp";
import { canvasContext } from "../context/canvasContext";

export function CollaborationButton() {
    
    const { canvasId, initializeWebSocket } = useContext(canvasContext); // Use Context directly
    const [openShare, setOpenShare] = useState(false);
    const [openJoin, setOpenJoin] = useState(false);
    const [canvasDetails, setCanvasDetails] = useState(null);
    const [joinCanvasDetails, setJoinCanvasDetails] = useState(null);

    async function shareCanvas(){
        const userId = JSON.parse(localStorage.getItem("userInfo")).id;
        if(!canvasId){
            try{
                const res = await fetch("http://localhost:3000/canvas/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "authorization": `Bearer ${localStorage.getItem("Token")}`,
                    },
                    body: JSON.stringify({ userId }) // Body must be stringified
                });

                const data = await res.json();
                // if(data.id) setCanvasId(data.id);
                console.log("New canvas created for sharing:", data.canvasId);
                setCanvasDetails(data.canvasId);
            } catch(err){
                console.error("Fetch error:", err);
            }
        }
        setOpenShare(true);
    }

    function openJoinCanvas(){
        setOpenJoin(true);
    }
    function joinCanvas(){
        if (!joinCanvasDetails) {
            alert("Please enter a Room ID");
            return;
        }

        const userId = JSON.parse(localStorage.getItem("userInfo")).id
        if (!userId) {
            alert("You must be logged in to join a canvas");
            return;
        }

        console.log("Joining canvas:", joinCanvasDetails);
        // Logic to join canvas using entered ID

        localStorage.setItem("currentCanvasId", joinCanvasDetails);
        initializeWebSocket(joinCanvasDetails, userId);
        setOpenJoin(false);
        setJoinCanvasDetails("");
    }


    return (
        <>
            <button className="bg-indigo-500 text-white px-4 py-2 rounded mr-4 hover:bg-indigo-600 transition" onClick={openJoinCanvas}>
                Join
            </button>

            <button className="bg-indigo-500 text-white px-4 py-2 rounded mr-4 hover:bg-indigo-600 transition" onClick={shareCanvas}>
                Share
            </button>


            {openJoin && (
                <SharePopUp isOpen={openJoin} onClose={() => setOpenJoin(false)}>
                    <div className="p-4">
                        <p className="text-sm text-gray-600">Enter Room ID to join:</p>
                        <input type="text" className="w-full border p-2 mt-2 rounded" onChange={(e) => setJoinCanvasDetails(e.target.value)} />
                        <button className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition" onClick={joinCanvas}>
                            Join
                        </button>
                    </div>
                </SharePopUp>
            )}

            {openShare && (
                <SharePopUp isOpen={openShare} onClose={() => setOpenShare(false)}>
                    <div className="p-4">
                        <p className="text-sm text-gray-600">Share this Room ID with collaborators:</p>
                        <p className="font-mono bg-gray-100 p-2 mt-2 rounded border">{canvasDetails || "Generating..."}</p>
                    </div>
                </SharePopUp>
            )}

        </>
    );
}