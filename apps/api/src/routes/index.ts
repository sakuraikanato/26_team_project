import { Hono } from "hono";
import { authRoutes } from "./auth.js";
import { calendars } from "./calendars";
import { postRoutes } from "./posts.js";

export const apiHandler = new Hono()
  .route("/events", calendars)
  .route("/auth", authRoutes)
  .route("/posts", postRoutes);
