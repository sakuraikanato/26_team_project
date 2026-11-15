import type {
  CalendarEvent,
  WeatherForecast,
} from "./types";

const testEvents: CalendarEvent[] = [
  {
    id: "evt_001",
    title: "ライオンのお食事タイム",
    location: "ライオンエリア",
    startDate: "2026-10-23T02:00:00Z",
    endDate: "2026-10-23T02:30:00Z",
  },
  {
    id: "evt_002",
    title: "ペンギンのお散歩",
    location: "ペンギン館前",
    startDate: "2026-10-23T04:30:00Z",
    endDate: "2026-10-23T05:00:00Z",
  },
];

const testForecasts: WeatherForecast[] = [
  {
    date: "2026-10-23",
    code: 0,
    label: "晴れ",
    icon: "sunny",
    tempMax: 22,
    tempMin: 14,
    precipitationProbability: 0,
  },
  {
    date: "2026-10-24",
    code: 63,
    label: "雨",
    icon: "rain",
    tempMax: 18,
    tempMin: 13,
    precipitationProbability: 80,
  },
  {
    date: "2026-10-25",
    code: 3,
    label: "くもり",
    icon: "cloudy",
    tempMax: 19,
    tempMin: 12,
    precipitationProbability: 30,
  },
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