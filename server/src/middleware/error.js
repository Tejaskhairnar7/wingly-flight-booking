import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

// Parse with zod and convert failures into a 400 with per-field messages.
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  throw new HttpError(400, "Please check the highlighted fields", fields);
}

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid request" });
  }
  if (err?.name === "TimeoutError" || err?.name === "AbortError") {
    return res.status(504).json({ error: "The flight provider took too long to respond." });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
}
