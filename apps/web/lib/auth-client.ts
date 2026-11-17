import { createAuthClient } from "better-auth/react";
import { API_URL } from "./api";

// better-auth の認証クライアント。ログイン・ログアウトはこれを通して行う
// （バックエンドの /api/auth/* につながる。Cookie は自動で送られる）
export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: "/api/auth",
});
