import { todayIso } from "./format";

export const NAME_RE = /^[\p{L}][\p{L}\s'-]*$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9\s-]{7,15}$/;

export const AGE_RULES = {
  ADULT: { min: 12, max: 120, text: "Adults must be 12 or older on the travel date" },
  CHILD: { min: 2, max: 11, text: "Children must be 2–11 years old on the travel date" },
  INFANT: { min: 0, max: 1, text: "Infants must be under 2 on the travel date" },
};

export const TYPE_LABEL = { ADULT: "Adult", CHILD: "Child", INFANT: "Infant" };

export function ageOn(dob, onDate) {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

export function buildPassengers({ adults, children, infants }) {
  const blank = (type) => ({ type, title: "", firstName: "", lastName: "", dateOfBirth: "", gender: "" });
  return [
    ...Array.from({ length: adults }, () => blank("ADULT")),
    ...Array.from({ length: children }, () => blank("CHILD")),
    ...Array.from({ length: infants }, () => blank("INFANT")),
  ];
}

export function validateBooking({ passengers, contact, consent }, travelDate) {
  const errors = {};
  const today = todayIso();

  passengers.forEach((p, i) => {
    const key = (f) => `passengers.${i}.${f}`;
    if (!p.title) errors[key("title")] = "Select a title";
    for (const f of ["firstName", "lastName"]) {
      const v = p[f].trim();
      if (!v) errors[key(f)] = f === "firstName" ? "Enter first name" : "Enter last name";
      else if (v.length < 2) errors[key(f)] = "At least 2 characters";
      else if (!NAME_RE.test(v)) errors[key(f)] = "Use letters only, as on the passport";
    }
    if (!p.gender) errors[key("gender")] = "Select gender";
    if (!p.dateOfBirth) errors[key("dateOfBirth")] = "Enter date of birth";
    else if (p.dateOfBirth >= today) errors[key("dateOfBirth")] = "Date of birth must be in the past";
    else {
      const age = ageOn(p.dateOfBirth, travelDate);
      const rule = AGE_RULES[p.type];
      if (age < rule.min || age > rule.max) errors[key("dateOfBirth")] = rule.text;
    }
  });

  if (!contact.email.trim()) errors["contact.email"] = "Enter an email for your confirmation";
  else if (!EMAIL_RE.test(contact.email.trim())) errors["contact.email"] = "Enter a valid email, like name@example.com";

  if (!contact.phone.trim()) errors["contact.phone"] = "Enter a phone number";
  else if (!PHONE_RE.test(contact.phone.trim())) errors["contact.phone"] = "Enter 7–15 digits, optionally starting with +";

  if (!consent) errors.consent = "Please confirm the names match the travel documents";
  return errors;
}
