"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import MoodBackground from "@/components/MoodBackground";
import { useIsKeeper } from "@/lib/keeper";
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
const keeperUser = useIsKeeper();
  const [liked, setLiked] = useState(false);
const [comments, setComments] = useState(photo.comments);
const [text, setText] = useState("");

const likes = photo.likes + (liked ? 1 : 0);
const weather = photo.weather ? WEATHER[photo.weather] : undefined;

  // TODO: 今は画面上だけに追加。あとでAPIに送る
function submit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setComments([...comments, { id: String(Date.now()), name: "あなた", text: t }]);
    setText("");
}

return (
    <div className="relative mx-auto min-h-screen w-full max-w-full pb-40 text-[#333]">
      {/* 背景は写真のキリッ／まったりに合わせる */}
      <MoodBackground mood={photo.mood} />

      {/* ヘッダー */}
      <header className="relative flex items-center gap-3 bg-[#59ae69] px-4 py-4 text-white">
        <Link
          href="/album"
          aria-label="アルバムに戻る"
          className="text-3xl leading-none"
        >
          ‹
        </Link>
        <p className="text-lg font-bold">{photo.title}</p>
      </header>

      <main className="relative flex flex-col items-start gap-3 px-5 pb-5 pt-4">
        {/* 写真 */}
        {photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.imageUrl}
            alt={photo.tags[0] ?? photo.title}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-200 text-6xl">
            🐾
          </div>
        )}

        {/* タイトル・いいね・説明・撮影日のカード */}
        <section className="flex w-full flex-col gap-3 rounded-[11px] bg-[#fafafa] p-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-[5px]">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold">{photo.title}</h1>
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                aria-pressed={liked}
                className={`flex shrink-0 items-center gap-1.5 rounded-[18px] border px-3.5 py-2 text-[13px] font-bold ${
                  liked ? "border-[#f6985f]" : "border-[#ccc]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/heart-filled.svg" alt="" width={18} height={18} />
                <span>いいね {likes}</span>
              </button>
            </div>
            <p className="text-xs text-black">{photo.description}</p>
          </div>

          {/* 撮影日・天気・気温・投稿者 */}
          <p className="flex items-center gap-1.5 text-xs text-[#808080]">
            {weather &&
              (photo.weather === "sunny" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/icons/weather-sunny.svg" alt="" width={16} height={16} />
              ) : (
                <span aria-hidden>{weather.icon}</span>
              ))}
            <span>
              {formatDate(photo.shotDate)}
              {weather &&
                `・${weather.label}${
                  photo.temperature != null ? ` ${photo.temperature}℃` : ""
                }`}
              ・投稿：{photo.poster}
            </span>
          </p>
        </section>

        {/* タグ */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-2xl px-3 py-1.5 text-xs font-bold text-white ${
              photo.mood === "mattari" ? "bg-[#5899fb]" : "bg-[#fb6058]"
            }`}
          >
            {MOOD_LABEL[photo.mood]}
          </span>
          {photo.tags.map((t) => (
            <span
              key={t}
              className="rounded-2xl border border-[#ccc] bg-white px-3 py-1.5 text-[11px] text-black"
            >
              {t}
            </span>
          ))}
        </div>

        {/* コメントのカード */}
        <section className="flex w-full flex-col gap-3 rounded-[11px] bg-[#fafafa] p-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
          <h2 className="text-sm font-bold">コメント（{comments.length}）</h2>
          {comments.length > 0 && (
            <ul className="flex flex-col divide-y divide-black">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-xs font-bold">{c.name}</p>
                  <p className="text-[13px]">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* イベントへのリンク（カレンダーは別担当。リンク先が決まったら合わせる） */}
        <Link
          href="/calendar"
          className="rounded-[17px] bg-[#59ae69] px-2.5 py-[5px] text-xl font-bold text-[#fafafa] drop-shadow-[0_4px_2px_rgba(0,0,0,0.25)]"
        >
          この子が出るイベントへ →
        </Link>
      </main>

      {/* 投稿の編集・削除（飼育員だけ） */}
      {(canEdit || keeperUser) && (
        <Link
          href={`/album/${photo.id}/edit`}
          className="fixed bottom-24 right-5 flex h-[42px] items-center gap-1.5 rounded-3xl bg-[#f6985f] px-[18px] text-base font-bold text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/edit.svg" alt="" width={24} height={24} />
          投稿の編集・削除
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
