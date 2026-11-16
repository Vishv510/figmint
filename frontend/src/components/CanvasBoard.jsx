import { useRef } from "react";
import useCanvasDrawing from "../hooks/useCanvas";
import { useCanvas } from "../context/CanvasContext";
import { Header } from "./Header";
import { BottomToolbar } from "./Bottom";
import { SettingsMenu } from "./settingMenu";

const GRID_STEP = 24; // distance between grid dots at 100% zoom, in pixels

// Keep the dots a comfortable distance apart at any zoom by doubling or halving the step.
function gridSpacing(zoom) {
  let step = GRID_STEP * zoom;
  while (step < 14) step *= 2;
  while (step > 56) step /= 2;
  return step;
}

function cursorFor(tool, isPanning) {
  if (tool === "hand") return isPanning ? "cursor-grabbing" : "cursor-grab";
  if (tool === "select") return "cursor-default";
  if (tool === "text") return "cursor-text";
  if (tool === "eraser") return "cursor-eraser";
  return "cursor-crosshair";
}

export function CanvasBoard () {
  const canvasRef = useRef(null);
  const { tool, view } = useCanvas();

  const {
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, redo, isPanning, connection,
  } = useCanvasDrawing(canvasRef);

  const step = gridSpacing(view.zoom);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-zinc-50 text-zinc-800">
      <div
        aria-hidden="true"
        className="board-grid absolute inset-0"
        style={{
          backgroundSize: `${step}px ${step}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      />

      {/* The canvas is transparent and fills the window; the hook sizes its drawing buffer. */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none ${cursorFor(tool, isPanning)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <Header connection={connection} />
      <SettingsMenu />
      <BottomToolbar undo={undo} redo={redo} />
    </div>
  );
};
