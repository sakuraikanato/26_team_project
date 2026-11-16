import { and, asc, eq, gte, lt } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { events, user as userTable } from "../db/schema/index.js";
import { ApiError, type ErrorDetail } from "../lib/errors.js";
import {
    isValidIsoDateTime,
    normalizeTags,
    parsePositiveIntId,
    readJsonObject,
} from "../lib/validation.js";
import { requireKeeper, type KeeperEnv } from "../middleware/keeper.js";

function getMonthRangeUtc(yearMonth: string): { startIso: string; nextStartIso: string } {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const nextStart = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  return {
    startIso: start.toISOString(),
    nextStartIso: nextStart.toISOString(),
  };
}

function formatEventSummary(row: {
  id: number;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string;
}) {
  return {
    id: String(row.id),
    title: row.title,
    location: row.location ?? "",
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

function formatEventDetail(row: {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  tags: string[];
  startDate: string;
  endDate: string;
  keeperId: number;
  keeperName: string | null;
  createdAt: string;
}) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    tags: row.tags ?? [],
    startDate: row.startDate,
    endDate: row.endDate,
    keeper: {
      id: String(row.keeperId),
      username: row.keeperName ?? "飼育員",
    },
    createdAt: row.createdAt,
  };
}

async function getEventDetailById(eventId: number) {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      tags: events.tags,
      startDate: events.startDate,
      endDate: events.endDate,
      keeperId: events.keeperId,
      keeperName: userTable.name,
      createdAt: events.createdAt,
    })
    .from(events)
    .leftJoin(userTable, eq(events.keeperId, userTable.id))
    .where(eq(events.id, eventId))
    .limit(1);

  const row = rows[0];
  return row ? formatEventDetail(row) : null;
}

