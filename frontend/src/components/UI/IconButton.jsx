const TOOLTIP_SIDE = {
  bottom: "top-full mt-2",
  top: "bottom-full mb-2",
};

const TOOLTIP_ALIGN = {
  center: "left-1/2 -translate-x-1/2",
  start: "left-0",
  end: "right-0",
};

/**
 * Square icon button with a tooltip that shows its name and keyboard shortcut.
 * `label` is also the accessible name, so the icon passed as children needs no text.
 */
export function IconButton({
  label,
  shortcut,
  active = false,
  tooltipSide = "bottom",
  tooltipAlign = "center",
  className = "",
  children,
  ...props
}) {
  const tone = active
    ? "bg-mint-100 text-mint-800"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";

  return (
    <button
      type="button"
      aria-label={label}
      className={`group relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 ${tone} ${className}`}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-hover:delay-500 group-focus-visible:opacity-100 ${TOOLTIP_SIDE[tooltipSide]} ${TOOLTIP_ALIGN[tooltipAlign]}`}
      >
        {label}
        {shortcut && <kbd className="ml-2 font-sans text-zinc-400">{shortcut}</kbd>}
      </span>
    </button>
  );
}
