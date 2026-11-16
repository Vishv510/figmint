import { useEffect } from "react";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useCanvas } from "../context/CanvasContext";
import { IconButton } from "./UI/IconButton.jsx";

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl+";

/** Zoom and history controls, bottom-left of the board. */
export function BottomToolbar({ undo, redo }) {
  const { view, zoomIn, zoomOut, resetZoom } = useCanvas();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-20 flex items-center gap-2">
      <div className="island pointer-events-auto flex items-center p-1">
        <IconButton label="Zoom out" tooltipSide="top" tooltipAlign="start" onClick={zoomOut}>
          <Minus size={16} strokeWidth={2} />
        </IconButton>
        <button
          type="button"
          title="Reset zoom"
          aria-label={`Zoom ${Math.round(view.zoom * 100)}%. Reset zoom`}
          onClick={resetZoom}
          className="h-9 w-14 cursor-pointer rounded-lg text-xs font-medium tabular-nums text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500"
        >
          {Math.round(view.zoom * 100)}%
        </button>
        <IconButton label="Zoom in" tooltipSide="top" onClick={zoomIn}>
          <Plus size={16} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="island pointer-events-auto flex items-center p-1">
        <IconButton label="Undo" shortcut={`${MOD}Z`} tooltipSide="top" onClick={undo}>
          <Undo2 size={16} strokeWidth={2} />
        </IconButton>
        <IconButton label="Redo" shortcut={`${MOD}Y`} tooltipSide="top" onClick={redo}>
          <Redo2 size={16} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  );
}
