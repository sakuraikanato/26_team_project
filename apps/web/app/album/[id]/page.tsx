import { Suspense } from "react";
import { DetailLoader } from "@/components/album/PhotoLoaders";
import { getAlbumPhoto } from "@/lib/album";

type Params = Promise<{ id: string }>;

async function Detail({ params }: { params: Params }) {
  const { id } = await params;
  const photo = await getAlbumPhoto(id);
  return <DetailLoader photo={photo} canEdit={false} />;
}

export default function PhotoPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-5">読み込み中…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
