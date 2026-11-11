"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Photo } from "@/lib/album";
import { mergePhotos, useHydrated, useLocalPosts } from "@/lib/posts";
import PhotoDetail from "./PhotoDetail";
import PostForm from "./PostForm";

function usePhoto(seed: Photo[], id: string) {
  const local = useLocalPosts();
  const hydrated = useHydrated();
  const photo = useMemo(
    () => mergePhotos(seed, local).find((p) => p.id === id),
    [seed, local, id]
  );
  return { photo, hydrated };
}

function Missing({ loading }: { loading: boolean }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-full bg-white p-5 text-[#2b2b2b]">
      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <>
          <p>この投稿は見つかりませんでした。</p>
          <Link
            href="/album"
            className="mt-4 inline-block text-[#5aaa64] underline"
          >
            アルバムに戻る
          </Link>
        </>
      )}
    </div>
  );
}

export function DetailLoader({
  id,
  seed,
  canEdit,
}: {
  id: string;
  seed: Photo[];
  canEdit: boolean;
}) {
  const { photo, hydrated } = usePhoto(seed, id);
  if (!photo) return <Missing loading={!hydrated} />;
  return <PhotoDetail key={photo.id} photo={photo} canEdit={canEdit} />;
}

export function EditLoader({ id, seed }: { id: string; seed: Photo[] }) {
  const { photo, hydrated } = usePhoto(seed, id);
  if (!photo) return <Missing loading={!hydrated} />;
  return <PostForm key={photo.id} photo={photo} />;
}
