import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm enabled:hover:shadow-md enabled:hover:shadow-brand-600/30 disabled:bg-brand-600/50",
  secondary: "bg-white text-ink border border-line hover:bg-brand-50 disabled:text-ink-faint",
  ghost: "text-brand-700 hover:bg-brand-50 disabled:text-ink-faint",
};
const SIZES = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  sm: "h-9 px-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] enabled:hover:-translate-y-px disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
