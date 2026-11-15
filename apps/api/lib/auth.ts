import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../src/db/index.js"; // your drizzle instance

// フロント（Next.js）のURL。Cookie つきのリクエストを受け付ける相手
export const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  // API 設計書のベース URL（/api/v1）にそろえる
  basePath: "/api/v1/auth",
  database: drizzleAdapter(db, {
      provider: "sqlite", // or "mysql", "sqlite"
  }),
  // メールアドレスとパスワードでログインする
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: webOrigins,
  advanced: {
    database: {
      generateId: "serial"
    },
    // 今回は http で動かすので Secure を付けない（https にするときは true に戻す）
    useSecureCookies: false,
    // セッションの Cookie（API 設計書どおり HttpOnly / SameSite=Lax / Path=/）
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
    },
  },
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
