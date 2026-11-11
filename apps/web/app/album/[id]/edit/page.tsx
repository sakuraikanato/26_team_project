import { Suspense } from "react";
import { EditLoader } from "@/components/album/PhotoLoaders";
import { photos } from "@/lib/album";

type Params = Promise<{ id: string }>;

async function Edit({ params }: { params: Params }) {
  const { id } = await params;
  return <EditLoader id={id} seed={photos} />;
}

export default function EditPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-5">読み込み中…</p>}>
      <Edit params={params} />
    </Suspense>
  );
}
