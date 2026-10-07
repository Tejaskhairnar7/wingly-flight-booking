import Link from "next/link";
import { Plane } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white transition-transform duration-300 group-hover:scale-105">
            <Plane className="plane-drift size-5 -rotate-45" aria-hidden="true" />
          </span>
          Wingly
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm font-medium text-ink-soft">
          <Link href="/#destinations" className="hidden rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700 sm:block">
            Destinations
          </Link>
          <Link href="/#how" className="hidden rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700 sm:block">
            How it works
          </Link>
          <Link href="/manage" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            Find my booking
          </Link>
        </nav>
      </div>
    </header>
  );
}
