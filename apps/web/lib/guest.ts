"use client";

import { useSyncExternalStore } from "react";

// 一般の人の名前（コメントの name に使う）。ブラウザに保存しておく
const KEY = "guestName";
const EVENT = "guestname-change";

export const GUEST_NAME_MAX = 20;

// ブラウザに保存できないとき（プライベートモードなど）の控え
let memory = "";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// サーバーでは null（まだ分からない）。ブラウザで開いたあとに保存した名前（なければ ""）になる
export function useGuestName(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveGuestName(name: string) {
  memory = name.trim().slice(0, GUEST_NAME_MAX);
  try {
    localStorage.setItem(KEY, memory);
  } catch {
    // 保存できなくても、この画面の間は使えるようにする
  }
  window.dispatchEvent(new Event(EVENT));
}
