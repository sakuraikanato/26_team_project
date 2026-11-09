import type {
  CalendarEvent,
  WeatherForecast,
} from "./types";

const testEvents: CalendarEvent[] = [
  {
    id: "evt_001",
    title: "ライオンのお食事タイム",
    startDate: "2026-10-23T02:00:00Z",
    endDate: "2026-10-23T02:30:00Z",
  },
];

const testForecasts: WeatherForecast[] = [
  {
    date: "2026-10-31",
    code: 61,
    label: "霧雨",
    icon: "rain",
    tempMax: 22,
    tempMin: 17,
    precipitationProbability: 60,
  },
];

export async function getCalendarInitialData(
  yearMonth: string
) {
  return {
    events: testEvents.filter((event) =>
      event.startDate.startsWith(yearMonth)
    ),
    forecasts: testForecasts.filter((weather) =>
      weather.date.startsWith(yearMonth)
    ),
  };
}