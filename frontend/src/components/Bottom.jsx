import { useCanvas } from "../context/CanvasContext";

export function BottomToolbar() {
  const { undo, redo } = useCanvas();

  return (
    <div className="fixed bottom-0 left-0 w-full h-12 bg-gray-100 dark:bg-gray-800 border-t flex items-center justify-center gap-4">
      <button onClick={undo} className="px-3 py-1 rounded bg-gray-300">Undo</button>
      <button onClick={redo} className="px-3 py-1 rounded bg-gray-300">Redo</button>
      <button className="px-3 py-1 rounded bg-gray-300">Zoom In</button>
      <button className="px-3 py-1 rounded bg-gray-300">Zoom Out</button>
    </div>
  );
}