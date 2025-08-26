import { useCanvas } from "../context/CanvasContext";
import { Circle, Diamond, Eraser, Hand, Minus, MousePointer2, MoveRight, Pen, Square, TypeOutline  } from "lucide-react";

export function UpperToolbar() {
    const { setTool } = useCanvas();
        
    function changeShape(newTool){
        setTool((newTool));
        console.log("selected tool : " + newTool);
    }
    return (
        <div className=" flex rounded bg-gray-200 dark:bg-gray-400 h-12" >
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("mouse")}>
                <MousePointer2 className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("hand")}>
                <Hand  className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("circle")}>
                <Circle className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("rectangle")}>
                <Square className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("diamond")}> 
                <Diamond className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("line")}> 
                <Minus className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("freehand")}> 
                <Pen className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("arrow")}>
                <MoveRight className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("mouse")}>
                <TypeOutline className="w-5 h-5"/>
            </button>
            <button className="pr-2 pl-2 hover:shadow hover:bg-gray-300" onClick={() => changeShape("eraser")}>
                <Eraser className="w-5 h-5"/>
            </button>
        </div>
    )
}