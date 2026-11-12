import type { MoodFilter, Weather } from "@/lib/album";

// 画面全体の背景。アルバムのタブ、今日の天気、写真やフォームのキリッ／まったりで切り替える。
// 使う側は中身に relative を付けて、背景より手前に表示する。

// 晴れ → キリッ、それ以外（雨・曇り・雪）→ まったり
export function moodForWeather(weather: Weather): MoodFilter {
  return weather === "sunny" ? "kiri" : "mattari";
}

// キリッ／まったり／両方ごとの背景グラデーション（Figma の top-bg_sunny／top-bg）
const BG_GRADIENT: Record<MoodFilter, string> = {
  kiri: "linear-gradient(to bottom, #fff5ef 16.827%, #f8e0d1 58.413%, #f2c1a3)",
  mattari: "linear-gradient(to bottom, #eaf0f5 16.827%, #abc5e7 62.981%, #6793d6)",
  both: "linear-gradient(to bottom, #f0fcf2, #b5debc 57%, #8dc998)",
};

// 背景の模様。キリッは太陽、まったりは雨つぶを互い違いに並べる
export default function MoodBackground({ mood }: { mood: MoodFilter }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ background: BG_GRADIENT[mood] }}
    >
      {mood === "kiri" && (
        <div className="absolute left-1/2 top-1/2 flex w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          {Array.from({ length: 7 }, (_, row) => (
            <div
              key={row}
              className={`flex opacity-30 mix-blend-overlay ${
                row % 2 === 0 ? "justify-center" : "w-full"
              }`}
            >
              {Array.from({ length: row % 2 === 0 ? 5 : 4 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src="/bg/sunny-tile.svg"
                  alt=""
                  width={120}
                  height={120}
                  className="shrink-0"
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {mood === "mattari" && (
        <div className="absolute left-1/2 top-1/2 flex w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col">
          {["a", "a", "a", "a", "b", "c", "d"].map((tile, row) => (
            <div key={row} className="flex w-[600px] items-center">
              {/* 奇数行は半分ずらす（Figmaの60pxの余白） */}
              {row % 2 === 1 && <div className="h-[120px] w-[60px] shrink-0" />}
              {Array.from({ length: row % 2 === 0 ? 5 : 4 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/bg/rain-tile-${tile}.svg`}
                  alt=""
                  width={120}
                  height={120}
                  className="shrink-0"
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
