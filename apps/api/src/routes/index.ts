import { Hono } from "hono";
import { authRoutes } from "./auth.js";

export const apiHandler = new Hono()
  .route("/auth", authRoutes)
