import { Hono } from "hono";
import { calendars } from "./calendars";

export const apiHandler = new Hono()
.route("/events", calendars)