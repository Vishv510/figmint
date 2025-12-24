import { useContext } from "react";
import { Circle, Diamond, Eraser, Hand, Minus, MousePointer2, MoveRight, Pen, Square, TypeOutline, Undo2, Redo2, ZoomOut, ZoomIn, RotateCcw } from "lucide-react";
import { canvasContext } from "../context/canvasContext";

export function UpperToolbar() {
    const { 
        setSelectedShape, 
        undo, 
        redo, 
        handleZoomOut, 
        zoomLevel, 
        handleZoomIn, 
        handleResetZoom,
        selectedShape 
    } = useContext(canvasContext);
        
    function changeShape(newTool) {
        setSelectedShape(newTool);
        console.log("selected tool : " + newTool);
    }

    return (
        <div className="flex gap-4 p-2 bg-gray-100 dark:bg-gray-800">
            {/* Drawing tools */}
            <div className="flex rounded bg-gray-200 dark:bg-gray-400 h-12">
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "mouse" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("mouse")}
                    title="Select"
                >
                    <MousePointer2 className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "hand" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("hand")}
                    title="Pan (Hand Tool)"
                >
                    <Hand className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "circle" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("circle")}
                    title="Circle"
                >
                    <Circle className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "rectangle" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("rectangle")}
                    title="Rectangle"
                >
                    <Square className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "diamond" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("diamond")}
                    title="Diamond"
                > 
                    <Diamond className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "line" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("line")}
                    title="Line"
                > 
                    <Minus className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "pencil" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("pencil")}
                    title="Pencil"
                > 
                    <Pen className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "arrow" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("arrow")}
                    title="Arrow"
                >
                    <MoveRight className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "text" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("text")}
                    title="Text"
                >
                    <TypeOutline className="w-5 h-5"/>
                </button>
                <button 
                    className={`pr-2 pl-2 hover:shadow hover:bg-gray-300 ${selectedShape === "eraser" ? "bg-gray-400" : ""}`}
                    onClick={() => changeShape("eraser")}
                    title="Eraser"
                >
                    <Eraser className="w-5 h-5"/>
                </button>
            </div>

            {/* History controls */}
            <div className="flex items-center gap-1 border-r pr-2 border-gray-400">
                <button
                    onClick={undo}
                    className="p-2 rounded hover:bg-gray-300 transition"
                    title="Undo"
                >
                    <Undo2 className="w-5 h-5" />
                </button>
                <button
                    onClick={redo}
                    className="p-2 rounded hover:bg-gray-300 transition"
                    title="Redo"
                >
                    <Redo2 className="w-5 h-5" />
                </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleZoomOut}
                    className="p-2 rounded hover:bg-gray-300 transition"
                    title="Zoom Out"
                > 
                    <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                </span>
                <button 
                    onClick={handleZoomIn}
                    className="p-2 rounded hover:bg-gray-300 transition"
                    title="Zoom In"
                > 
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleResetZoom}
                    className="p-2 rounded hover:bg-gray-300 transition"
                    title="Reset Zoom & Pan"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}