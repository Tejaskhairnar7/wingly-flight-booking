import { z } from "zod";

const iata = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter airport code");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const todayIso = () => new Date().toISOString().slice(0, 10);

export const TRAVEL_CLASSES = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

export const flightSearchSchema = z
  .object({
    origin: iata,
    destination: iata,
    departureDate: isoDate,
    returnDate: isoDate.optional(),
    adults: z.coerce.number().int().min(1, "At least 1 adult").max(9).default(1),
    children: z.coerce.number().int().min(0).max(8).default(0),
    infants: z.coerce.number().int().min(0).max(9).default(0),
    travelClass: z.enum(TRAVEL_CLASSES).default("ECONOMY"),
    nonStop: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
    currency: z.string().trim().length(3).toUpperCase().default("INR"),
  })
  .superRefine((v, ctx) => {
    if (v.origin === v.destination) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Destination must differ from origin" });
    }
    if (v.departureDate < todayIso()) {
      ctx.addIssue({ code: "custom", path: ["departureDate"], message: "Departure can't be in the past" });
    }
    if (v.returnDate && v.returnDate < v.departureDate) {
      ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Return must be on or after departure" });
    }
    if (v.adults + v.children > 9) {
      ctx.addIssue({ code: "custom", path: ["children"], message: "Maximum 9 travellers (excluding infants)" });
    }
    if (v.infants > v.adults) {
      ctx.addIssue({ code: "custom", path: ["infants"], message: "Each infant needs an adult" });
    }
  });

const nameField = z
  .string()
  .trim()
  .min(2, "At least 2 characters")
  .max(40)
  .regex(/^[\p{L}][\p{L}\s'-]*$/u, "Letters only");

export const passengerSchema = z.object({
  type: z.enum(["ADULT", "CHILD", "INFANT"]),
  title: z.enum(["Mr", "Ms", "Mrs", "Mx"]),
  firstName: nameField,
  lastName: nameField,
  dateOfBirth: isoDate.refine((d) => d < todayIso() && d > "1900-01-01", "Enter a valid date of birth"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

const segmentSchema = z.object({
  from: iata,
  to: iata,
  departAt: z.string(),
  arriveAt: z.string(),
  carrierCode: z.string(),
  carrierName: z.string(),
  flightNumber: z.string(),
  durationMinutes: z.number(),
}).passthrough();

export const bookingSchema = z
  .object({
    flight: z.object({
      id: z.string(),
      price: z.object({ total: z.number().positive(), currency: z.string().length(3) }),
      cabin: z.string().nullable().optional(),
      itineraries: z
        .array(z.object({ durationMinutes: z.number(), stops: z.number(), segments: z.array(segmentSchema).min(1) }))
        .min(1)
        .max(2),
    }).passthrough(),
    travellers: z.object({
      adults: z.number().int().min(1).max(9),
      children: z.number().int().min(0).max(8),
      infants: z.number().int().min(0).max(9),
    }),
    passengers: z.array(passengerSchema).min(1).max(18),
    contact: z.object({
      email: z.string().trim().toLowerCase().email("Enter a valid email"),
      phone: z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number"),
    }),
  })
  .superRefine((v, ctx) => {
    const count = (t) => v.passengers.filter((p) => p.type === t).length;
    if (
      count("ADULT") !== v.travellers.adults ||
      count("CHILD") !== v.travellers.children ||
      count("INFANT") !== v.travellers.infants
    ) {
      ctx.addIssue({ code: "custom", path: ["passengers"], message: "Passenger list doesn't match the search" });
    }
  });
