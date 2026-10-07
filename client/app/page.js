import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Search, Ticket, Wallet, Layers } from "lucide-react";
import HeroSearch from "@/components/search/HeroSearch";
import { Skeleton } from "@/components/ui/States";
import Reveal from "@/components/ui/Reveal";
import { getDestinations } from "@/lib/destinations";


const STEPS = [
  { icon: Search, title: "Search", text: "Enter where you're flying, your dates and who's travelling." },
  { icon: Layers, title: "Compare", text: "Sort and filter by price, duration, stops and airline." },
  { icon: Ticket, title: "Book", text: "Add passenger details and get your booking reference instantly." },
];

export default async function Home() {
  const destinations = await getDestinations();
  return (
    <>
      <section className="relative bg-gradient-to-b from-brand-900 via-brand-700 to-brand-600 pb-28 pt-14 text-white sm:pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 style={{ "--d": "80ms" }} className="anim-fade-up max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find your next flight, <span className="text-brand-200">without the hassle.</span>
          </h1>
          <p style={{ "--d": "200ms" }} className="anim-fade-up mt-4 max-w-xl text-lg text-brand-100">
            Search hundreds of airlines, compare fares side by side and book in a few clicks.
          </p>
        </div>
      </section>

      <section id="search" className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:px-6">
        <div style={{ "--d": "320ms" }} className="anim-fade-up rounded-2xl bg-white p-5 shadow-pop sm:p-7">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <HeroSearch />
          </Suspense>
        </div>
      </section>

      <section id="destinations" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <Reveal><h2 className="text-2xl font-bold tracking-tight">Popular destinations</h2>
        <p className="mt-1 text-ink-soft">Pick one and we&apos;ll fill in the destination for you.</p></Reveal>
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {destinations.map((d, i) => (
            <Reveal as="li" key={d.code} delay={i * 90}>
              <Link
                href={`/?to=${d.code}&toCity=${encodeURIComponent(d.city)}#search`}
                scroll
                className={`group relative flex h-36 flex-col justify-end overflow-hidden rounded-card bg-gradient-to-br ${d.from} ${d.to} p-4 text-white shadow-card transition-transform hover:-translate-y-1.5 hover:shadow-pop focus-visible:-translate-y-1.5 sm:h-44`}
              >
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Wikimedia photo, already sized
                  <img src={d.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-focus-visible:scale-110" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" aria-hidden="true" />
                <span className="absolute right-3 top-3 grid size-9 -translate-y-1 place-items-center rounded-full bg-white/90 text-brand-700 opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" aria-hidden="true">
                  <ArrowUpRight className="size-4" />
                </span>
                <span className="relative text-xl font-bold drop-shadow transition-transform duration-300 group-hover:-translate-y-1">{d.city}</span>
                <span className="relative text-sm text-white/90 transition-transform duration-300 group-hover:-translate-y-1">{d.country}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">Photos via Wikipedia / Wikimedia Commons.</p>
      </section>

      <section id="how" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <Reveal><h2 className="text-2xl font-bold tracking-tight">How it works</h2></Reveal>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 120} className="group rounded-card bg-white p-6 shadow-card transition-[transform,box-shadow,opacity] duration-300 hover:-translate-y-1 hover:shadow-pop">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-ink-faint">Step {i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Reveal className="flex items-start gap-3 rounded-card bg-white p-5 shadow-card">
          <Wallet className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">Clear pricing.</strong> The price you see in results is the total for all travellers.
          </p>
        </Reveal>
        <Reveal delay={120} className="flex items-start gap-3 rounded-card bg-white p-5 shadow-card">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">Instant reference.</strong> Your booking is saved the moment you confirm, and you can look it up any time.
          </p>
        </Reveal>
      </section>
    </>
  );
}
