import { Suspense } from "react";
import AlbumView from "@/components/album/AlbumView";
import {
    defaultMoodFor,
    getCurrentWeather,
    getAlbumPhotos,
} from "@/lib/album";

// 天気と写真を取ってからアルバムを出す
async function Album() {
    const [weather, albumPhotos] = await Promise.all([
        getCurrentWeather(),
        getAlbumPhotos(),
    ]);

    return (
        <AlbumView
            photos={albumPhotos}
            defaultMood={defaultMoodFor(weather)}
            canPost={false}
        />
    );
}

export default function AlbumPage() {
    return (
        <Suspense fallback={<p className="p-5">読み込み中…</p>}>
            <Album />
        </Suspense>
    );
}
