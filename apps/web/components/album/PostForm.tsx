"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";
import MoodBackground from "@/components/MoodBackground";
import { photos as seed, type Mood, type Photo } from "@/lib/album";
import { useIsKeeper } from "@/lib/keeper";
import {
  mergePhotos,
  removePost,
  savePost,
  useHydrated,
  useLocalPosts,
} from "@/lib/posts";

const MOODS: { value: Mood; label: string }[] = [
  { value: "kiri", label: "キリッ" },
  { value: "mattari", label: "まったり" },
];

const inputBase =
  "h-12 rounded-lg border border-[#ccc] bg-white px-3.5 text-sm text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#808080] focus:border-[#59ae69]";
const inputClass = `${inputBase} w-full`;
const labelClass = "text-sm font-bold text-[#333]";
const buttonBase =
  "flex h-12 w-full items-center justify-center rounded-lg border border-[#784c31] text-base font-bold text-[#fafafa]";

// POST /posts の制約
const TITLE_MAX = 50;
const DESCRIPTION_MAX = 1000;
const TAG_COUNT_MAX = 10;

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 大きい写真は縮めて保存する（ブラウザの保存容量が小さいため）
function fileToDataUrl(file: File, maxSize = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像を読み込めませんでした"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          ?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// photo があれば編集、なければ新規投稿
export default function PostForm({ photo }: { photo?: Photo }) {
  const router = useRouter();
  const keeper = useIsKeeper();
  const localPosts = useLocalPosts();
  const editing = Boolean(photo);

  const [title, setTitle] = useState(photo?.title ?? "");
  const [description, setDescription] = useState(photo?.description ?? "");
  const [mood, setMood] = useState<Mood>(photo?.mood ?? "kiri");
  const [tags, setTags] = useState<string[]>(photo?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [shotDate, setShotDate] = useState(photo?.shotDate ?? "");
  const [imageUrl, setImageUrl] = useState(photo?.imageUrl);
  const [imageError, setImageError] = useState(false);

  // 撮影日が空なら、今日の日付を出しておく（ブラウザで開いたあとに入る。
  // サーバーとブラウザで日付がずれないように、表示のときだけ決める）
  const hydrated = useHydrated();
  const shotDateValue = shotDate || (hydrated ? todayString() : "");

  // 過去に使ったタグ（まだ選んでいないもの）
  const pastTags = useMemo(
    () =>
      Array.from(
        new Set(mergePhotos(seed, localPosts).flatMap((p) => p.tags))
      ).filter((t) => !tags.includes(t)),
    [localPosts, tags]
  );

  function addTag(text: string) {
    const t = text.trim();
    if (!t || tags.includes(t) || tags.length >= TAG_COUNT_MAX) return;
    setTags([...tags, t]);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToDataUrl(file));
      setImageError(false);
    } catch {
      alert("画像を読み込めませんでした");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // API では写真（image）は必須
    if (!imageUrl) {
      setImageError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const post: Photo = {
      id: photo?.id ?? String(Date.now()),
      title: title.trim(),
      tags,
      mood,
      likes: photo?.likes ?? 0,
      imageUrl,
      createdAt: photo?.createdAt ?? new Date().toISOString(),
      description: description.trim(),
      shotDate: shotDate || todayString(),
      weather: photo?.weather, // TODO: 天気APIから入れる
      temperature: photo?.temperature,
      poster: photo?.poster ?? "飼育員", // TODO: ログインした飼育員の名前
      comments: photo?.comments ?? [],
    };
    if (savePost(post)) router.push(`/album/${post.id}`);
  }

  // 「投稿を削除」→ 確認ダイアログ →「投稿を削除」で消す
  const [confirmDelete, setConfirmDelete] = useState(false);

  function remove() {
    if (!photo) return;
    removePost(photo);
    router.push("/album");
  }

  if (!keeper) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-full bg-white p-5 text-[#2b2b2b]">
        <p>投稿・編集は、飼育員だけができます。</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-[#5aaa64] underline"
        >
          飼育員ログインへ
        </Link>
      </div>
    );
  }


  return (
    <div className="relative mx-auto min-h-screen w-full max-w-full text-[#333]">
      {/* 背景は選んでいるキリッ／まったりに合わせて変わる */}
      <MoodBackground mood={mood} />

      <header className="relative flex h-14 items-center gap-2 border-b border-[#ccc] bg-[#59ae69] px-4">
        <Link
          href={photo ? `/album/${photo.id}` : "/album"}
          aria-label="戻る"
          className="shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/back.svg" alt="" width={22} height={22} />
        </Link>
        <h1 className="flex-1 text-base font-bold text-white">
          {editing ? "投稿を編集・削除をする" : "新しく投稿をする"}
        </h1>
      </header>

      <form
        onSubmit={submit}
        className="relative flex flex-col gap-4 px-5 pb-5 pt-4"
      >
        {/* 写真のアップロード（動画は今は保存できません）。写真があればタップで選び直せる */}
        <label className="block w-full cursor-pointer">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="選んだ写真"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <span className="flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#999] bg-[#ebebeb]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/upload.svg" alt="" width={32} height={32} />
              <span className="text-sm font-bold text-[#333]">
                写真・動画をアップロード
              </span>
              <span className="text-xs text-[#808080]">タップして選択</span>
            </span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            className="hidden"
          />
        </label>
        {imageError && (
          <p className="-mt-2 text-xs text-[#fb3c32]" role="alert">
            写真を選んでください
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>タイトル</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
            maxLength={TITLE_MAX}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>コメント（任意）</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="コメントを入力"
            maxLength={DESCRIPTION_MAX}
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-4">
          <span className={labelClass}>キリッ・まったり</span>
          <div className="flex overflow-hidden rounded-lg border border-[#333]">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                aria-pressed={mood === m.value}
                className={`flex-1 py-2.5 text-[13px] ${
                  mood === m.value
                    ? "bg-[#f6985f] font-bold text-white shadow-[inset_0_4px_4px_rgba(0,0,0,0.25)]"
                    : "bg-white text-[#333]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 動物のタグ付け */}
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>動物のタグ付け</span>
          <div className="flex gap-1.5">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                // 日本語の変換を確定するEnterでは、追加しない
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              placeholder="新しくタグを入力"
              aria-label="新しいタグ"
              className={`${inputBase} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => {
                addTag(tagInput);
                setTagInput("");
              }}
              className="h-12 w-[73px] shrink-0 rounded-lg bg-[#f6985f] text-base font-bold text-white shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]"
            >
              追加
            </button>
          </div>

          <div className="relative">
            <select
              value=""
              onChange={(e) => addTag(e.target.value)}
              aria-label="過去に使ったタグから選択"
              className="h-12 w-full appearance-none rounded-lg border border-[#ccc] bg-white px-3.5 pr-10 text-sm text-[#808080] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25)] outline-none focus:border-[#59ae69]"
            >
              <option value="">過去に使ったタグから選択</option>
              {pastTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/chevron-down.svg"
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
            />
          </div>

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-2 py-2">
              {tags.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-1 rounded-2xl bg-[#fafafa] px-3 py-1.5 text-xs font-bold text-black shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                >
                  {t}
                  <button
                    type="button"
                    aria-label={`${t}を外す`}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#333]">
            撮影日（昔の写真は日付を変更）
          </span>
          <input
            type="date"
            value={shotDateValue}
            onChange={(e) => setShotDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          className={`${buttonBase} bg-[#f6985f] shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]`}
        >
          {editing ? "編集を保存" : "投稿"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={`${buttonBase} bg-[#fb3c32]`}
          >
            投稿を削除
          </button>
        )}
      </form>

      {/* 削除の確認ダイアログ */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[327px] flex-col items-center gap-7 bg-white px-4 py-[58px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/warning.svg" alt="" width={44} height={44} />
            <p
              id="delete-title"
              className="text-center text-2xl font-bold text-[#333]"
            >
              この投稿を削除しますか？
            </p>
            <div className="flex gap-7">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                autoFocus
                className="flex h-12 w-[105px] items-center justify-center rounded-lg border-2 border-[#59ae69] text-base text-black"
              >
                編集へ戻る
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex h-12 w-[105px] items-center justify-center rounded-lg border border-[#784c31] bg-[#fb3c32] text-base font-bold text-[#fafafa]"
              >
                投稿を削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
