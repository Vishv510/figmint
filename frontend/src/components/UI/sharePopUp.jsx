import { useEffect } from "react";
import { X } from "lucide-react";

export function SharePopUp({isOpen, onClose, children}){
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Background overlay */}
        <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose} // close if click outside
        ></div>

        {/* Popup box */}
        <div className="relative bg-white p-6 rounded-2xl shadow-lg w-96 z-10">
            <button
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
            onClick={onClose}
            >
            <X />
            </button>
            {children}
        </div>
        </div>
    );
}

