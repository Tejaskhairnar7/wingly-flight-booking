import { Suspense } from "react";
import FlightResults from "@/components/flights/FlightResults";
import { Skeleton } from "@/components/ui/States";

export const metadata = { title: "Flight results — Wingly" };

export default function FlightsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      }
    >
      <FlightResults />
    </Suspense>
  );
}
