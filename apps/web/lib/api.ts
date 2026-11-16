import { hc } from "hono/client";
import type { AppType } from "../../api/src/index";

// バックエンド（Hono）の URL。本番などで変えるときは NEXT_PUBLIC_API_URL を設定する
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hono の RPC クライアント。セッションの Cookie を送るため credentials: "include" を付ける
export const api = hc<AppType>(API_URL, {
  init: { credentials: "include" },
});
