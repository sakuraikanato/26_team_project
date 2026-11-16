import { Hono } from "hono";
import { authRoutes } from "./auth.js";
import { calendars } from "./calendars";

export const apiHandler = new Hono()
  .route("/events", calendars)
  .route("/auth", authRoutes)
