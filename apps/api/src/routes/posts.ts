import { and, asc, count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { db } from "../db/index.js";
import { comments, posts, user as userTable } from "../db/schema/index.js";
import { ApiError, type ErrorDetail } from "../lib/errors.js";
import {
  isValidDateYmd,
  normalizeTags,
  parsePagination,
  parsePositiveIntId,
  readJsonObject,
} from "../lib/validation.js";
import {
  getWeatherFromCode,
  getWeatherFromKey,
  resolvePostWeather,
} from "../lib/weather.js";
import { requireKeeper, type KeeperEnv } from "../middleware/keeper.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 256;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function normalizeMoodInput(raw: unknown): "kiritto" | "mattari" | null {
  if (raw === "kiritto" || raw === "kiri") return "kiritto";
  if (raw === "mattari") return "mattari";
  return null;
}

function formatPostSummary(row: {
  id: number;
  title: string;
  imageUrl: string | null;
  tags: string[];
  mood: "kiritto" | "mattari";
  takenAt: string;
  likeCount: number;
  keeperId: number | null;
  keeperName: string | null;
  createdAt: string;
}) {
  return {
    id: String(row.id),
    title: row.title,
    imageUrl: row.imageUrl,
    tags: row.tags ?? [],
    mood: row.mood,
    takenAt: row.takenAt,
    likeCount: row.likeCount,
    isLiked: false,
    keeper: row.keeperId
      ? {
          id: String(row.keeperId),
          username: row.keeperName ?? "飼育員",
        }
      : null,
    createdAt: row.createdAt,
  };
}

function formatPostDetail(
  row: {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    tags: string[];
    mood: "kiritto" | "mattari";
    takenAt: string;
    weather: string | null;
    weatherCode: number | null;
    temperature: number | null;
    likeCount: number;
    keeperId: number | null;
    keeperName: string | null;
    createdAt: string;
  },
  commentCount: number,
) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? "",
    imageUrl: row.imageUrl,
    tags: row.tags ?? [],
    takenAt: row.takenAt,
    mood: row.mood,
    weather: resolvePostWeather({
      weather: row.weather,
      weatherCode: row.weatherCode,
      temperature: row.temperature,
    }),
    likeCount: row.likeCount,
    commentCount,
    keeper: row.keeperId
      ? {
          id: String(row.keeperId),
          username: row.keeperName ?? "飼育員",
        }
      : null,
    createdAt: row.createdAt,
  };
}

async function parsePostPayload(c: Context<KeeperEnv>) {
  const contentType = c.req.header("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    return body as Record<string, unknown>;
  }
  return await readJsonObject(c);
}

async function resolveImageValue(raw: unknown): Promise<string | undefined> {
  if (raw === undefined || raw === null) return undefined;

  if (typeof File !== "undefined" && raw instanceof File) {
    if (raw.size === 0) return undefined;
    if (raw.size > MAX_IMAGE_BYTES) {
      throw new ApiError(413, "FILE_TOO_LARGE", "画像サイズは5MB以下にしてください");
    }
    if (raw.type && !raw.type.startsWith("image/")) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "image", message: "画像ファイルのみアップロードできます" },
      ]);
    }
    const buf = Buffer.from(await raw.arrayBuffer());
    const mime = raw.type || "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > MAX_BASE64_LENGTH) {
      throw new ApiError(413, "FILE_TOO_LARGE", "画像サイズは5MB以下にしてください");
    }
    return trimmed;
  }

  throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
    { field: "image", message: "画像の形式が不正です" },
  ]);
}

function parseOptionalNumber(
  raw: unknown,
  field: string,
  details: ErrorDetail[],
): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num)) {
    details.push({ field, message: `${field}は数値で指定してください` });
    return undefined;
  }
  return num;
}

