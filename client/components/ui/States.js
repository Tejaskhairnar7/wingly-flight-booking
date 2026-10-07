import { AlertTriangle, SearchX } from "lucide-react";
import Button from "./Button";

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div role="alert" className="rounded-card border border-danger/25 bg-danger-soft px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-white text-danger">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      {message && <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{message}</p>}
      {onRetry && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
