import { Suspense } from "react";
import { EditLoader } from "@/components/album/PhotoLoaders";
import { getAlbumPhoto } from "@/lib/album";

type Params = Promise<{ id: string }>;

async function Edit({ params }: { params: Params }) {
  const { id } = await params;
  const photo = await getAlbumPhoto(id);
  return <EditLoader photo={photo} />;
}

export default function EditPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-5">読み込み中…</p>}>
      <Edit params={params} />
    </Suspense>
  );
}
