"use client";

import { useMe } from "./session";

// 飼育員としてログインしているか。いまはログインできるのが飼育員だけなので「ログイン中 = 飼育員」
// TODO: ユーザーに role（USER / KEEPER）が付いたら、user.role === "KEEPER" で判定する
export function useIsKeeper() {
  return Boolean(useMe());
}
