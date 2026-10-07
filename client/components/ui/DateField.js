"use client";

import { CalendarDays } from "lucide-react";
import DatePopover from "./DatePopover";
import { inputClass } from "./Field";

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Form-input styled date control with month/year dropdowns (for dates far from today, e.g. birthdays).
export default function DateField({ value, onChange, onBlur, min, max, placeholder = "Select date", id, title, ...aria }) {
  return (
    <DatePopover
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      min={min}
      max={max}
      dropdowns
      title={title}
      renderTrigger={({ open, ...p }) => (
        <button type="button" id={id} {...aria} {...p} className={`${inputClass(aria["aria-invalid"] === true)} flex items-center justify-between gap-2 text-left`}>
          <span className={value ? "text-ink" : "text-ink-faint/70"}>{value ? fmt.format(new Date(`${value}T00:00:00Z`)) : placeholder}</span>
          <CalendarDays className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
      )}
    />
  );
}
