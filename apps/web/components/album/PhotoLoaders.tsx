"use client";

import type { Photo } from "@/lib/album";
import PhotoDetail from "./PhotoDetail";
import PostForm from "./PostForm";

export function DetailLoader({
  photo,
  canEdit,
}: {
  photo: Photo;
  canEdit: boolean;
}) {
  return <PhotoDetail key={photo.id} photo={photo} canEdit={canEdit} />;
}

export function EditLoader({ photo }: { photo: Photo }) {
  return <PostForm key={photo.id} photo={photo} />;
}
