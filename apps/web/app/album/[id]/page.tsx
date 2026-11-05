import { Suspense } from "react";
import { notFound } from "next/navigation";
import PhotoDetail from "@/components/album/PhotoDetail";
import { isKeeper, photos } from "@/lib/album";

type Params = Promise<{ id: string }>;

async function Detail({ params }: { params: Params }) {
const { id } = await params;
const photo = photos.find((p) => p.id === id);
if (!photo) notFound();
const keeper = await isKeeper();
return <PhotoDetail photo={photo} canEdit={keeper} />;
}

export default function PhotoPage({ params }: { params: Params }) {
return (
    <Suspense fallback={<p className="p-5">読み込み中…</p>}>
    <Detail params={params} />
    </Suspense>
);
}