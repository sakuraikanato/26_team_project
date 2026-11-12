import CalendarClient from "@/components/calendar/CalendarClient";
import MoodBackground, { moodForWeather } from "@/components/MoodBackground";
import { getCurrentWeather } from "@/lib/album";
import { getCalendarInitialData } from "@/lib/calendar";

export default async function CalendarPage() {
  const { events, forecasts } =
    await getCalendarInitialData("2026-10");
  // 今日の天気で背景を変える（晴れ → キリッ、それ以外 → まったり）
  const weather = await getCurrentWeather();

  return (
    <main className="min-h-screen w-full">
      <MoodBackground mood={moodForWeather(weather)} />
      <CalendarClient
        initialEvents={events}
        initialForecasts={forecasts}
      />
    </main>
  );
}