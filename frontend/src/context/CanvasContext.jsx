import { createContext, useContext, useState } from "react";

export const CanvasContext = createContext(null);

export function useCanvas() {
  return useContext(CanvasContext);
}

export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState([]);       // all drawn shapes
  const [tool, setTool] = useState("select");     // current tool
  const [color, setColor] = useState("#000");     // stroke/text color
  const [fill, setFill] = useState("transparent");// fill color
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);

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

  const addFreehand = (points) => {
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
        addArrow, addDiamond, addFreehand, addText
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
