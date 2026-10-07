import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["ADULT", "CHILD", "INFANT"], required: true },
    title: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
    // Snapshot of the offer at booking time, so later API changes don't alter history.
    flight: { type: mongoose.Schema.Types.Mixed, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, required: true },
    travellers: {
      adults: Number,
      children: Number,
      infants: Number,
    },
    passengers: { type: [passengerSchema], required: true },
    contact: {
      email: { type: String, required: true, index: true },
      phone: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export const Booking = mongoose.model("Booking", bookingSchema);
