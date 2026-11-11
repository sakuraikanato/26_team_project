"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { photos as seed, type Mood, type Photo } from "@/lib/album";
import { useIsKeeper } from "@/lib/keeper";
import { mergePhotos, removePost, savePost, useLocalPosts } from "@/lib/posts";

const MOODS: { value: Mood; label: string }[] = [
  { value: "kiri", label: "キリッ" },
  { value: "mattari", label: "まったり" },
];

const inputBase =
  "h-12 rounded-lg border border-gray-300 bg-white px-4 text-[15px] text-[#2b2b2b] outline-none placeholder:text-gray-400 focus:border-[#5aaa64]";
const inputClass = `${inputBase} w-full`;
const labelClass = "mb-2 mt-5 block text-[15px] font-bold";

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

  // 新規投稿の撮影日は、開いた日を最初に入れておく
  useEffect(() => {
    if (!photo) setShotDate((prev) => prev || todayString());
  }, [photo]);

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
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToDataUrl(file));
    } catch {
      alert("画像を読み込めませんでした");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
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

  function remove() {
    if (!photo) return;
    if (confirm("この投稿を削除しますか？")) {
      removePost(photo);
      router.push("/album");
    }
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
    <div className="mx-auto min-h-screen w-full max-w-full bg-white pb-10 text-[#2b2b2b]">
      <header className="flex h-14 items-center gap-3 bg-[#5aaa64] px-4 text-white">
        <Link
          href={photo ? `/album/${photo.id}` : "/album"}
          aria-label="戻る"
          className="text-3xl leading-none"
        >
          ‹
        </Link>
        <p className="text-lg font-bold">
          {editing ? "投稿を編集する" : "新しく投稿をする"}
        </p>
      </header>

      <form onSubmit={submit} className="px-5 pt-4">
        {/* 写真のアップロード（動画は今は保存できません） */}
        <label
          className={`flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-400 bg-[#ececec] ${
            imageUrl ? "aspect-[4/3]" : "h-[180px]"
          }`}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="選んだ写真"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 15V4" />
                <path d="M8 8l4-4 4 4" />
                <path d="M4 14v5h16v-5" />
              </svg>
              <span className="mt-3 text-[15px] font-bold text-[#333]">
                写真・動画をアップロード
              </span>
              <span className="mt-1 text-sm text-gray-500">タップして選択</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
        </label>

        <label className={labelClass}>タイトル</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力"
          className={inputClass}
        />

        <label className={labelClass}>コメント（任意）</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="コメントを入力"
          className={inputClass}
        />

        <label className={labelClass}>オン・オフ</label>
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#333]">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`h-[37px] text-[15px] ${
                mood === m.value
                  ? "bg-[#f5955a] font-bold text-white"
                  : "bg-white text-[#2b2b2b]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className={labelClass}>動物のタグ付け</label>
        <div className="flex gap-2">
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
            className={`${inputBase} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => {
              addTag(tagInput);
              setTagInput("");
            }}
            className="h-12 shrink-0 rounded-lg bg-[#f5955a] px-6 text-[17px] font-bold text-white"
          >
            追加
          </button>
        </div>

        <div className="relative mt-2">
          <select
            value=""
            onChange={(e) => addTag(e.target.value)}
            className={`${inputClass} appearance-none pr-10 text-gray-500`}
          >
            <option value="">過去に使ったタグから選択</option>
            {pastTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li
                key={t}
                className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold shadow-md"
              >
                {t}
                <button
                  type="button"
                  aria-label={`${t}を外す`}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="text-base leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className={labelClass}>撮影日（昔の写真は日付を変更）</label>
        <input
          type="date"
          value={shotDate}
          onChange={(e) => setShotDate(e.target.value)}
          className={inputClass}
        />

        <button
          type="submit"
          className="mt-6 h-[52px] w-full rounded-lg bg-[#f5955a] text-lg font-bold text-white"
        >
          {editing ? "保存" : "投稿"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={remove}
            className="mt-3 h-[52px] w-full rounded-lg border border-[#ef5b5b] bg-white text-base font-bold text-[#ef5b5b]"
          >
            この投稿を削除する
          </button>
        )}
      </form>
    </div>
  );
}
