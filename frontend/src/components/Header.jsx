import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Leaf, Share2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { SharePopUp } from "./UI/sharePopUp.jsx";
import { UpperToolbar } from "./UpperToolbar.jsx";

const CONNECTION = {
    online: { label: "Live", dot: "bg-mint-500", hint: "Connected. Changes are sent to the server." },
    connecting: { label: "Connecting", dot: "animate-pulse bg-amber-400", hint: "Connecting to the server…" },
    offline: { label: "Offline", dot: "bg-rose-500", hint: "Not connected. Changes are not being sent to the server." },
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500";

function Brand() {
    return (
        <Link
            to="/"
            aria-label="Figmint home"
            className={`island pointer-events-auto flex h-[46px] items-center gap-2 justify-self-start px-2.5 ${focusRing}`}
        >
            <span className="grid size-7 place-items-center rounded-lg bg-mint-400 text-mint-950">
                <Leaf size={16} strokeWidth={2.25} />
            </span>
            <span className="hidden pr-1 text-[15px] font-semibold tracking-tight text-zinc-900 lg:inline">Figmint</span>
        </Link>
    );
}

function ConnectionStatus({ state }) {
    const status = CONNECTION[state];
    if (!status) return null;

    return (
        <span
            role="status"
            title={status.hint}
            className="island flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-zinc-600"
        >
            <span className={`size-2 rounded-full ${status.dot}`} />
            <span className="hidden lg:inline">{status.label}</span>
            <span className="sr-only lg:hidden">{status.label}</span>
        </span>
    );
}

function ShareBoard({ canvasId }) {
    const [copied, setCopied] = useState(false);

    async function copyId() {
        try {
            await navigator.clipboard.writeText(canvasId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Could not copy the board ID:", err);
        }
    }

    if (!canvasId) {
        return <p className="text-sm text-zinc-600">You do not have a board yet. Log in to create one, then share it from here.</p>;
    }

    return (
        <>
            <p className="text-sm text-zinc-600">This is your board ID. Copy it and send it to the people you want to draw with.</p>

            <label htmlFor="board-id" className="mb-1.5 mt-5 block text-xs font-medium text-zinc-500">Board ID</label>
            <div className="flex gap-2">
                <input
                    id="board-id"
                    readOnly
                    value={canvasId}
                    onFocus={(e) => e.target.select()}
                    className={`h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-mono text-sm text-zinc-800 ${focusRing}`}
                />
                <button
                    type="button"
                    autoFocus
                    onClick={copyId}
                    className={`inline-flex h-10 w-28 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-mint-400 text-sm font-semibold text-mint-950 transition-colors hover:bg-mint-300 ${focusRing}`}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
        </>
    );
}

/**
 * Top bar that floats over the page: brand on the left, tools in the middle, sharing on the right.
 * `connection` is the board socket state ("connecting" | "online" | "offline"); leave it out
 * on pages that have no live board.
 */
export function Header({ connection }) {
    const { user } = useAuth();
    const [openShare, setOpenShare] = useState(false);
    const [canvasId, setCanvasId] = useState(null);

    function shareCanvas() {
        // The board is created at login and its id is kept in localStorage (see AuthContext).
        setCanvasId(localStorage.getItem("canvasId"));
        setOpenShare(true);
    }

    return <>
        <header className="pointer-events-none fixed inset-x-0 top-0 z-20 grid grid-cols-2 items-center gap-2 p-3 md:grid-cols-[1fr_auto_1fr]">
            <Brand />

            <div className="col-span-2 row-start-2 flex min-w-0 justify-center md:col-span-1 md:row-start-auto">
                <UpperToolbar />
            </div>

            <div className="pointer-events-auto flex items-center gap-2 justify-self-end">
                <ConnectionStatus state={connection} />

                {user ? (
                    <>
                        <span
                            title={user.username || user.email}
                            className="grid size-9 place-items-center rounded-full bg-zinc-900 text-sm font-semibold uppercase text-white"
                        >
                            {(user.username || user.email || "?").charAt(0)}
                        </span>
                        <button
                            type="button"
                            onClick={shareCanvas}
                            className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-mint-400 px-3.5 text-sm font-semibold text-mint-950 shadow-sm transition-colors hover:bg-mint-300 ${focusRing}`}
                        >
                            <Share2 size={16} />
                            Share
                        </button>
                    </>
                ) : (
                    <Link
                        to="/login"
                        className={`island inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 ${focusRing}`}
                    >
                        Log in
                    </Link>
                )}
            </div>
        </header>

        <SharePopUp isOpen={openShare} onClose={() => setOpenShare(false)} title="Share this board">
            <ShareBoard canvasId={canvasId} />
        </SharePopUp>
    </>
}
