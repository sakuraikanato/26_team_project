import AlbumView from "@/components/album/AlbumView";
import {
    defaultMoodFor,
    getCurrentWeather,
    isKeeper,
    photos,
} from "@/lib/album";

export default async function AlbumPage() {
    const weather = await getCurrentWeather();
    const keeper = await isKeeper();

return (
    <AlbumView
        photos={photos}
        defaultMood={defaultMoodFor(weather)}
        canPost={keeper}
    />
);
}