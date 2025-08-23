import useCanvasHook from "../hooks/useCanvas.js";
import {Pencil, Minus, Square, Circle, Type, Eraser, Undo, Redo, Trash2} from "lucide-react";

const tools = [
  { name: "pencil", icon: <Pencil size={18} /> },
  { name: "line", icon: <Minus size={18} /> },
  { name: "rectangle", icon: <Square size={18} /> },
  { name: "circle", icon: <Circle size={18} /> },
  { name: "text", icon: <Type size={18} /> },
  { name: "eraser", icon: <Eraser size={18} /> },
];

const Toolbar = () => {
  const { tool, setTool, setStrokeColor, setStrokeWidth, undo, redo, clearCanvas } =useCanvasHook();

  return (
    <div className="toolbar" style={{ display: "flex", gap: "10px", padding: "8px" }}>
      {tools.map((t) => (
        <button
          key={t.name}
          onClick={() => setTool(t.name)}
          style={{
            padding: "6px",
            background: tool === t.name ? "#eee" : "#fff",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {t.icon}
        </button>
      ))}

      <input
        type="color"
        onChange={(e) => setStrokeColor(e.target.value)}
        style={{ marginLeft: "12px" }}
      />

      <select onChange={(e) => setStrokeWidth(Number(e.target.value))} defaultValue={2}>
        <option value={1}>Thin</option>
        <option value={2}>Normal</option>
        <option value={4}>Thick</option>
        <option value={8}>Extra Thick</option>
      </select>

      <button onClick={undo}>
        <Undo size={18} />
      </button>
      <button onClick={redo}>
        <Redo size={18} />
      </button>
      <button onClick={clearCanvas} style={{ color: "red" }}>
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default Toolbar;
