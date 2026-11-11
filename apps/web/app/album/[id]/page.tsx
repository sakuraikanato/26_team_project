import { Suspense } from "react";
import { DetailLoader } from "@/components/album/PhotoLoaders";
import { isKeeper, photos } from "@/lib/album";

type Params = Promise<{ id: string }>;

async function Detail({ params }: { params: Params }) {
  const { id } = await params;
  const keeper = await isKeeper();
  return <DetailLoader id={id} seed={photos} canEdit={keeper} />;
}

export default function PhotoPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-5">読み込み中…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
