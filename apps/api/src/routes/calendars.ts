import { Hono } from "hono";
import { calendar } from "../../lib/calendar"
import { parse_date } from "@/lib/parse_date";
import { MyError } from "@/lib/myerror";
import z, { custom } from "zod";

const ValidateCustomData = z.object({
  tags: z.array(z.string()).max(8),
  keeper: z.object({
    id: z.string(),
    username: z.string()
  }),
  createAt: z.string()
})

export const calendars = new Hono()

.get("/", async (c) => {
  const q = c.req.query("yearMonth");
  if (!q) throw new MyError(
    {
    code: "INVALID_PARAMS",
    message: "入力内容に誤りがあります",
    details: [
      { field: "yearMonth", message: "日付は必須です" }
    ]
    },
    400
  );

  const start = parse_date(q);
  const end = parse_date(q);
  end.setMonth(end.getMonth() + 1);
  const result = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 20
  })
  const events = result.data.items;
  if (!events) return c.json({
    "events": [
      {}
    ]
  }, 200)
  
  const res = events.map((ev) => (
    {
      id: ev.id ?? "",
      title: ev.summary ?? "",
      location: ev.location ?? "",
      startDate: ev.start?.dateTime ?? "",
      endDate: ev.end?.dateTime ?? ""
    }
  ))
  return c.json({
    events: res
  }, 200)
})

.get("/:id", async (c) => {
  const id = c.req.param("id");

  // 存在しないidを指定された際にnullを返すために例外処理を行う
  const event = await (async () => { 
    try {
      const result = await calendar.events.get({
        calendarId: process.env.CALENDAR_ID,
        eventId: id,
      })

      return result.data;
    } catch (e: any) {
      console.log(e);
      if (e.code === 404) {
        return null;
      }
      throw e
    }
  })()

  if (!event) throw new MyError(
    {
    code: "INVALID_PARAMS",
    message: "入力内容に誤りがあります",
    details: [
      { field: "id", message: "eventが存在しません" }
    ]
    },
    400
  );

  const ep = event.extendedProperties?.private;
  const customData = ValidateCustomData.safeParse({
    tags: JSON.parse(ep?.tags ?? ""),
    keeper: JSON.parse(ep?.keeper ?? ""),
    createAt: JSON.parse(ep?.createAt ?? "")
  }
  )
  if (!customData.success) throw new MyError(
    {
    code: "INVALID_PARAMS",
    message: "入力内容に誤りがあります",
    details: null
    },
    400
  )
  const validCustomData = customData.data;
  return c.json({
    id: event.id ?? "",
    title: event.summary ?? "",
    description: event.description ?? "",
    location: event.location ?? "",
    tags: validCustomData.tags,
    startDate: event.start?.dateTime ?? "",
    endDate: event.end?.dateTime ?? "",
    keeper: validCustomData.keeper,
    createAt: validCustomData.createAt
  })
})