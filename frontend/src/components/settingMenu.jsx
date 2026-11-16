import { useCanvas } from "../context/CanvasContext";

const STROKES = [
    { value: "#18181b", name: "Black" },
    { value: "#e03131", name: "Red" },
    { value: "#2f9e44", name: "Green" },
    { value: "#1971c2", name: "Blue" },
    { value: "#f08c00", name: "Orange" },
];

const FILLS = [
    { value: "transparent", name: "None" },
    { value: "#ffc9c9", name: "Light red" },
    { value: "#b2f2bb", name: "Light green" },
    { value: "#a5d8ff", name: "Light blue" },
    { value: "#ffec99", name: "Light yellow" },
];

const WIDTHS = [1, 2, 4, 6];

// Which settings each tool actually uses. Tools that are not listed have nothing to style.
const TOOL_OPTIONS = {
    rectangle: ["stroke", "fill", "width", "opacity"],
    diamond: ["stroke", "fill", "width", "opacity"],
    circle: ["stroke", "fill", "width", "opacity"],
    arrow: ["stroke", "width"],
    line: ["stroke", "width"],
    freehand: ["stroke", "width"],
    text: ["stroke"],
};

// White with a red diagonal: the usual sign for "no fill".
const NO_FILL = "linear-gradient(to top right, transparent calc(50% - 1px), #ef4444 calc(50% - 1px), #ef4444 calc(50% + 1px), transparent calc(50% + 1px)) #ffffff";

const selectedRing = "outline-2 outline-offset-2 outline-mint-500";

function Section({ label, value, children }) {
    return (
        <section>
            <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-xs font-medium text-zinc-500">{label}</h3>
                {value && <span className="text-xs tabular-nums text-zinc-500">{value}</span>}
            </div>
            {children}
        </section>
    );
}

function Swatches({ options, selected, onSelect, label }) {
    return (
        <div className="flex gap-2">
            {options.map(({ value, name }) => (
                <button
                    key={value}
                    type="button"
                    aria-label={`${label}: ${name}`}
                    aria-pressed={selected === value}
                    title={name}
                    onClick={() => onSelect(value)}
                    className={`size-7 cursor-pointer rounded-md border border-black/10 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 ${selected === value ? selectedRing : ""}`}
                    style={{ background: value === "transparent" ? NO_FILL : value }}
                />
            ))}
        </div>
    );
}

/** Style panel: colours, stroke width and opacity for the shape about to be drawn. */
export function SettingsMenu() {
    const { tool, color, setColor, fill, setFill, strokeWidth, setStrokeWidth, opacity, setOpacity } = useCanvas();

    const options = TOOL_OPTIONS[tool];
    if (!options) return null;

    return (
        <aside
            aria-label="Shape style"
            className="island pointer-events-auto fixed left-3 top-[7.75rem] z-20 flex w-52 flex-col gap-4 p-3 md:top-[4.5rem]"
        >
            {options.includes("stroke") && (
                <Section label={tool === "text" ? "Color" : "Stroke"}>
                    <Swatches options={STROKES} selected={color} onSelect={setColor} label="Stroke" />
                </Section>
            )}

            {options.includes("fill") && (
                <Section label="Background">
                    <Swatches options={FILLS} selected={fill} onSelect={setFill} label="Background" />
                </Section>
            )}

            {options.includes("width") && (
                <Section label="Stroke width">
                    <div className="grid grid-cols-4 gap-1.5">
                        {WIDTHS.map((width) => (
                            <button
                                key={width}
                                type="button"
                                aria-label={`Stroke width ${width}`}
                                aria-pressed={strokeWidth === width}
                                title={`${width}px`}
                                onClick={() => setStrokeWidth(width)}
                                className={`grid h-8 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 ${
                                    strokeWidth === width
                                        ? "bg-mint-100 text-mint-800"
                                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                }`}
                            >
                                <span className="block w-5 rounded-full bg-current" style={{ height: width }} />
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            {options.includes("opacity") && (
                <Section label="Opacity" value={`${Math.round(opacity * 100)}%`}>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        aria-label="Opacity"
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="block w-full cursor-pointer accent-mint-500"
                    />
                </Section>
            )}
        </aside>
    );
}
