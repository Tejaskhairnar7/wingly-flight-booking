"use client";

import { useId } from "react";
import { AlertCircle } from "lucide-react";

export const inputClass = (hasError) =>
  `w-full h-12 rounded-xl border bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-faint/70 transition-colors focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15 disabled:bg-canvas ${
    hasError ? "border-danger" : "border-line hover:border-brand-200"
  }`;

// Label + control + hint/error wiring. `children` receives the props the control needs for a11y.
export default function Field({ label, error, hint, required, className = "", children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, "aria-required": required || undefined })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
