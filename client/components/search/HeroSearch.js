"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchForm from "./SearchForm";
import { nearbyLocation } from "@/lib/api";
import { emptySearch, makeLocation } from "@/lib/search";

// Lets destination cards on the landing page prefill the "To" field via ?to=DXB&toCity=Dubai&toName=...
// The "From" field defaults to the airport nearest the visitor's IP-detected city (left empty if unknown).
export default function HeroSearch() {
  const sp = useSearchParams();
  const to = sp.get("to");
  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    nearbyLocation(controller.signal)
      .then(({ location }) => location && setOrigin(makeLocation(location)))
      .catch(() => {}); // optional nicety: the user can still type a city
    return () => controller.abort();
  }, []);

  const defaults = emptySearch();
  if (to) defaults.destination = makeLocation({ iataCode: to, cityName: sp.get("toCity") || to, name: sp.get("toName") || "" });
  if (origin && origin.iataCode !== to) defaults.origin = origin;
  return <SearchForm key={`${to || "none"}-${origin?.iataCode || ""}`} defaultValues={defaults} />;
}
