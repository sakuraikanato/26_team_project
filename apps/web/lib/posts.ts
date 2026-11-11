"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Photo } from "@/lib/album";

// ブラウザに保存した投稿。削除は deleted: true の印で表す
export type StoredPost = Photo & { deleted?: boolean };

const KEY = "zoo-album-posts";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getRaw() {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function readList(): StoredPost[] {
  try {
    return JSON.parse(getRaw()) as StoredPost[];
  } catch {
    return [];
  }
}

function write(list: StoredPost[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    alert("保存できませんでした（写真が大きすぎるかもしれません）");
    return false;
  }
  listeners.forEach((l) => l());
  return true;
}

// 保存した投稿を読む（ブラウザで開いたあとに反映される）
export function useLocalPosts(): StoredPost[] {
  const raw = useSyncExternalStore(subscribe, getRaw, () => "[]");
  return useMemo(() => {
    try {
      return JSON.parse(raw) as StoredPost[];
    } catch {
      return [];
    }
  }, [raw]);
}

// ブラウザで開き終わったか
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ダミーデータ + 保存した投稿（同じidは上書き、削除印はなくす）
export function mergePhotos(seed: Photo[], local: StoredPost[]): Photo[] {
  const map = new Map<string, Photo>(seed.map((p) => [p.id, p]));
  for (const l of local) {
    if (l.deleted) map.delete(l.id);
    else map.set(l.id, { ...l, tags: l.tags ?? [] });
  }
  return Array.from(map.values());
}

// 新規作成にも編集にも使う
export function savePost(post: Photo) {
  const list = readList().filter((x) => x.id !== post.id);
  list.push(post);
  return write(list);
}

export function removePost(post: Photo) {
  const list = readList().filter((x) => x.id !== post.id);
  list.push({ ...post, deleted: true });
  return write(list);
}
