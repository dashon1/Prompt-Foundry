import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error("Request failed:", err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  const message = status >= 500
    ? "The service is temporarily unavailable. Please try again later."
    : err.message;

  res.status(status).json({ message });
};
