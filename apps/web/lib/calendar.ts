import type {
  CalendarEvent,
  WeatherForecast,
} from "./types";
import { getEvents, getWeatherForecast } from "./api-client";

export async function getCalendarInitialData(
  yearMonth: string,
) {
  const [{ events }, { forecasts }] = await Promise.all([
    getEvents(yearMonth),
    getWeatherForecast(14),
  ]);
  return {
    events: events as CalendarEvent[],
    forecasts: forecasts as WeatherForecast[],
  };
}