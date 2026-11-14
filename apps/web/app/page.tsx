import Link from "next/link";
import KeeperReset from "@/components/KeeperReset";
import MoodBackground, { moodForWeather } from "@/components/MoodBackground";
import { getCurrentWeather } from "@/lib/album";

// タイトルの上下に並べる動物の写真（Figma のトップ画面と同じもの）
const TOP_PHOTOS = [
  { src: "/top/photo-1.jpg", alt: "レッサーパンダ" },
  { src: "/top/photo-2.jpg", alt: "ホッキョクグマ" },
  { src: "/top/photo-3.jpg", alt: "ジャガー" },
];
const BOTTOM_PHOTOS = [
  // 縦長の写真なので、Figma と同じく上の方を見せる
  { src: "/top/photo-4.jpg", alt: "カンムリヅル", position: "50% 20%" },
  { src: "/top/photo-5.jpg", alt: "フェネック" },
  { src: "/top/photo-6.jpg", alt: "ライオン" },
];

function PhotoRow({
  photos,
}: {
  photos: { src: string; alt: string; position?: string }[];
}) {
  return (
    <div className="flex w-full gap-2.5">
      {photos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.src}
          src={p.src}
          alt={p.alt}
          className="aspect-[4/3] min-w-0 flex-1 object-cover"
          style={p.position ? { objectPosition: p.position } : undefined}
        />
      ))}
    </div>
  );
}

export default async function Home() {
  // 今日の天気で背景を変える（晴れ → キリッ、それ以外 → まったり）
  const weather = await getCurrentWeather();

  return (
    <main className="min-h-screen">
      <MoodBackground mood={moodForWeather(weather)} />
      <KeeperReset />
      <div className="relative mx-auto flex min-h-screen w-full max-w-full flex-col gap-[39px] px-5 pb-5 pt-[170px]">
        {/* 写真とタイトル */}
        <div className="flex w-full flex-col items-center gap-4 bg-[#fafafa]">
          <PhotoRow photos={TOP_PHOTOS} />
          <div className="flex flex-col items-center gap-2.5">
            <h1>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wordmark.svg"
                alt="ファーマニマル"
                width={216.16}
                height={23.84}
              />
            </h1>
            <p className="text-xs font-bold tracking-[0.48px] text-[#59ae69]">
              晴れの日はキリッと、雨の日はまったり
            </p>
          </div>
          <PhotoRow photos={BOTTOM_PHOTOS} />
        </div>

        <div className="flex w-full flex-col gap-[34px]">
          {/* すぐにはじめる */}
          <Link
            href="/album"
            className="flex h-12 w-full items-center justify-center rounded-lg border border-[#784c31] bg-[#f6985f] text-base font-bold text-[#fafafa] shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]"
          >
            すぐにはじめる
          </Link>

          {/* 区切り線 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dashed-line.svg"
            alt=""
            width={350}
            height={2}
            className="w-full"
          />
        </div>

        {/* 飼育員ログイン */}
        <Link
          href="/login"
          className="text-center text-[13px] text-[#808080] underline"
        >
          飼育員はこちらからログイン
        </Link>
      </div>
    </main>
  );
}
