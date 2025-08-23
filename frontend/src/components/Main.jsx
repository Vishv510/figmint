import { useNavigate } from "react-router-dom"
import { CollaborationButton } from "./CollaborationButton"

function MeinMenuWelcome() {
    return (
        <div className="absolute left-6 top-12 flex flex-col items-start text-gray-400 font-['Caveat']">
            <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 41 94" fill="none" className="w-12 h-24">
                <path d="M38.5 83.5c-14-2-17.833-10.473-21-22.5C14.333 48.984 12 22 12 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="m12.005 10.478 7.905 14.423L6 25.75l6.005-15.273Z" fill="currentColor"></path>
                <path d="M12.005 10.478c1.92 3.495 3.838 7 7.905 14.423m-7.905-14.423c3.11 5.683 6.23 11.368 7.905 14.423m0 0c-3.68.226-7.35.455-13.91.85m13.91-.85c-5.279.33-10.566.647-13.91.85m0 0c1.936-4.931 3.882-9.86 6.005-15.273M6 25.75c2.069-5.257 4.135-10.505 6.005-15.272" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
             <span>Export, preferences, languages...</span>
        </div>
    )
}

function ToolMenuWelcome(){
    return (
        <div className="absolute top-17 right-120 flex flex-col items-center text-gray-400 font-['Caveat']">
            <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 38 78" fill="none" className="w-12 h-24">
                <path d="M1 77c14-2 31.833-11.973 35-24 3.167-12.016-6-35-9.5-43.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="m24.165 1.093-2.132 16.309 13.27-4.258-11.138-12.05Z" fill="currentColor"></path>
                <path d="M24.165 1.093c-.522 3.953-1.037 7.916-2.132 16.309m2.131-16.309c-.835 6.424-1.68 12.854-2.13 16.308m0 0c3.51-1.125 7.013-2.243 13.27-4.257m-13.27 4.257c5.038-1.608 10.08-3.232 13.27-4.257m0 0c-3.595-3.892-7.197-7.777-11.14-12.05m11.14 12.05c-3.837-4.148-7.667-8.287-11.14-12.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
            <span>
                Pick a Tool, Start drawing!
            </span>
        </div>
    )
}


function HomeWelcome(){
    const navigate = useNavigate();

    return <>
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="font-sans">
                <div className="text-5xl font-bold text-purple-500 drop-shadow-lg tracking-wide">
                    <h1 > MyCanvas</h1>
                </div>
            </div>
            <div className="m-4">All your data is saved locally in your brower.</div>
            <div>
                <CollaborationButton />
            </div>
            <div>
                <button className="flex cursor-pointer" onClick={()=>{
                    navigate("/signup", { replace: true });
                    
                }}>
                    <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <g strokeWidth="1.5">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"></path>
                            <path d="M21 12h-13l3 -3"></path>
                            <path d="M11 15l-3 -3"></path>
                        </g>
                    </svg>
                    <div className="ml-2">Sign up</div>
                </button>
            </div>
        </div>
    </>
}

export function Main () {
    return (
        <div className="font-sans">
            <MeinMenuWelcome />
            <HomeWelcome />
            <ToolMenuWelcome />
        </div>
    )
}