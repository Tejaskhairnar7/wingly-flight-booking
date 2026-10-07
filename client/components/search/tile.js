// Shared look for the IndiGo-style search "tiles": small label, big value, small sub-line.
export const tileClass = (error) =>
  `relative block h-[84px] rounded-xl border bg-white px-4 py-2.5 text-left transition-[border-color,box-shadow] hover:shadow-sm focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15 ${
    error ? "border-danger" : "border-line hover:border-brand-200"
  }`;

export const tileLabelClass = "block text-[11px] font-semibold uppercase tracking-wider text-ink-faint";
export const tileValueClass = "block w-full truncate bg-transparent text-xl font-bold leading-7 text-ink outline-none placeholder:font-semibold placeholder:text-ink-faint/60";
export const tileSubClass = "block truncate text-xs text-ink-soft";

export function TileError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-danger">
      {children}
    </p>
  );
}
