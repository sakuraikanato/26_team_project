import { createMiddleware } from "hono/factory";
import { auth, type AuthSession, type AuthUser } from "../../lib/auth.js";

// ログインが必要なルートで使うコンテキストの型。c.get("user") / c.get("session") で取り出せる
export type AuthEnv = {
  Variables: {
    user: AuthUser;
    session: AuthSession;
  };
};

// Cookie のセッションを確かめて、user と session をコンテキストに入れる。
// セッションが取れなければ 401（共通エラー形式）を返して、先の処理には進まない
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const result = await auth.api
    .getSession({ headers: c.req.raw.headers })
    .catch(() => null);

  if (!result) {
    return c.json(
      { code: "UNAUTHORIZED", message: "ログインが必要です" } as const,
      401,
    );
  }

  c.set("user", result.user);
  c.set("session", result.session);
  await next();
});
