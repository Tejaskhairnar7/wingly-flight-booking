"use client";

import { useId } from "react";
import { Plus } from "lucide-react";
import DatePopover from "@/components/ui/DatePopover";
import { TileError, tileClass, tileLabelClass, tileSubClass, tileValueClass } from "./tile";

function parts(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const fmt = (o) => new Intl.DateTimeFormat("en-IN", { ...o, timeZone: "UTC" }).format(date);
  return { main: `${d} ${fmt({ month: "short" })}’${String(y).slice(2)}`, sub: fmt({ weekday: "long" }) };
}

/**
 * A date field shown as a tile that opens the themed calendar popover.
 * If `onActivate` is passed and the tile is inactive (e.g. "Return" on a one-way trip),
 * clicking it activates the field instead (IndiGo-style "add return").
 * `rangeFrom`/`rangeTo` shade the trip's days in the calendar.
 */
export default function DateTile({ label, value, onChange, onBlur, min, error, inactive, onActivate, inactiveHint, align = "left", rangeFrom, rangeTo }) {
  const uid = useId();
  const p = value ? parts(value) : null;

  if (inactive) {
    return (
      <div>
        <button type="button" onClick={onActivate} className={`${tileClass(false)} w-full cursor-pointer bg-canvas/60`}>
          <span className={tileLabelClass}>{label}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-brand-700">
            <Plus className="size-4" aria-hidden="true" /> Add return
          </span>
          <span className={tileSubClass}>{inactiveHint}</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <DatePopover
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        align={align}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        title={`Choose ${label.toLowerCase()} date`}
        renderTrigger={({ open, ...trigger }) => (
          <button
            type="button"
            id={uid}
            {...trigger}
            aria-label={`${label} date: ${p ? `${p.main}, ${p.sub}` : "not selected"}. Change`}
            aria-describedby={error ? `${uid}-error` : undefined}
            className={`${tileClass(!!error)} w-full cursor-pointer ${open ? "!border-brand-600 ring-4 ring-brand-600/15" : ""}`}
          >
            <span className={tileLabelClass}>{label}</span>
            <span className={`${tileValueClass} ${p ? "" : "text-ink-faint/60"}`}>{p ? p.main : "Select date"}</span>
            <span className={tileSubClass}>{p ? p.sub : " "}</span>
          </button>
        )}
      />
      <TileError id={`${uid}-error`}>{error}</TileError>
    </div>
  );
}
