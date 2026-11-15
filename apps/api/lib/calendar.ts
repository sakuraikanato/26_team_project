import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "../braided-visitor-514803-s5-a3b85a9d4fe2.json",
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
  ],
});

const calendars = google.calendar({
  version: "v3",
  auth,
});