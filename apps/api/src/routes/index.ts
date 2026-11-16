import { Hono } from "hono";
import { authRoutes } from "./auth.js";
import { calendars } from "./calendars";
import { eventRoutes } from "./events.js";

export const apiHandler = new Hono()
  .route("/events", calendars)
  .route("/db-events", eventRoutes)
  .route("/auth", authRoutes);
