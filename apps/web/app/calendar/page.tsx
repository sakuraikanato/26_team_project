import CalendarClient from "@/components/calendar/CalendarClient";
import MoodBackground, { moodForWeather } from "@/components/MoodBackground";
import { getCurrentWeather } from "@/lib/album";
import { getCalendarInitialData } from "@/lib/calendar";

export default async function CalendarPage() {
  const yearMonth = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date()).slice(0, 7);
  const { events, forecasts } =
    await getCalendarInitialData(yearMonth);
  // 今日の天気で背景を変える（晴れ → キリッ、それ以外 → まったり）
  const weather = await getCurrentWeather();

  return (
    <main className="min-h-screen w-full">
      <MoodBackground mood={moodForWeather(weather)} />
      <CalendarClient
        initialEvents={events}
        initialForecasts={forecasts}
        initialYearMonth={yearMonth}
      />
    </main>
  );
}