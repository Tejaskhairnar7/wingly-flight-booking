"use client";

import { useEffect, useId, useRef, useState } from "react";
import Calendar from "./Calendar";

/**
 * Trigger + calendar popover. `renderTrigger(props)` draws the trigger so the same popover serves
 * the search tiles and ordinary form inputs. Below `sm` the calendar rises as a bottom sheet.
 */
export default function DatePopover({ value, onChange, onBlur, min, max, rangeFrom, rangeTo, dropdowns, align = "left", title, renderTrigger }) {
  const uid = useId();
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={ref} className="relative">
      {renderTrigger({
        ref: triggerRef,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? `${uid}-panel` : undefined,
        onClick: () => setOpen((o) => !o),
        onBlur: (e) => {
          if (!ref.current?.contains(e.relatedTarget)) onBlur?.();
        },
        open,
      })}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/40 sm:hidden" aria-hidden="true" />
          <div
            id={`${uid}-panel`}
            role="dialog"
            aria-label={title}
            className={`anim-sheet z-50 border border-line bg-white p-4 shadow-pop max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-2xl max-sm:pb-8 sm:absolute sm:top-full sm:mt-2 sm:w-[21.5rem] sm:rounded-xl ${
              align === "right" ? "sm:right-0" : "sm:left-0"
            }`}
          >
            <Calendar value={value} onChange={pick} min={min} max={max} rangeFrom={rangeFrom} rangeTo={rangeTo} dropdowns={dropdowns} />
          </div>
        </>
      )}
    </div>
  );
}
