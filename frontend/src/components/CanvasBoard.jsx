import React, { useRef, useEffect } from "react";
import { CanvasContext } from "../context/CanvasContext";
import useCanvasDrawing from "../hooks/useCanvas";
import { Header } from "./Header";
import { BottomToolbar } from "./Bottom";

export function CanvasBoard () {
  const canvasRef = useRef(null);

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasDrawing(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth; // adjust if you have sidebar
      canvas.height = window.innerHeight;
    }
  }, []);

  return (
    <div className="relative w-full h-screen">
      <Header />
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white border border-gray-300 dark:bg-slate-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <BottomToolbar />
    </div>
  );
};
