"use client";

import { useSyncExternalStore } from "react";

// ログインした飼育員の印（Cookie）。ログインページが「role=keeper」を書き込む前提
function readKeeper() {
  return document.cookie.split("; ").includes("role=keeper");
}

const subscribe = () => () => {};

// サーバー側では常に false。ブラウザで開いたあとに、印を読んで切り替わる
export function useIsKeeper() {
  return useSyncExternalStore(subscribe, readKeeper, () => false);
}
