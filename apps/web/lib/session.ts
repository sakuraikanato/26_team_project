"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api } from "./api";
import { authClient } from "./auth-client";

// GET /api/auth/me の返り値（ログイン中のユーザーとセッション）
type MeResponse = Awaited<
  ReturnType<Awaited<ReturnType<typeof api.api.auth.me.$get>>["json"]>
>;
export type Me = Extract<MeResponse, { user: unknown }>;

// undefined = まだ確かめていない / null = 未ログイン
let me: Me | null | undefined;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

// バックエンドの /me（Hono RPC）でセッションを取り直す
export function refreshMe(): Promise<void> {
  loading ??= (async () => {
    try {
      const res = await api.api.auth.me.$get();
      me = res.ok ? ((await res.json()) as Me) : null;
    } catch {
      me = null;
    }
    emit();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

// ログイン中のユーザーとセッション。サーバーと確かめる前は undefined
export function useMe(): Me | null | undefined {
  useEffect(() => {
    if (me === undefined) void refreshMe();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => me,
    () => undefined,
  );
}

// メールアドレスとパスワードでログインする。失敗したら better-auth のエラー（status と code）を返す
// （メールアドレスかパスワードが違うときは 401 INVALID_EMAIL_OR_PASSWORD）
export async function login(email: string, password: string) {
  const { error } = await authClient.signIn.email({ email, password });
  if (error) return error;
  await refreshMe();
  return null;
}

// ログアウトする（セッションの Cookie を消す）
export async function logout() {
  await authClient.signOut();
  me = null;
  emit();
}
