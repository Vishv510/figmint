import { createContext, useCallback, useContext, useState } from "react";

export const CanvasContext = createContext(null);

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const clampZoom = (zoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export function useCanvas() {
  return useContext(CanvasContext);
}

export function CanvasProvider({ children}) {
  const [shapes, setShapes] = useState([]);       // all drawn shapes
  const [tool, setTool] = useState("select");     // current tool
  const [color, setColor] = useState("#18181b");  // stroke/text color
  const [fill, setFill] = useState("transparent");// fill color
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [opacity, setOpacity] = useState(1);

  // --- view: which part of the infinite canvas is on screen ---
  // x/y is where the canvas origin sits on screen (CSS pixels); zoom is the scale (1 = 100%).
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });

  // Change the zoom while keeping the canvas point under (originX, originY) fixed on screen.
  // `next` is a zoom level, or a function of the current one. The origin defaults to the screen centre.
  const zoomTo = useCallback((next, originX = window.innerWidth / 2, originY = window.innerHeight / 2) => {
    setView((v) => {
      const zoom = clampZoom(typeof next === "function" ? next(v.zoom) : next);
      const ratio = zoom / v.zoom;
      return {
        zoom,
        x: originX - (originX - v.x) * ratio,
        y: originY - (originY - v.y) * ratio,
      };
    });
  }, []);

  // The buttons move to the next / previous multiple of 10%.
  const zoomIn = useCallback(() => zoomTo((z) => (Math.floor(z * 10 + 1e-6) + 1) / 10), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo((z) => (Math.ceil(z * 10 - 1e-6) - 1) / 10), [zoomTo]);
  const resetZoom = useCallback(() => zoomTo(1), [zoomTo]);

 // --- helpers to add shapes ---

    const addShape = (shape) => {
        setShapes(prev => [...prev, shape]);
    };

  const addRectangle = (x, y, w, h) => {
    setShapes(prev => [
      ...prev,
      { type: "rectangle", x, y, width: w, height: h, color, fill, strokeWidth }
    ]);
  };

  const addCircle = (x, y, r) => {
    setShapes(prev => [
      ...prev,
      { type: "circle", x, y, radius: r, color, fill, strokeWidth }
    ]);
  };

  const addLine = (x, y, w, h) => {
    setShapes(prev => [
      ...prev,
      { type: "line", x, y, width: w, height: h, color, strokeWidth }
    ]);
  };

  const addArrow = (x, y, w, h) => {
    setShapes(prev => [
      ...prev,
      { type: "arrow", x, y, width: w, height: h, color, strokeWidth }
    ]);
  };

  const addDiamond = (x, y, w, h) => {
    setShapes(prev => [
      ...prev,
      { type: "diamond", x, y, width: w, height: h, color, fill, strokeWidth }
    ]);
  };

  const addFreehand = (points, color, strokeWidth) => {
    setShapes(prev => [
      ...prev,
      { type: "freehand", points, color, strokeWidth }
    ]);
  };

  const addText = (x, y, text) => {
    setShapes(prev => [
      ...prev,
      { type: "text", x, y, text, color, fontSize }
    ]);
  };

  // --- context value ---
  return (
    <CanvasContext.Provider
      value={{
        shapes, setShapes,
        tool, setTool,
        color, setColor,
        fill, setFill,
        strokeWidth, setStrokeWidth,
        addShape,
        fontSize, setFontSize,
        addRectangle, addCircle, addLine,
        addArrow, addDiamond, addFreehand, addText,
        opacity, setOpacity,
        view, setView,
        zoomTo, zoomIn, zoomOut, resetZoom,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
