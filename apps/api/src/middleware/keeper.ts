import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { auth, type AuthSession, type AuthUser } from "../../lib/auth.js";
import { db } from "../db/index.js";
import { user as userTable } from "../db/schema/index.js";
import { ApiError } from "../lib/errors.js";

export type KeeperEnv = {
  Variables: {
    user: AuthUser;
    session: AuthSession;
  };
};

export const requireKeeper = createMiddleware<KeeperEnv>(async (c, next) => {
  const result = await auth.api
    .getSession({ headers: c.req.raw.headers })
    .catch(() => null);

  if (!result) {
    throw new ApiError(401, "UNAUTHORIZED", "ログインが必要です");
  }

  const rawRole = (result.user as Record<string, unknown>).role;
  let role: string | null =
    rawRole === "KEEPER" ? "KEEPER" : rawRole === "USER" ? "USER" : null;

  if (!role) {
    const rows = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, Number(result.user.id)))
      .limit(1);
    role = rows[0]?.role ?? "USER";
  }

  if (role !== "KEEPER") {
    throw new ApiError(403, "FORBIDDEN", "この操作は飼育員のみ実行できます");
  }

  c.set("user", result.user);
  c.set("session", result.session);
  await next();
});
