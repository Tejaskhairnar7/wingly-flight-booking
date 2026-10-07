"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "./Select";
import { todayIso } from "@/lib/format";

const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
};
const fromDate = (dt) => iso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
const addDays = (s, n) => {
  const { y, m, d } = parse(s);
  return fromDate(new Date(Date.UTC(y, m, d + n)));
};
const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const addMonths = (s, n) => {
  const { y, m, d } = parse(s);
  return fromDate(new Date(Date.UTC(y, m + n, Math.min(d, daysIn(y, m + n)))));
};
const weekday = (s) => new Date(`${s}T00:00:00Z`).getUTCDay();
const longFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" });
const MONTHS = Array.from({ length: 12 }, (_, m) => monthFmt.format(new Date(Date.UTC(2000, m, 1))));
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Themed month calendar (replaces the browser's native date picker).
 * Values are "YYYY-MM-DD" strings, never Date objects, so there is no timezone drift.
 * `dropdowns` swaps the month title for month + year selects (for far-away dates like birthdays).
 * `rangeFrom`/`rangeTo` only shade the days between; they do not change what is selectable.
 */
export default function Calendar({ value, onChange, min = "1900-01-01", max = "2100-12-31", rangeFrom, rangeTo, dropdowns = false }) {
  const clamp = (s) => (s < min ? min : s > max ? max : s);
  const [focus, setFocus] = useState(() => clamp(value || todayIso()));
  const gridRef = useRef(null);
  const moved = useRef(true); // focus the day on open, then only after keyboard moves
  const today = todayIso();
  const { y, m } = parse(focus);

  useEffect(() => {
    if (moved.current) gridRef.current?.querySelector(`[data-date="${focus}"]`)?.focus();
    moved.current = false;
  }, [focus]);

  const go = (s) => {
    moved.current = true;
    setFocus(clamp(s));
  };
  const onKeyDown = (e) => {
    const moves = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -weekday(focus)),
      End: () => addDays(focus, 6 - weekday(focus)),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      go(moves[e.key]());
    }
  };

  const lead = weekday(iso(y, m, 1));
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn(y, m) }, (_, i) => iso(y, m, i + 1))];
  const canPrev = iso(y, m, 1) > min;
  const canNext = iso(y, m, daysIn(y, m)) < max;

  const jump = (ny, nm) => setFocus(clamp(iso(ny, nm, Math.min(parse(focus).d, daysIn(ny, nm)))));
  const maxY = parse(max).y;
  const years = Array.from({ length: maxY - parse(min).y + 1 }, (_, i) => ({ value: String(maxY - i), label: String(maxY - i) }));

  const navBtn = "grid size-9 place-items-center rounded-full text-ink hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-ink-faint/40 disabled:hover:bg-transparent";

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => go(addMonths(focus, -1))} className={navBtn}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        {dropdowns ? (
          <div className="flex items-center gap-2">
            <Select compact aria-label="Month" value={String(m)} onChange={(v) => jump(y, Number(v))} options={MONTHS.map((label, i) => ({ value: String(i), label }))} />
            <Select compact aria-label="Year" value={String(y)} onChange={(v) => jump(Number(v), m)} options={years} />
          </div>
        ) : (
          <p className="text-sm font-bold" aria-live="polite">
            {MONTHS[m]} {y}
          </p>
        )}
        <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => go(addMonths(focus, 1))} className={navBtn}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div role="grid" aria-label={`${MONTHS[m]} ${y}`} ref={gridRef} onKeyDown={onKeyDown}>
        <div role="row" className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} role="columnheader" className="py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((s, i) => {
            if (!s) return <span key={`b${i}`} role="gridcell" />;
            const disabled = s < min || s > max;
            const isSel = s === value;
            const inRange = rangeFrom && rangeTo && s > rangeFrom && s < rangeTo;
            const isEnd = s === rangeFrom || s === rangeTo;
            return (
              <span key={s} role="gridcell" aria-selected={isSel} className={`grid place-items-center ${inRange ? "bg-brand-50" : ""}`}>
                <button
                  type="button"
                  data-date={s}
                  tabIndex={s === focus ? 0 : -1}
                  disabled={disabled}
                  aria-label={longFmt.format(new Date(`${s}T00:00:00Z`))}
                  aria-current={s === today ? "date" : undefined}
                  onClick={() => onChange(s)}
                  className={`grid size-10 place-items-center rounded-full text-sm tabular-nums transition-colors ${
                    isSel ? "bg-brand-600 font-bold text-white" : isEnd ? "bg-brand-100 font-semibold text-brand-700" : "text-ink hover:bg-brand-50"
                  } ${s === today && !isSel ? "font-bold text-brand-700 ring-1 ring-inset ring-brand-200" : ""} disabled:cursor-not-allowed disabled:text-ink-faint/40 disabled:hover:bg-transparent`}
                >
                  {parse(s).d}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
