import { useCanvas } from "../context/CanvasContext";

export function SettingsMenu() {
    const { color, setColor, fill, setFill, strokeWidth, setStrokeWidth, opacity, setOpacity} = useCanvas();

    return (
    <div className="w-64 rounded-xl bg-gray-700 text-white p-4 shadow-xl">
        {/* Stroke Color */}
        <p className="text-sm mb-1">Stroke</p>
        <div className="flex gap-2 mb-3">
            {["#000", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b"].map(c => (
            <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded ${
                color === c ? "ring-2 ring-white" : ""
                }`}
                style={{ backgroundColor: c }}
            />
            ))}
        </div>

        {/* Fill Color */}
        <p className="text-sm mb-1">Fill</p>
        <div className="flex gap-2 mb-3">
            {["transparent", "#ef4444", "#22c55e", "#3b82f6"].map(c => (
            <button
                key={c}
                onClick={() => setFill(c)}
                className={`w-6 h-6 rounded border ${
                fill === c ? "ring-2 ring-white" : ""
                }`}
                style={{ backgroundColor: c === "transparent" ? "transparent" : c }}
            />
            ))}
        </div>

        {/* Stroke Width */}
        <p className="text-sm mb-1">Stroke width</p>
        <div className="flex gap-2 mb-3">
            {[1, 2, 4, 6].map(w => (
            <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`px-3 py-1 rounded bg-gray-700 ${
                strokeWidth === w ? "ring-2 ring-white" : ""
                }`}
            >
                {w}
            </button>
            ))}
        </div>

        {/* Opacity (future ready) */}
        <p className="text-sm mb-1">Opacity: {opacity}</p>
        <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
}

