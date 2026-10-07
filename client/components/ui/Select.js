"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { inputClass } from "./Field";

/**
 * Themed replacement for <select> (WAI-ARIA select-only combobox).
 * Spreads the props `Field` hands its control (id, aria-*), so it drops in anywhere a <select> was.
 * Keyboard: Arrows / Home / End move, Enter or Space picks, Esc closes, typing jumps to a match.
 */
export default function Select({ value, onChange, options, placeholder = "Select", onBlur, compact = false, className = "", disabled, id, ...aria }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const wrapRef = useRef(null);
  const typed = useRef({ text: "", timer: null });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIdx = options.findIndex((o) => o.value === value);
  const selected = options[selectedIdx];
  const invalid = aria["aria-invalid"] === true || aria["aria-invalid"] === "true";

  useEffect(() => {
    if (!open) return;
    const close = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  const openList = () => {
    setActive(Math.max(selectedIdx, 0));
    setOpen(true);
  };
  const pick = (i) => {
    if (options[i]) onChange(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    const last = options.length - 1;
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation(); // don't also close a popover this select sits inside
      setOpen(false);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      if (!open) return openList();
      setActive((a) => (e.key === "Home" ? 0 : e.key === "End" ? last : Math.min(Math.max(a + (e.key === "ArrowDown" ? 1 : -1), 0), last)));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) pick(active);
      else openList();
    } else if (e.key === "Tab") {
      if (open) pick(active);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const t = typed.current;
      clearTimeout(t.timer);
      t.text += e.key.toLowerCase();
      t.timer = setTimeout(() => (t.text = ""), 600);
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
      if (hit >= 0) {
        if (!open) setOpen(true);
        setActive(hit);
      }
    }
  };

  const triggerClass = compact
    ? "h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm font-semibold hover:border-brand-200 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15"
    : inputClass(invalid);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        {...aria}
        className={`${triggerClass} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${selected ? "text-ink" : "text-ink-faint/70"}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={aria["aria-label"] || placeholder}
          className="anim-pop absolute left-0 top-full z-50 mt-1.5 max-h-60 min-w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-pop"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              onPointerDown={(e) => e.preventDefault() /* keep focus on the trigger */}
              onClick={() => pick(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                i === active ? "bg-brand-50" : ""
              } ${o.value === value ? "font-semibold text-brand-700" : "text-ink"}`}
            >
              {o.label}
              {o.value === value && <Check className="size-4 shrink-0" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
