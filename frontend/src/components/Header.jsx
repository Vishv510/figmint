import { AlignJustify } from "lucide-react";
import { useCanvas } from "../context/CanvasContext";
import { useAuth } from "../hooks/useAuth.js";
import { SharePopUp } from "./UI/sharePopUp.jsx";
import { useState } from "react";
import { UpperToolbar } from "./UpperToolbar.jsx";
import { SettingsMenu } from "./settingMenu.jsx";

export function Header() {
    const { canvasId, setCanvasId } = useCanvas();
    const { user } = useAuth();
    const [openShare, setOpenShare] = useState(false);
    const [ openMenu, setOpenMenu] = useState(false);

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

        setOpenShare(true);
    }

    return <>
        <div className="flex justify-between mt-3">
            <div className="relative ml-6">
                <button onClick={() => setOpenMenu((prev) => !prev)} className="ml-6 p-2 rounded bg-gray-200 dark:bg-gray-400 hover:shadow">
                    <AlignJustify  className="w-5 h-5 dark:color:white" />
                </button>

                {openMenu && (
                    <div className="absolute top-full mt-2 left-0 z-50">
                        <SettingsMenu />
                    </div>
                )}
            </div>

            <UpperToolbar />
            <div>
                <button className="bg-indigo-400 rounded h-10 w-16 mr-6" onClick={shareCanvas}>
                    Share
                </button>
            </div>
        </div>

        {openShare && (
            <SharePopUp isOpen={openShare} onClose={() => setOpenShare(false)}>
                <p>This is your room Id, copy and share it </p>
                <p className="font-bold">{`${canvasId}`}</p>
            </SharePopUp>
        )}

    </>
}