export const eventRoutes = new Hono<KeeperEnv>()
  .get("/", async (c) => {
    const yearMonth = c.req.query("yearMonth")?.trim() ?? "";
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "yearMonth", message: "yearMonthはYYYY-MM形式で指定してください" },
      ]);
    }

    const { startIso, nextStartIso } = getMonthRangeUtc(yearMonth);
    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        location: events.location,
        startDate: events.startDate,
        endDate: events.endDate,
      })
      .from(events)
      .where(and(lt(events.startDate, nextStartIso), gte(events.endDate, startIso)))
      .orderBy(asc(events.startDate), asc(events.id));

    return c.json(
      {
        events: rows.map(formatEventSummary),
      },
      200,
    );
  })
  .get("/:id", async (c) => {
    const eventId = parsePositiveIntId(c.req.param("id"), "イベント");
    const detail = await getEventDetailById(eventId);
    if (!detail) {
      throw new ApiError(404, "NOT_FOUND", "イベントが見つかりません");
    }
    return c.json(detail, 200);
  })
  .post("/", requireKeeper, async (c) => {
    const keeper = c.get("user")!;
    const body = await readJsonObject(c);
    const details: ErrorDetail[] = [];

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 50) {
      details.push({ field: "title", message: "イベント名は1〜50文字で入力してください" });
    }

    let description: string | null = null;
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        details.push({ field: "description", message: "イベント説明は文字列で入力してください" });
      } else {
        const trimmed = body.description.trim();
        if (trimmed.length > 1000) {
          details.push({
            field: "description",
            message: "イベント説明は1000文字以内で入力してください",
          });
        } else {
          description = trimmed;
        }
      }
    }

    let location: string | null = null;
    if (body.location !== undefined && body.location !== null) {
      if (typeof body.location !== "string") {
        details.push({ field: "location", message: "開催場所は文字列で入力してください" });
      } else {
        const trimmed = body.location.trim();
        if (trimmed.length > 50) {
          details.push({ field: "location", message: "開催場所は50文字以内で入力してください" });
        } else {
          location = trimmed;
        }
      }
    }

    const rawStart = typeof body.startDate === "string" ? body.startDate.trim() : "";
    const rawEnd = typeof body.endDate === "string" ? body.endDate.trim() : "";

    if (!rawStart || !isValidIsoDateTime(rawStart)) {
      details.push({ field: "startDate", message: "開始日時はISO 8601形式で指定してください" });
    }
    if (!rawEnd || !isValidIsoDateTime(rawEnd)) {
      details.push({ field: "endDate", message: "終了日時はISO 8601形式で指定してください" });
    }

    if (
      rawStart &&
      rawEnd &&
      isValidIsoDateTime(rawStart) &&
      isValidIsoDateTime(rawEnd) &&
      Date.parse(rawEnd) < Date.parse(rawStart)
    ) {
      details.push({ field: "endDate", message: "終了日時は開始日時以降にしてください" });
    }

    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    const tags = normalizeTags(body.tags, 8, 50, "tags");

    const [inserted] = await db
      .insert(events)
      .values({
        keeperId: Number(keeper.id),
        title,
        description,
        location,
        tags,
        startDate: new Date(rawStart).toISOString(),
        endDate: new Date(rawEnd).toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning({ id: events.id });

    const created = await getEventDetailById(inserted.id);
    return c.json(created, 201);
  })
  .patch("/:id", requireKeeper, async (c) => {
    const eventId = parsePositiveIntId(c.req.param("id"), "イベント");
    const existingRows = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "イベントが見つかりません");
    }

    const body = await readJsonObject(c);
    const details: ErrorDetail[] = [];
    const updates: Partial<typeof events.$inferInsert> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 50) {
        details.push({ field: "title", message: "イベント名は1〜50文字で入力してください" });
      } else {
        updates.title = title;
      }
    }

    if (body.description !== undefined) {
      if (body.description === null) {
        updates.description = null;
      } else if (typeof body.description !== "string") {
        details.push({ field: "description", message: "イベント説明は文字列で入力してください" });
      } else {
        const trimmed = body.description.trim();
        if (trimmed.length > 1000) {
          details.push({
            field: "description",
            message: "イベント説明は1000文字以内で入力してください",
          });
        } else {
          updates.description = trimmed;
        }
      }
    }

    if (body.location !== undefined) {
      if (body.location === null) {
        updates.location = null;
      } else if (typeof body.location !== "string") {
        details.push({ field: "location", message: "開催場所は文字列で入力してください" });
      } else {
        const trimmed = body.location.trim();
        if (trimmed.length > 50) {
          details.push({ field: "location", message: "開催場所は50文字以内で入力してください" });
        } else {
          updates.location = trimmed;
        }
      }
    }

    let nextStart = existing.startDate;
    let nextEnd = existing.endDate;

    if (body.startDate !== undefined) {
      const rawStart = typeof body.startDate === "string" ? body.startDate.trim() : "";
      if (!rawStart || !isValidIsoDateTime(rawStart)) {
        details.push({ field: "startDate", message: "開始日時はISO 8601形式で指定してください" });
      } else {
        nextStart = new Date(rawStart).toISOString();
        updates.startDate = nextStart;
      }
    }

    if (body.endDate !== undefined) {
      const rawEnd = typeof body.endDate === "string" ? body.endDate.trim() : "";
      if (!rawEnd || !isValidIsoDateTime(rawEnd)) {
        details.push({ field: "endDate", message: "終了日時はISO 8601形式で指定してください" });
      } else {
        nextEnd = new Date(rawEnd).toISOString();
        updates.endDate = nextEnd;
      }
    }

    if (Date.parse(nextEnd) < Date.parse(nextStart)) {
      details.push({ field: "endDate", message: "終了日時は開始日時以降にしてください" });
    }

    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    if (body.tags !== undefined) {
      updates.tags = normalizeTags(body.tags, 8, 50, "tags");
    }

    if (Object.keys(updates).length > 0) {
      await db.update(events).set(updates).where(eq(events.id, eventId));
    }

    const updated = await getEventDetailById(eventId);
    return c.json(updated, 200);
  })
  .delete("/:id", requireKeeper, async (c) => {
    const eventId = parsePositiveIntId(c.req.param("id"), "イベント");
    const deleted = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning({ id: events.id });

    if (deleted.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "イベントが見つかりません");
    }
    return c.body(null, 204);
  });

