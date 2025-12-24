import { useState } from "react";
import { SharePopUp } from "./UI/sharePopUp";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

export function CollaborationButton() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const canvasId = localStorage.getItem("canvasId");

    const handleCollaborationClick = () => {
        if (!token) {
            navigate("/signup"); // Use hook instead of component
        } else {
            setIsOpen(true);
        }
    }

    return (
        <>
            <button onClick={handleCollaborationClick} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                <Users className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">Live Collaboration</span>
            </button>

            {isOpen && (
                <SharePopUp isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <div className="p-4">
                        <h3 className="font-bold">Share Canvas</h3>
                        <code className="block p-2 bg-gray-100 rounded mt-2">{canvasId}</code>
                    </div>
                </SharePopUp>
            )}
        </>
    );
}