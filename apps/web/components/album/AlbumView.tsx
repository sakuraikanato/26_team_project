"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MoodFilter, Photo, SortKey } from "@/lib/album";

const TABS: { value: MoodFilter; label: string }[] = [
{ value: "kiri", label: "キリッ" },
{ value: "mattari", label: "まったり" },
{ value: "both", label: "両方" },
];

const MOOD_LABEL = { kiri: "キリッ", mattari: "まったり" } as const;

type Props = {
photos: Photo[];
  defaultMood: MoodFilter; // 天気で決まる最初のタブ
  canPost: boolean; // 飼育員だけ true
};

export default function AlbumView({ photos, defaultMood, canPost }: Props) {
const [mood, setMood] = useState<MoodFilter>(defaultMood);
const [animal, setAnimal] = useState("all");
const [sort, setSort] = useState<SortKey>("newest");

const animalNames = useMemo(
    () => Array.from(new Set(photos.map((p) => p.animalName))),
    [photos]
);

const visible = useMemo(
    () =>
    photos
        .filter((p) => mood === "both" || p.mood === mood)
        .filter((p) => animal === "all" || p.animalName === animal)
        .sort((a, b) =>
        sort === "likes"
            ? b.likes - a.likes
            : +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
    [photos, mood, animal, sort]
);

return (
    <div className="relative mx-auto min-h-screen w-full max-w-full bg-white pb-20 text-[#2b2b2b]">
      {/* ヘッダー＋タブ */}
    <header className="bg-[#5aaa64] px-4 pb-3.5 pt-10">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border-2 border-[#4a9455]">
        {TABS.map((t) => (
            <button
            key={t.value}
            onClick={() => setMood(t.value)}
            className={`w-full py-3 text-[15px] font-bold text-white ${
                mood === t.value ? "bg-[#f5955a]" : "bg-[#5aaa64]"
            }`}
            >
            {t.label}
            </button>
        ))}
        </div>
    </header>

      {/* 絞り込み・並べ替え */}
    <div className="flex gap-2 px-4 py-3">
        <div className="relative">
<select
        value={animal}
        onChange={(e) => setAnimal(e.target.value)}
        aria-label="動物名で絞り込み"
        className="h-[34px] appearance-none rounded-full border border-gray-300 bg-white pl-3.5 pr-8 text-[13px] text-gray-600"
        >
        <option value="all">動物名</option>
        {animalNames.map((name) => (
            <option key={name} value={name}>
            {name}
            </option>
        ))}
        </select>
<span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">▼</span>
</div>
        {(
        [
            { key: "newest", label: "新着順" },
            { key: "likes", label: "いいね順" },
        ] as const
        ).map((s) => (
        <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`h-[34px] rounded-full border px-3.5 text-[13px] ${
            sort === s.key
                ? "border-[#f5955a] bg-[#f5955a] font-bold text-white"
                : "border-gray-300 bg-white text-gray-600"
            }`}
        >
            {s.label}
        </button>
        ))}
    </div>

      {/* 写真一覧 */}
    <main className="flex flex-col gap-6 px-5 pb-6 pt-1">
        {visible.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
            この条件の写真はまだありません
        </p>
        ) : (
        visible.map((p) => (
            // 写真詳細（/album/[id]）はアルバム完成後に作る予定
            <Link
            key={p.id}
            href={`/album/${p.id}`}
            className="block bg-white shadow-md"
            >
            {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                src={p.imageUrl}
                alt={`${p.animalName}（${p.species}）`}
                className="aspect-[4/3] w-full object-cover"
                />
            ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-200 text-5xl">
                🐾
                </div>
            )}
            <div className="px-3 pb-3 pt-2.5">
                <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold">{p.title}</span>
                <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${
                    p.mood === "mattari" ? "bg-[#5b9bf5]" : "bg-[#5aaa64]"
                    }`}
                >
                    {MOOD_LABEL[p.mood]}
                </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                <span className="rounded-full border-[1.5px] border-[#222] px-2.5 py-px text-xs">
                    {p.animalName}（{p.species}）
                </span>
                <span className="text-[13px] text-gray-500">
                    <span className="text-[#ef5b5b]">♥</span> {p.likes}
                </span>
                </div>
            </div>
            </Link>
        ))
        )}
    </main>

      {/* 投稿ボタン（飼育員だけ。投稿ページ /album/new は未作成） */}
    {canPost && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 flex w-full max-w-full -translate-x-1/2 justify-end px-4">
        <Link
            href="/album/new"
            className="pointer-events-auto rounded-full bg-[#f5955a] px-5 py-3.5 text-[15px] font-bold text-white shadow-lg"
        >
            ＋ 新しく投稿する
        </Link>
        </div>
    )}

      {/* 下部ナビ（カレンダーは別担当。リンク先が決まったら合わせる） */}
    <nav className="fixed bottom-0 left-1/2 flex h-16 w-full max-w-full -translate-x-1/2 border-t border-gray-300 bg-white">
        <Link
        href="/album"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#5aaa64] text-[11px] text-white"
        >
        <span aria-hidden>🖼</span>
        <span>アルバム</span>
        </Link>
        <Link
        href="/calendar"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-gray-600"
        >
        <span aria-hidden>📅</span>
        <span>カレンダー</span>
        </Link>
    </nav>
    </div>
);
}
