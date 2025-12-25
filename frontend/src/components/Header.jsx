import { AlignJustify } from "lucide-react";
import { UpperToolbar } from "./UpperToolbar.jsx";
import { CollaborationButton } from "./CollaborationButton.jsx";

export function Header() {

    return (
        <div className="flex justify-between items-center p-2 border-b bg-white z-20 relative">
            <button className="ml-4 p-2 rounded bg-gray-100 hover:bg-gray-200">
                <AlignJustify className="w-5 h-5" />
            </button>
            
            <UpperToolbar />
            
            <CollaborationButton />
            
        </div>
    );
}