import { Hono } from "hono";
import { calendar } from "../../lib/calendar"
import { parse_date } from "@/lib/parse_date";

export const calendars = new Hono()

.get("/", async (c) => {
  const q = c.req.query("yearMonth");
  if (!q) return c.json({
    "code": "INVALID_PARAMS",
    "message": "入力内容に誤りがあります",
    "details": [
      { "field": "yearMonth", "message": "日付は必須です" }
    ]
  }, 400);

  const start = parse_date(q);
  const end = parse_date(q);
  end.setMonth(end.getMonth() + 1);
  const result = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 20
  })
  const event = result.data.items;
  if (!event) return c.json({
    "events": [
      {}
    ]
  }, 200)
  
  const res = event.map((ev) => (
    {
      id: ev.id ?? null,
      title: ev.summary ?? null,
      location: ev.location ?? null,
      startDate: ev.start?.dateTime ?? null,
      endDate: ev.end?.dateTime ?? null
    }
  ))
  return c.json({
    events: res
  }, 200)
})