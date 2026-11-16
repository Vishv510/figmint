import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { CollaborationButton } from "./CollaborationButton"

// Hand-drawn arrow that points up at the toolbar.
function ToolMenuWelcome(){
    return (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] flex flex-col items-center text-zinc-400 md:top-[4.25rem]">
            <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 38 78" fill="none" className="h-16 w-8">
                <path d="M1 77c14-2 31.833-11.973 35-24 3.167-12.016-6-35-9.5-43.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="m24.165 1.093-2.132 16.309 13.27-4.258-11.138-12.05Z" fill="currentColor"></path>
                <path d="M24.165 1.093c-.522 3.953-1.037 7.916-2.132 16.309m2.131-16.309c-.835 6.424-1.68 12.854-2.13 16.308m0 0c3.51-1.125 7.013-2.243 13.27-4.257m-13.27 4.257c5.038-1.608 10.08-3.232 13.27-4.257m0 0c-3.595-3.892-7.197-7.777-11.14-12.05m11.14 12.05c-3.837-4.148-7.667-8.287-11.14-12.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
            <span className="-ml-24 mt-1 whitespace-nowrap text-sm italic">
                Pick a tool, start drawing!
            </span>
        </div>
    )
}


function HomeWelcome(){
    const { user } = useAuth();

    const primary = "inline-flex h-10 items-center rounded-lg bg-mint-400 px-5 text-sm font-semibold text-mint-950 shadow-sm transition-colors hover:bg-mint-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500";

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-mint-400 text-mint-950 shadow-sm">
                <Leaf size={28} strokeWidth={2} />
            </span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-zinc-900">Figmint</h1>
            <p className="mt-3 max-w-md text-balance text-base text-zinc-600">
                A shared whiteboard for sketching ideas together, in real time.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {user ? (
                    <Link to="/canvas" className={primary}>Open your board</Link>
                ) : (
                    <>
                        <Link to="/signup" className={primary}>Sign up</Link>
                        <CollaborationButton />
                    </>
                )}
            </div>
        </div>
    )
}

export function Main () {
    return (
        <main>
            <ToolMenuWelcome />
            <HomeWelcome />
        </main>
    )
}
