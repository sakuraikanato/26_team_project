import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";

// ログイン・ログアウトは better-auth の /api/auth/* が受け持つ。ここでは自前のルートだけ置く
export const authRoutes = new Hono()
  // GET /api/auth/me … ログイン中のユーザーとセッションを返す（未ログインは 401）
  .get("/me", requireAuth, (c) => {
    return c.json({ user: c.get("user"), session: c.get("session") }, 200);
  });
