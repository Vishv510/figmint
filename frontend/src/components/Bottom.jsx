import { useContext } from "react";
import { canvasContext } from "../context/canvasContext";

export function BottomToolbar() {
  const { undo, redo, handleZoomIn, handleZoomOut } = useContext(canvasContext);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white rounded-xl shadow-2xl border z-30">
      <button onClick={undo} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Undo</button>
      <div className="w-[1px] h-6 bg-gray-200 mx-1" />
      <button onClick={redo} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Redo</button>
      <div className="w-[1px] h-6 bg-gray-200 mx-1" />
      <button onClick={handleZoomIn} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Zoom +</button>
      <button onClick={handleZoomOut} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Zoom -</button>
    </div>
  );
}