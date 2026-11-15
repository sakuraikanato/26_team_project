import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "./key.json",
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
  ],
});

export const calendar = google.calendar({
  version: "v3",
  auth,
});