import CalendarClient from "@/components/calendar/CalendarClient";
import { getCalendarInitialData } from "@/lib/calendar";

export default async function CalendarPage() {
  const { events, forecasts } =
    await getCalendarInitialData("2026-10");

  return (
    <main className="min-h-screen w-full bg-white">
      <CalendarClient
        initialEvents={events}
        initialForecasts={forecasts}
      />
    </main>
  );
}