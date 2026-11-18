import { connection } from "next/server";
import { Suspense } from "react";
import CalendarClient from "@/components/calendar/CalendarClient";
import MoodBackground, { moodForWeather } from "@/components/MoodBackground";
import { getCurrentWeather } from "@/lib/album";
import { getCalendarInitialData } from "@/lib/calendar";

// 今月のイベント・天気予報と、今日の天気を取ってからカレンダーを出す
async function Calendar() {
  // 「今月」はアクセスした日で決まるので、アクセスのたびに作る
  await connection();
  // 今日の日付（日本時間、YYYY-MM-DD）と今月（YYYY-MM）
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const yearMonth = today.slice(0, 7);
  const { events, forecasts } =
    await getCalendarInitialData(yearMonth);
  // 今日の天気で背景を変える（晴れ → キリッ、それ以外 → まったり）
  const weather = await getCurrentWeather();

  return (
    <>
      <MoodBackground mood={moodForWeather(weather)} />
      <CalendarClient
        initialEvents={events}
        initialForecasts={forecasts}
        initialYearMonth={yearMonth}
        initialDate={today}
      />
    </>
  );
}

export default function CalendarPage() {
  return (
    <main className="min-h-screen w-full">
      <Suspense fallback={<p className="p-5">読み込み中…</p>}>
        <Calendar />
      </Suspense>
    </main>
  );
}
