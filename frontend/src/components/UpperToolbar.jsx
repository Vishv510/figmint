import { Fragment, useEffect } from "react";
import { ArrowRight, Circle, Diamond, Eraser, Hand, MousePointer2, Pencil, Slash, Square, Type } from "lucide-react";
import { useCanvas } from "../context/CanvasContext";
import { IconButton } from "./UI/IconButton.jsx";

// `id` is the tool name the drawing hook (hooks/useCanvas.js) and drawShape() understand.
const TOOL_GROUPS = [
    [
        { id: "select", label: "Select", icon: MousePointer2, key: "V" },
        { id: "hand", label: "Hand", icon: Hand, key: "H" },
    ],
    [
        { id: "rectangle", label: "Rectangle", icon: Square, key: "R" },
        { id: "diamond", label: "Diamond", icon: Diamond, key: "D" },
        { id: "circle", label: "Circle", icon: Circle, key: "O" },
        { id: "arrow", label: "Arrow", icon: ArrowRight, key: "A" },
        { id: "line", label: "Line", icon: Slash, key: "L" },
        { id: "freehand", label: "Draw", icon: Pencil, key: "P" },
        { id: "text", label: "Text", icon: Type, key: "T" },
    ],
    [
        { id: "eraser", label: "Eraser", icon: Eraser, key: "E" },
    ],
];

const TOOLS = TOOL_GROUPS.flat();

// Every tool answers to its letter and to its position: 1, 2, ... 9, 0.
const numberKey = (tool) => String((TOOLS.indexOf(tool) + 1) % 10);
const SHORTCUTS = Object.fromEntries(
    TOOLS.flatMap((tool) => [[tool.key.toLowerCase(), tool.id], [numberKey(tool), tool.id]])
);

const isTyping = (target) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function UpperToolbar() {
    const { tool, setTool } = useCanvas();

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
            if (document.querySelector('[aria-modal="true"]')) return;

            const next = SHORTCUTS[e.key.toLowerCase()];
            if (next) setTool(next);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setTool]);

    return (
        <div
            role="toolbar"
            aria-label="Drawing tools"
            className="island pointer-events-auto flex items-center gap-0.5 p-1 max-md:max-w-full max-md:overflow-x-auto"
        >
            {TOOL_GROUPS.map((group, index) => (
                <Fragment key={group[0].id}>
                    {index > 0 && <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-zinc-200" />}

                    {group.map((item) => {
                        const Icon = item.icon;
                        const active = tool === item.id;

                        return (
                            <IconButton
                                key={item.id}
                                label={item.label}
                                shortcut={item.key}
                                active={active}
                                aria-pressed={active}
                                onClick={() => setTool(item.id)}
                            >
                                <Icon size={18} strokeWidth={1.75} />
                                <span
                                    aria-hidden="true"
                                    className={`absolute bottom-0.5 right-1 text-[9px] font-medium leading-none ${active ? "text-mint-700" : "text-zinc-400"}`}
                                >
                                    {numberKey(item)}
                                </span>
                            </IconButton>
                        );
                    })}
                </Fragment>
            ))}
        </div>
    );
}
