import { useEffect } from "react";
import { X } from "lucide-react";

/** Centered dialog. Closes on Escape, on the X button, or on a click outside the box. */
export function SharePopUp({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 grid place-items-center p-4"
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]" onClick={onClose} />

            {/* Popup box */}
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-800 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                    {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="-mr-2 -mt-2 ml-auto grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
