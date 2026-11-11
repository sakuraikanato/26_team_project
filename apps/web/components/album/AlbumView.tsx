"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useIsKeeper } from "@/lib/keeper";
import { mergePhotos, useLocalPosts } from "@/lib/posts";
import type { MoodFilter, Photo, SortKey } from "@/lib/album";

const TABS: { value: MoodFilter; label: string }[] = [
  { value: "kiri", label: "キリッ" },
  { value: "mattari", label: "まったり" },
  { value: "both", label: "両方" },
];

const MOOD_LABEL = { kiri: "キリッ", mattari: "まったり" } as const;

// 上のタブごとの背景グラデーション（Figma: 03 トップ（ON）／（OFF）／アルバム（両方））
const BG_GRADIENT: Record<MoodFilter, string> = {
  kiri: "linear-gradient(to bottom, #fff5ef 16.827%, #f8e0d1 58.413%, #f2c1a3)",
  mattari: "linear-gradient(to bottom, #eaf0f5 16.827%, #abc5e7 62.981%, #6793d6)",
  both: "linear-gradient(to bottom, #f0fcf2, #b5debc 57%, #8dc998)",
};

// 背景の模様。キリッは太陽、まったりは雨つぶを互い違いに並べる
function MoodBackground({ mood }: { mood: MoodFilter }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ background: BG_GRADIENT[mood] }}
    >
      {mood === "kiri" && (
        <div className="absolute left-1/2 top-1/2 flex w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          {Array.from({ length: 7 }, (_, row) => (
            <div
              key={row}
              className={`flex opacity-30 mix-blend-overlay ${
                row % 2 === 0 ? "justify-center" : "w-full"
              }`}
            >
              {Array.from({ length: row % 2 === 0 ? 5 : 4 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src="/bg/sunny-tile.svg"
                  alt=""
                  width={120}
                  height={120}
                  className="shrink-0"
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {mood === "mattari" && (
        <div className="absolute left-1/2 top-1/2 flex w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col">
          {["a", "a", "a", "a", "b", "c", "d"].map((tile, row) => (
            <div key={row} className="flex w-[600px] items-center">
              {/* 奇数行は半分ずらす（Figmaの60pxの余白） */}
              {row % 2 === 1 && <div className="h-[120px] w-[60px] shrink-0" />}
              {Array.from({ length: row % 2 === 0 ? 5 : 4 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/bg/rain-tile-${tile}.svg`}
                  alt=""
                  width={120}
                  height={120}
                  className="shrink-0"
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  photos: Photo[];
  defaultMood: MoodFilter; // 天気で決まる最初のタブ
  canPost: boolean; // 飼育員だけ true
};

export default function AlbumView({
  photos: seedPhotos,
  defaultMood,
  canPost,
}: Props) {
  const localPosts = useLocalPosts();
  const photos = useMemo(
    () => mergePhotos(seedPhotos, localPosts),
    [seedPhotos, localPosts]
  );
  const keeperUser = useIsKeeper();
  const [mood, setMood] = useState<MoodFilter>(defaultMood);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");


  const visible = useMemo(
    () =>
      photos
        .filter((p) => mood === "both" || p.mood === mood)
        .filter(
          (p) =>
            query.trim() === "" ||
            p.tags.some((t) =>
              t.toLowerCase().includes(query.trim().toLowerCase())
            )
        )
        .sort((a, b) =>
          sort === "likes"
            ? b.likes - a.likes
            : +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
    [photos, mood, query, sort]
  );

  // 端まで引っぱったときの「びよん」と伸びる動きを止める（このページにいる間だけ）
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";
    return () => {
      html.style.overscrollBehaviorY = prev;
    };
  }, []);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-full pb-16 pt-[87px] text-[#333]">
      <MoodBackground mood={mood} />

      {/* ヘッダー＋タブ。画面に固定して動かないようにする（高さ87px。上の pt-[87px] と合わせる） */}
      <header className="fixed left-1/2 top-0 z-20 h-[87px] w-full max-w-full -translate-x-1/2 border-b border-[#ccc] bg-[#59ae69] px-4 pb-2 pt-10">
        <div className="flex overflow-hidden rounded-lg border border-[#5f5f5f] bg-[#488b55]">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setMood(t.value)}
              aria-pressed={mood === t.value}
              className={`h-9 flex-1 rounded-[5px] text-[13px] font-bold text-white ${
                mood === t.value
                  ? "bg-[#f6985f] shadow-[inset_0_4px_4px_rgba(0,0,0,0.25)]"
                  : "bg-[#59ae69] shadow-[inset_0_-1px_4px_rgba(0,0,0,0.25)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* 絞り込み・並べ替え */}
      <div className="relative flex gap-2 px-5 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索"
          aria-label="動物名で検索"
          className="w-[137px] min-w-0 rounded-2xl border border-[#ccc] bg-white px-3 py-1.5 text-xs text-[#333] outline-none placeholder:text-[#333] focus:border-[#59ae69]"
        />
        {(
          [
            { key: "newest", label: "新着順" },
            { key: "likes", label: "いいね順" },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            aria-pressed={sort === s.key}
            className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs ${
              sort === s.key
                ? "border-[#f6985f] bg-[#f6985f] font-bold text-white shadow-[inset_0_4px_4px_rgba(0,0,0,0.25)]"
                : "border-[#ccc] bg-white text-[#333]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 写真一覧 */}
      <main className="relative flex flex-col gap-3.5 pb-5">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-[#808080]">
            この条件の写真はまだありません
          </p>
        ) : (
          visible.map((p) => (
            <div key={p.id} className="px-5 py-2">
              <Link
                href={`/album/${p.id}`}
                className="flex flex-col gap-1.5 bg-[#fafafa] drop-shadow-[0_3px_3.5px_rgba(0,0,0,0.25)]"
              >
                {p.imageUrl ? (
                  // 縦長の写真もそのままの比率で表示する（Figmaの vertical）
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.tags[0] ?? p.title}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#e5e5e5] text-5xl">
                    🐾
                  </div>
                )}
                <div className="flex flex-col gap-1.5 p-[5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold">{p.title}</span>
                    <span
                      className={`shrink-0 rounded-[10px] px-2 py-0.5 text-[11px] text-[#fafafa] ${
                        p.mood === "mattari" ? "bg-[#5899fb]" : "bg-[#fb6058]"
                      }`}
                    >
                      {MOOD_LABEL[p.mood]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-[10px] border border-black bg-[#fafafa] px-2 py-0.5 text-[11px] text-black"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[#808080]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          p.isLiked
                            ? "/icons/heart-filled.svg"
                            : "/icons/heart-outline.svg"
                        }
                        alt={p.isLiked ? "いいね済み" : "いいね"}
                        width={14}
                        height={14}
                      />
                      {p.likes}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </main>

      {/* 投稿ボタン（飼育員だけ） */}
      {(canPost || keeperUser) && (
        <div className="pointer-events-none fixed bottom-[90px] left-1/2 flex w-full max-w-full -translate-x-1/2 justify-end px-5">
          <Link
            href="/album/new"
            className="pointer-events-auto flex h-[42px] items-center gap-1.5 rounded-3xl bg-[#f6985f] px-[18px] text-base font-bold text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/plus.svg" alt="" width={18} height={18} />
            新しく投稿をする
          </Link>
        </div>
      )}

      {/* 下部ナビ（カレンダーは別担当。リンク先が決まったら合わせる） */}
      <nav className="fixed bottom-0 left-1/2 flex h-16 w-full max-w-full -translate-x-1/2 bg-white">
        <Link
          href="/album"
          aria-current="page"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#59ae69] text-[10px] text-[#fafafa] shadow-[inset_0_3px_4px_rgba(0,0,0,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/tab-album.svg" alt="" width={22} height={22} />
          <span>アルバム</span>
        </Link>
        <Link
          href="/calendar"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#fafafa] text-[10px] text-[#808080] shadow-[inset_0_-3px_4px_rgba(0,0,0,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/tab-calendar.svg" alt="" width={22} height={22} />
          <span>カレンダー</span>
        </Link>
      </nav>
    </div>
  );
}
