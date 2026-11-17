import { Hono } from "hono";
import { calendar } from "../../lib/calendar";
import { parse_date } from "@/lib/parse_date";
import { ApiError, type ErrorDetail } from "../lib/errors.js";
import z from "zod";
import { requireAuth } from "../middleware/auth";

const isoUtc = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/, {
    error: "UTCのISO 8601形式で入力してください",
  })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    error: "有効な日時を入力してください",
  });

const eventFields = {
  title: z.string({ error: "タイトルは必須です" }).min(1).max(50),
  description: z.string().max(1000),
  location: z.string().max(50),
  tags: z.array(z.string().max(50)).max(8, { error: "タグは最大で8個までです" }),
  startDate: isoUtc,
  endDate: isoUtc,
};

const ValidatePost = z.object({
  title: eventFields.title,
  description: eventFields.description.optional(),
  location: eventFields.location.optional(),
  tags: eventFields.tags.optional(),
  startDate: eventFields.startDate,
  endDate: eventFields.endDate,
});

const ValidatePatch = z
  .object({
    title: eventFields.title.optional(),
    description: eventFields.description.optional(),
    location: eventFields.location.optional(),
    tags: eventFields.tags.optional(),
    startDate: eventFields.startDate.optional(),
    endDate: eventFields.endDate.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: "変更する項目を1つ以上指定してください",
  });

const ValidateCustomData = z.object({
  tags: eventFields.tags,
  keeper: z.object({
    id: z.string(),
    username: z.string(),
  }),
  createAt: z.string(),
});

type EventInput = z.infer<typeof ValidatePost>;

function invalidParams(details: ErrorDetail[]): never {
  throw new ApiError(
    400,
    "INVALID_PARAMS",
    "入力内容に誤りがあります",
    details,
  );
}

function parseBodyError(error: z.ZodError): never {
  invalidParams(
    error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    })),
  );
}

function parseJsonProperty<T>(value: string | undefined, field: string): T {
  if (!value) invalidParams([{ field, message: "イベント情報が不正です" }]);
  try {
    return JSON.parse(value) as T;
  } catch {
    invalidParams([{ field, message: "イベント情報が不正です" }]);
  }
}

function eventNotFound(): never {
  throw new ApiError(
    404,
    "NOT_FOUND",
    "eventが存在しません",
    [{ field: "id", message: "eventが存在しません" }],
  );
}

async function getEvent(id: string) {
  try {
    return (
      await calendar.events.get({
        calendarId: process.env.CALENDAR_ID,
        eventId: id,
      })
    ).data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 404
    ) {
      return null;
    }
    throw error;
  }
}

function eventResponse(event: NonNullable<Awaited<ReturnType<typeof getEvent>>>) {
  const extended = event.extendedProperties?.private;
  const customData = ValidateCustomData.safeParse({
    tags: parseJsonProperty<unknown>(extended?.tags, "tags"),
    keeper: parseJsonProperty<unknown>(extended?.keeper, "keeper"),
    createAt: parseJsonProperty<unknown>(extended?.createAt, "createAt"),
  });
  if (!customData.success) parseBodyError(customData.error);

  return {
    id: event.id ?? "",
    title: event.summary ?? "",
    description: event.description ?? "",
    location: event.location ?? "",
    tags: customData.data.tags,
    startDate: event.start?.dateTime ?? "",
    endDate: event.end?.dateTime ?? "",
    keeper: customData.data.keeper,
    createAt: customData.data.createAt,
  };
}

function validateDateOrder(startDate: string, endDate: string) {
  if (new Date(endDate) <= new Date(startDate)) {
    invalidParams([
      { field: "endDate", message: "終了時間は開始時間より後にしてください" },
    ]);
  }
}

export const calendars = new Hono()

.get("/", async (c) => {
  const q = c.req.query("yearMonth");
  if (!q) {
    throw new ApiError(
      400,
      "INVALID_PARAMS",
      "入力内容に誤りがあります",
      [{ field: "yearMonth", message: "日付は必須です" }],
    );
  }

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
  if (!events) return c.json({ events: [] }, 200);
  
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
  const event = await getEvent(id);
  if (!event) eventNotFound();
  return c.json(eventResponse(event));
})

.post("/", requireAuth,  async (c) => {
  const user = c.get("user");
  let body: ReturnType<typeof ValidatePost.safeParse>;
  try {
    body = ValidatePost.safeParse(await c.req.json());
  } catch {
    invalidParams([{ field: "body", message: "JSON形式が不正です" }]);
  }
  if (!body.success) parseBodyError(body.error);
  const req: EventInput = body.data;
  validateDateOrder(req.startDate, req.endDate);
  const createAt = new Date().toISOString();
  const result = await calendar.events.insert({
    calendarId: process.env.CALENDAR_ID,
    requestBody: {
      summary: req.title,
      description: req.description,
      location: req.location,
      start: { dateTime: req.startDate, timeZone: "UTC" },
      end: { dateTime: req.endDate, timeZone: "UTC" },
      extendedProperties: {
        private: {
          tags: JSON.stringify(req.tags ?? []),
          keeper: JSON.stringify({ id: String(user.id), username: user.name }),
          createAt: JSON.stringify(createAt),
        },
      },
    },
  });
  return c.json(eventResponse(result.data), 201);
})

.patch("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const event = await getEvent(id);
  if (!event) eventNotFound();
  let body: ReturnType<typeof ValidatePatch.safeParse>;
  try {
    body = ValidatePatch.safeParse(await c.req.json());
  } catch {
    invalidParams([{ field: "body", message: "JSON形式が不正です" }]);
  }
  if (!body.success) parseBodyError(body.error);

  const current = eventResponse(event);
  const req = body.data;
  const startDate = req.startDate ?? current.startDate;
  const endDate = req.endDate ?? current.endDate;
  validateDateOrder(startDate, endDate);

  const result = await calendar.events.patch({
    calendarId: process.env.CALENDAR_ID,
    eventId: id,
    requestBody: {
      ...(req.title === undefined ? {} : { summary: req.title }),
      ...(req.description === undefined ? {} : { description: req.description }),
      ...(req.location === undefined ? {} : { location: req.location }),
      ...(req.startDate === undefined
        ? {}
        : { start: { dateTime: req.startDate, timeZone: "UTC" } }),
      ...(req.endDate === undefined
        ? {}
        : { end: { dateTime: req.endDate, timeZone: "UTC" } }),
      extendedProperties: {
        private: {
          tags: JSON.stringify(req.tags ?? current.tags),
          keeper: JSON.stringify(current.keeper),
          createAt: JSON.stringify(current.createAt),
        },
      },
    },
  });
  return c.json(eventResponse(result.data), 200);
})

.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!await getEvent(id)) eventNotFound();
  await calendar.events.delete({
    calendarId: process.env.CALENDAR_ID,
    eventId: id,
  });
  return c.body(null, 204);
});