"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { Photo, Weather } from "@/lib/album";

const WEATHER: Record<Weather, { icon: string; label: string }> = {
sunny: { icon: "☀️", label: "晴れ" },
rainy: { icon: "🌧", label: "雨" },
cloudy: { icon: "☁️", label: "曇り" },
snowy: { icon: "❄️", label: "雪" },
};

const MOOD_LABEL = { kiri: "キリッ", mattari: "まったり" } as const;

// "2026-10-28" → "2026年10月28日"
function formatDate(iso: string) {
const [y, m, d] = iso.split("-").map(Number);
return `${y}年${m}月${d}日`;
}

type Props = {
photo: Photo;
  canEdit: boolean; // 飼育員だけ true
};

export default function PhotoDetail({ photo, canEdit }: Props) {
const [liked, setLiked] = useState(false);
const [comments, setComments] = useState(photo.comments);
const [text, setText] = useState("");

const likes = photo.likes + (liked ? 1 : 0);
const weather = WEATHER[photo.weather];

  // TODO: 今は画面上だけに追加。あとでAPIに送る
function submit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setComments([...comments, { id: String(Date.now()), name: "あなた", text: t }]);
    setText("");
}

return (
    <div className="relative mx-auto min-h-screen w-full max-w-full bg-white pb-40 text-[#2b2b2b]">
      {/* ヘッダー */}
    <header className="flex items-center gap-3 bg-[#5aaa64] px-4 py-4 text-white">
        <Link
        href="/album"
        aria-label="アルバムに戻る"
        className="text-3xl leading-none"
        >
        ‹
        </Link>
        <p className="text-lg font-bold">{photo.title}</p>
    </header>

    <main className="px-5 pt-4">
        {/* 写真 */}
        {photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
        <img
            src={photo.imageUrl}
            alt={`${photo.animalName}（${photo.species}）`}
            className="aspect-[4/3] w-full object-cover"
        />
        ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-200 text-6xl">
            🐾
        </div>
        )}

        {/* タイトル＋いいね */}
        <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{photo.title}</h1>
        <button
            type="button"
            onClick={() => setLiked(!liked)}
            aria-pressed={liked}
            className={`flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-[15px] font-bold shadow-sm ${
            liked ? "border-[#f5955a]" : "border-gray-300"
            }`}
        >
            <span className="text-[#ef5b5b]">♥</span>
            <span>いいね {likes}</span>
        </button>
        </div>

        <p className="mt-3 text-[13px]">{photo.description}</p>

        {/* 撮影日・天気・気温・投稿者 */}
        <p className="mt-3 text-xs text-gray-500">
        <span aria-hidden>{weather.icon}</span> {formatDate(photo.shotDate)}・
        {weather.label} {photo.temperature}℃・投稿：{photo.poster}
        </p>

        {/* タグ */}
        <div className="mt-3 flex gap-2">
        <span
            className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
            photo.mood === "mattari" ? "bg-[#5b9bf5]" : "bg-[#5aaa64]"
            }`}
        >
            {MOOD_LABEL[photo.mood]}
        </span>
        <span className="rounded-full border border-gray-400 px-3 py-1 text-xs">
            {photo.animalName}（{photo.species}）
        </span>
        </div>

        {/* イベントへのリンク（カレンダーは別担当。リンク先が決まったら合わせる） */}
        <Link
        href="/calendar"
        className="mt-4 inline-block rounded-full bg-[#5aaa64] px-5 py-2 text-xl font-bold text-white"
        >
        この子が出るイベントへ →
        </Link>

        {/* コメント */}
        <section className="mt-5">
        <h2 className="text-[15px] font-bold">コメント（{comments.length}）</h2>
        <ul className="mt-3 flex flex-col gap-3">
            {comments.map((c) => (
            <li key={c.id}>
                <p className="text-[13px] font-bold">{c.name}</p>
                <p className="text-sm">{c.text}</p>
            </li>
            ))}
        </ul>
        </section>
    </main>

      {/* 投稿の編集・削除（飼育員だけ。編集ページ /album/[id]/edit は未作成） */}
    {canEdit && (
        <Link
        href={`/album/${photo.id}/edit`}
        className="fixed bottom-24 right-4 rounded-full bg-[#f5955a] px-5 py-3.5 text-[15px] font-bold text-white shadow-lg"
        >
        ✎ 投稿の編集・削除
        </Link>
    )}

      {/* コメント入力 */}
    <form
        onSubmit={submit}
        className="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t border-gray-300 bg-white px-4 py-3"
    >
        <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="コメントを書く"
        className="h-11 flex-1 rounded-full bg-gray-200 px-4 text-sm text-[#2b2b2b] outline-none placeholder:text-gray-500"
        />
        <button
        type="submit"
        aria-label="コメントを送る"
        className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f5955a] text-xl text-white"
        >
        ➤
        </button>
    </form>
    </div>
);
}