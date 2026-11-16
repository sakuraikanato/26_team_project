import type { Context } from "hono";
import { ApiError, type ErrorDetail } from "./errors.js";

export function parsePositiveIntId(raw: string, resourceName = "ID"): number {
  if (!/^\d+$/.test(raw)) {
    throw new ApiError(404, "NOT_FOUND", `${resourceName}が見つかりません`);
  }
  const num = Number(raw);
  if (!Number.isSafeInteger(num) || num <= 0) {
    throw new ApiError(404, "NOT_FOUND", `${resourceName}が見つかりません`);
  }
  return num;
}

export function parsePagination(c: Context, defaultLimit = 20, maxLimit = 100) {
  const rawPage = c.req.query("page");
  const rawLimit = c.req.query("limit");

  const details: ErrorDetail[] = [];
  let page = 1;
  let limit = defaultLimit;

  if (rawPage !== undefined) {
    if (!/^\d+$/.test(rawPage) || Number(rawPage) < 1) {
      details.push({ field: "page", message: "pageは1以上の整数で指定してください" });
    } else {
      page = Number(rawPage);
    }
  }

  if (rawLimit !== undefined) {
    if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > maxLimit) {
      details.push({
        field: "limit",
        message: `limitは1〜${maxLimit}の整数で指定してください`,
      });
    } else {
      limit = Number(rawLimit);
    }
  }

  if (details.length > 0) {
    throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
  }

  return { page, limit, offset: (page - 1) * limit };
}

export async function readJsonObject(c: Context): Promise<Record<string, unknown>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_PARAMS", "JSONの形式が不正です");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ApiError(400, "INVALID_PARAMS", "リクエストボディの形式が不正です");
  }
  return raw as Record<string, unknown>;
}

export function isValidDateYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isValidIsoDateTime(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms);
}

export function normalizeTags(
  raw: unknown,
  maxItems: number,
  maxLength = 50,
  fieldName = "tags",
): string[] {
  if (raw === undefined || raw === null) return [];

  let arr: unknown;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      arr = JSON.parse(trimmed);
    } catch {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: fieldName, message: "tagsのJSON形式が不正です" },
      ]);
    }
  } else {
    arr = raw;
  }

  if (!Array.isArray(arr)) {
    throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
      { field: fieldName, message: "tagsは配列で指定してください" },
    ]);
  }

  if (arr.length > maxItems) {
    throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
      { field: fieldName, message: `タグは最大${maxItems}個までです` },
    ]);
  }

  const tags: string[] = [];
  for (const item of arr) {
    if (typeof item !== "string") {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: fieldName, message: "タグは文字列で指定してください" },
      ]);
    }
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > maxLength) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: fieldName, message: `各タグは1〜${maxLength}文字で指定してください` },
      ]);
    }
    if (!tags.includes(trimmed)) {
      tags.push(trimmed);
    }
  }
  return tags;
}