async function getPostDetailById(postId: number) {
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      description: posts.description,
      imageUrl: posts.imageUrl,
      tags: posts.tags,
      mood: posts.mood,
      takenAt: posts.takenAt,
      weather: posts.weather,
      weatherCode: posts.weatherCode,
      temperature: posts.temperature,
      likeCount: posts.likeCount,
      keeperId: posts.keeperId,
      keeperName: userTable.name,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .leftJoin(userTable, eq(posts.keeperId, userTable.id))
    .where(eq(posts.id, postId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [{ total }] = await db
    .select({ total: count() })
    .from(comments)
    .where(eq(comments.postId, postId));

  return formatPostDetail(row, Number(total));
}

export const postRoutes = new Hono<KeeperEnv>()
  .get("/", async (c) => {
    const { page, limit, offset } = parsePagination(c, 20, 100);

    const rawMood = c.req.query("mood") ?? "kiritto";
    let moodFilter: "kiritto" | "mattari" | "both";
    if (rawMood === "both") {
      moodFilter = "both";
    } else {
      const normalized = normalizeMoodInput(rawMood);
      if (!normalized) {
        throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
          { field: "mood", message: "moodは kiritto / mattari / both のいずれかで指定してください" },
        ]);
      }
      moodFilter = normalized;
    }

    const rawSort = c.req.query("sort") ?? "latest";
    let orderByClauses: SQL[];
    if (rawSort === "latest" || rawSort === "newest") {
      orderByClauses = [desc(posts.createdAt), desc(posts.id)];
    } else if (rawSort === "oldest") {
      orderByClauses = [asc(posts.createdAt), asc(posts.id)];
    } else if (rawSort === "likes") {
      orderByClauses = [desc(posts.likeCount), desc(posts.createdAt), desc(posts.id)];
    } else {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "sort", message: "sortは latest / oldest / likes のいずれかで指定してください" },
      ]);
    }

    const conditions: SQL[] = [];
    if (moodFilter !== "both") {
      conditions.push(eq(posts.mood, moodFilter));
    }

    const rawTags = c.req.query("tags");
    if (rawTags && rawTags.trim().length > 0) {
      const keywords = rawTags.trim().split(/[\s\u3000]+/).filter(Boolean);
      if (keywords.length > 0) {
        const tagMatches = keywords.map(
          (kw) =>
            sql`EXISTS (SELECT 1 FROM json_each(${posts.tags}) WHERE json_each.value LIKE ${`%${escapeLike(kw)}%`} ESCAPE '\\')`,
        );
        const orExpr = or(...tagMatches);
        if (orExpr) conditions.push(orExpr);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(posts)
      .where(whereClause);

    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        imageUrl: posts.imageUrl,
        tags: posts.tags,
        mood: posts.mood,
        takenAt: posts.takenAt,
        likeCount: posts.likeCount,
        keeperId: posts.keeperId,
        keeperName: userTable.name,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .leftJoin(userTable, eq(posts.keeperId, userTable.id))
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(limit)
      .offset(offset);

    const totalNum = Number(total);
    return c.json(
      {
        items: rows.map(formatPostSummary),
        total: totalNum,
        page,
        totalPages: totalNum === 0 ? 0 : Math.ceil(totalNum / limit),
      },
      200,
    );
  })
  .get("/:id", async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const detail = await getPostDetailById(postId);
    if (!detail) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }
    return c.json(detail, 200);
  })
  .post("/", requireKeeper, async (c) => {
    const keeper = c.get("user")!;
    const body = await parsePostPayload(c);
    const details: ErrorDetail[] = [];

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 50) {
      details.push({ field: "title", message: "タイトルは1〜50文字で入力してください" });
    }

    let description: string | null = null;
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        details.push({ field: "description", message: "説明は文字列で入力してください" });
      } else {
        const trimmedDesc = body.description.trim();
        if (trimmedDesc.length > 1000) {
          details.push({ field: "description", message: "説明は1000文字以内で入力してください" });
        } else {
          description = trimmedDesc;
        }
      }
    }

    const mood = normalizeMoodInput(body.mood);
    if (!mood) {
      details.push({ field: "mood", message: "moodは kiritto または mattari を指定してください" });
    }

    const takenAt = typeof body.takenAt === "string" ? body.takenAt.trim() : "";
    if (!takenAt || !isValidDateYmd(takenAt)) {
      details.push({ field: "takenAt", message: "撮影日はYYYY-MM-DD形式で入力してください" });
    }

    const weatherCodeNum = parseOptionalNumber(body.weatherCode, "weatherCode", details);
    const temperatureNum = parseOptionalNumber(body.temperature, "temperature", details);

    let weatherKey: string | null = null;
    let resolvedWeatherCode: number | null =
      weatherCodeNum !== undefined && weatherCodeNum !== null
        ? Math.trunc(weatherCodeNum)
        : null;

    if (resolvedWeatherCode !== null) {
      weatherKey = getWeatherFromCode(resolvedWeatherCode).icon;
    } else if (typeof body.weather === "string" && body.weather.trim()) {
      const meta = getWeatherFromKey(body.weather.trim());
      if (!meta) {
        details.push({ field: "weather", message: "天気の値が不正です" });
      } else {
        weatherKey = meta.icon;
        resolvedWeatherCode = meta.code;
      }
    }

    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    const tags = normalizeTags(body.tags, 10, 50, "tags");
    const imageUrl =
      (await resolveImageValue(body.image)) ?? (await resolveImageValue(body.imageUrl));
    if (!imageUrl) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "image", message: "画像は必須です" },
      ]);
    }

    const [inserted] = await db
      .insert(posts)
      .values({
        keeperId: Number(keeper.id),
        title,
        description,
        imageUrl,
        tags,
        mood: mood!,
        takenAt,
        weather: weatherKey,
        weatherCode: resolvedWeatherCode,
        temperature: temperatureNum ?? null,
        likeCount: 0,
        createdAt: new Date().toISOString(),
      })
      .returning({ id: posts.id });

    const created = await getPostDetailById(inserted.id);
    return c.json(created, 201);
  })
  .patch("/:id", requireKeeper, async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const existingRows = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }

    const body = await parsePostPayload(c);
    const details: ErrorDetail[] = [];
    const updates: Partial<typeof posts.$inferInsert> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 50) {
        details.push({ field: "title", message: "タイトルは1〜50文字で入力してください" });
      } else {
        updates.title = title;
      }
    }

    if (body.description !== undefined) {
      if (body.description === null) {
        updates.description = null;
      } else if (typeof body.description !== "string") {
        details.push({ field: "description", message: "説明は文字列で入力してください" });
      } else {
        const descText = body.description.trim();
        if (descText.length > 1000) {
          details.push({ field: "description", message: "説明は1000文字以内で入力してください" });
        } else {
          updates.description = descText;
        }
      }
    }

    if (body.mood !== undefined) {
      const mood = normalizeMoodInput(body.mood);
      if (!mood) {
        details.push({
          field: "mood",
          message: "moodは kiritto または mattari を指定してください",
        });
      } else {
        updates.mood = mood;
      }
    }

    if (body.takenAt !== undefined) {
      const takenAt = typeof body.takenAt === "string" ? body.takenAt.trim() : "";
      if (!takenAt || !isValidDateYmd(takenAt)) {
        details.push({ field: "takenAt", message: "撮影日はYYYY-MM-DD形式で入力してください" });
      } else {
        updates.takenAt = takenAt;
      }
    }

    if (body.weatherCode !== undefined) {
      const wc = parseOptionalNumber(body.weatherCode, "weatherCode", details);
      if (wc === null) {
        updates.weatherCode = null;
        updates.weather = null;
      } else if (wc !== undefined) {
        const codeInt = Math.trunc(wc);
        updates.weatherCode = codeInt;
        updates.weather = getWeatherFromCode(codeInt).icon;
      }
    } else if (body.weather !== undefined) {
      if (body.weather === null || body.weather === "") {
        updates.weather = null;
        updates.weatherCode = null;
      } else if (typeof body.weather === "string") {
        const meta = getWeatherFromKey(body.weather.trim());
        if (!meta) {
          details.push({ field: "weather", message: "天気の値が不正です" });
        } else {
          updates.weather = meta.icon;
          updates.weatherCode = meta.code;
        }
      } else {
        details.push({ field: "weather", message: "天気の値が不正です" });
      }
    }

    if (body.temperature !== undefined) {
      const temp = parseOptionalNumber(body.temperature, "temperature", details);
      if (temp !== undefined) {
        updates.temperature = temp;
      }
    }

    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    if (body.tags !== undefined) {
      updates.tags = normalizeTags(body.tags, 10, 50, "tags");
    }

    if (body.image !== undefined || body.imageUrl !== undefined) {
      const resolved =
        (await resolveImageValue(body.image)) ?? (await resolveImageValue(body.imageUrl));
      if (!resolved) {
        throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
          { field: "image", message: "画像が空です" },
        ]);
      }
      updates.imageUrl = resolved;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(posts).set(updates).where(eq(posts.id, postId));
    }

    const updated = await getPostDetailById(postId);
    return c.json(updated, 200);
  })
  .delete("/:id", requireKeeper, async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const deleted = await db
      .delete(posts)
      .where(eq(posts.id, postId))
      .returning({ id: posts.id });

    if (deleted.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }
    return c.body(null, 204);
  })
  .post("/:id/like", async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const updated = await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} + 1` })
      .where(eq(posts.id, postId))
      .returning({ likeCount: posts.likeCount });

    if (updated.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }
    return c.json({ likeCount: updated[0].likeCount }, 200);
  })
  .get("/:id/comments", async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const exists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (exists.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }

    const { page, limit, offset } = parsePagination(c, 20, 100);
    const [{ total }] = await db
      .select({ total: count() })
      .from(comments)
      .where(eq(comments.postId, postId));

    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt), asc(comments.id))
      .limit(limit)
      .offset(offset);

    const totalNum = Number(total);
    return c.json(
      {
        items: rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          content: row.text,
          createdAt: row.createdAt,
        })),
        total: totalNum,
        page,
        totalPages: totalNum === 0 ? 0 : Math.ceil(totalNum / limit),
      },
      200,
    );
  })
  .post("/:id/comments", async (c) => {
    const postId = parsePositiveIntId(c.req.param("id"), "投稿");
    const exists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (exists.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "投稿が見つかりません");
    }

    const body = await readJsonObject(c);
    const details: ErrorDetail[] = [];

    const rawContent = body.content !== undefined ? body.content : body.text;
    const content = typeof rawContent === "string" ? rawContent.trim() : "";
    if (!content || content.length > 500) {
      details.push({ field: "content", message: "コメント本文は1〜500文字で入力してください" });
    }

    let name = "あなた";
    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== "string") {
        details.push({ field: "name", message: "名前は文字列で入力してください" });
      } else {
        const trimmedName = body.name.trim();
        if (trimmedName.length > 50) {
          details.push({ field: "name", message: "名前は50文字以内で入力してください" });
        } else if (trimmedName.length > 0) {
          name = trimmedName;
        }
      }
    }

    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    const [created] = await db
      .insert(comments)
      .values({
        postId,
        name,
        text: content,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return c.json(
      {
        id: String(created.id),
        name: created.name,
        content: created.text,
        createdAt: created.createdAt,
      },
      201,
    );
  });
