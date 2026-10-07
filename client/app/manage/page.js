"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function ManagePage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState();

  const onSubmit = (e) => {
    e.preventDefault();
    const clean = ref.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      setError("Booking references are 6 letters or numbers, e.g. K7M2QX");
      return;
    }
    router.push(`/booking/${clean}`);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Find your booking</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter the 6-character reference you received when you booked.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-card bg-white p-6 shadow-card">
        <Field label="Booking reference" required error={error}>
          {(a) => (
            <input
              {...a}
              value={ref}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => {
                setRef(e.target.value.toUpperCase());
                setError(undefined);
              }}
              className={`${inputClass(!!error)} font-mono tracking-widest`}
              placeholder="K7M2QX"
            />
          )}
        </Field>
        <Button type="submit" className="w-full">
          Find booking
        </Button>
      </form>
    </div>
  );
}
