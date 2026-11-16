import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { auth } from "../../lib/auth.js";
import { db } from "../db/index.js";
import { user as userTable } from "../db/schema/index.js";
import { ApiError, type ErrorDetail } from "../lib/errors.js";
import { requireAuth, type AuthEnv } from "../middleware/auth.js";

function forwardSetCookies(source: Headers, append: (name: string, value: string) => void) {
  const cookies = typeof source.getSetCookie === "function" ? source.getSetCookie() : [];
  if (cookies.length > 0) {
    for (const cookie of cookies) {
      append("Set-Cookie", cookie);
    }
    return cookies;
  }
  const single = source.get("set-cookie");
  if (single) {
    append("Set-Cookie", single);
    return [single];
  }
  return [];
}

function buildCookieHeader(setCookies: string[]): string {
  return setCookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function parseJsonBody(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ApiError(400, "INVALID_PARAMS", "リクエストボディの形式が不正です");
  }
  return raw as Record<string, unknown>;
}

export const authRoutes = new Hono<AuthEnv>()
  .post("/register", async (c) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      throw new ApiError(400, "INVALID_PARAMS", "JSONの形式が不正です");
    }

    const body = parseJsonBody(rawBody);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    const details: ErrorDetail[] = [];
    if (!name || name.length > 50) {
      details.push({ field: "name", message: "表示名は1〜50文字で入力してください" });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      details.push({ field: "email", message: "有効なメールアドレスを入力してください" });
    }
    if (!password || password.length < 8) {
      details.push({ field: "password", message: "パスワードは8文字以上で入力してください" });
    }
    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    let role: "USER" | "KEEPER" = "USER";
    if (inviteCode.length > 0) {
      const expectedCode = process.env.KEEPER_INVITE_CODE;
      if (!expectedCode || inviteCode !== expectedCode) {
        throw new ApiError(400, "INVALID_INVITE_CODE", "招待コードが正しくありません", [
          { field: "inviteCode", message: "招待コードが正しくありません" },
        ]);
      }
      role = "KEEPER";
    }

    const signupResult = await (async () => {
      try {
        return await auth.api.signUpEmail({
          body: { name, email, password },
          headers: c.req.raw.headers,
          returnHeaders: true,
        });
      } catch (err: unknown) {
        const status = typeof err === "object" && err !== null && "statusCode" in err
          ? Number((err as { statusCode?: unknown }).statusCode)
          : 0;
        const errBody = typeof err === "object" && err !== null && "body" in err
          ? (err as { body?: { code?: string; message?: string } }).body
          : undefined;
        const code = errBody?.code ?? "";
        if (
          status === 422 ||
          status === 409 ||
          code.includes("USER_ALREADY_EXISTS") ||
          (err instanceof Error && err.message.toLowerCase().includes("already exists"))
        ) {
          throw new ApiError(409, "EMAIL_TAKEN", "このメールアドレスは既に登録されています", [
            { field: "email", message: "このメールアドレスは既に登録されています" },
          ]);
        }
        throw new ApiError(400, "INVALID_PARAMS", errBody?.message ?? "ユーザー登録に失敗しました");
      }
    })();

    const userId = Number(signupResult.response.user.id);
    if (role === "KEEPER") {
      await db.update(userTable).set({ role: "KEEPER" }).where(eq(userTable.id, userId));
    }

    const setCookies = forwardSetCookies(signupResult.headers, (k, v) =>
      c.header(k, v, { append: true }),
    );
    const cookieHeader = buildCookieHeader(setCookies);
    const sessionData = cookieHeader
      ? await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) })
      : null;

    if (sessionData?.session && sessionData?.user) {
      return c.json(sessionData, 201);
    }

    return c.json(
      {
        session: null,
        user: {
          ...signupResult.response.user,
          role,
        },
      },
      201,
    );
  })
  .post("/login", async (c) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      throw new ApiError(400, "INVALID_PARAMS", "JSONの形式が不正です");
    }

    const body = parseJsonBody(rawBody);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const details: ErrorDetail[] = [];
    if (!email) {
      details.push({ field: "email", message: "メールアドレスは必須です" });
    }
    if (!password) {
      details.push({ field: "password", message: "パスワードは必須です" });
    }
    if (details.length > 0) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", details);
    }

    const signInResult = await (async () => {
      try {
        return await auth.api.signInEmail({
          body: { email, password },
          headers: c.req.raw.headers,
          returnHeaders: true,
        });
      } catch {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "メールアドレスまたはパスワードが正しくありません",
        );
      }
    })();

    const setCookies = forwardSetCookies(signInResult.headers, (k, v) =>
      c.header(k, v, { append: true }),
    );
    const cookieHeader = buildCookieHeader(setCookies);
    const sessionData = cookieHeader
      ? await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) })
      : null;

    if (sessionData?.session && sessionData?.user) {
      return c.json(sessionData, 200);
    }

    return c.json(
      {
        session: null,
        user: signInResult.response.user,
      },
      200,
    );
  })
  .post("/logout", requireAuth, async (c) => {
    const signOutResult = await auth.api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    forwardSetCookies(signOutResult.headers, (k, v) => c.header(k, v, { append: true }));
    return c.body(null, 204);
  })
  .get("/me", requireAuth, (c) => {
    return c.json(
      {
        session: c.get("session"),
        user: c.get("user"),
      },
      200,
    );
  });
