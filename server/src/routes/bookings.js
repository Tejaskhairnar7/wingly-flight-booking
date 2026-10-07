import { Router } from "express";
import { randomBytes } from "node:crypto";
import { Booking } from "../models/Booking.js";
import { bookingSchema } from "../lib/schemas.js";
import { parse } from "../middleware/error.js";
import { HttpError } from "../lib/errors.js";

export const bookingsRouter = Router();

// No 0/O/1/I to keep references easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeReference() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

bookingsRouter.post("/", async (req, res) => {
  const data = parse(bookingSchema, req.body);

  let booking;
  for (let attempt = 0; attempt < 5 && !booking; attempt++) {
    try {
      booking = await Booking.create({
        reference: makeReference(),
        flight: data.flight,
        totalPrice: data.flight.price.total,
        currency: data.flight.price.currency,
        travellers: data.travellers,
        passengers: data.passengers,
        contact: data.contact,
      });
    } catch (err) {
      if (err?.code !== 11000) throw err; // only retry duplicate references
    }
  }
  if (!booking) throw new HttpError(500, "Could not create booking, please try again.");

  res.status(201).json({ booking });
});

bookingsRouter.get("/:reference", async (req, res) => {
  const booking = await Booking.findOne({ reference: req.params.reference.toUpperCase() });
  if (!booking) throw new HttpError(404, "We couldn't find a booking with that reference.");
  res.json({ booking });
});
