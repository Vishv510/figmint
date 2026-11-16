import { useState } from "react";
import { SharePopUp } from "./UI/sharePopUp";
import { Navigate } from "react-router-dom";

export function CollaborationButton() {
    const [isOpen, setIsOpen] = useState();
    const handleCollaborationClick = () => {
        setIsOpen(true);
    }

    return <>
        <button onClick={handleCollaborationClick} type='button' className="island inline-flex h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500">
            <div className="mr-2">
                <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" className="size-[18px]" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <g strokeWidth="1.5">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
                    </g>
                </svg>
            </div>
            <div className="">
                Live collaboration...
            </div>
        </button>

        {!localStorage.getItem("token") && isOpen ?
            // fetch canvasid
                <Navigate to="/signup" replace />
            :
            <SharePopUp>
                share canvas
            </SharePopUp> 
            //   i want to travel now localhost:5173/auth/signup
        }
    </>
}