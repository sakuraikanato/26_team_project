import AlbumView from "@/components/album/AlbumView";
import {
    defaultMoodFor,
    getCurrentWeather,
    getAlbumPhotos,
} from "@/lib/album";

export default async function AlbumPage() {
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