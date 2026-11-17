import { Hono } from "hono";
import { ApiError } from "../lib/errors.js";
import { getWeatherFromCode } from "../lib/weather.js";

const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const weatherCache = new Map<
  string,
  { expiresAt: number; data: Record<string, unknown> }
>();

function getZooCoordinates() {
  const lat = Number(process.env.ZOO_LATITUDE ?? "35.7165");
  const lon = Number(process.env.ZOO_LONGITUDE ?? "139.7714");
  return {
    latitude: Number.isFinite(lat) ? lat : 35.7165,
    longitude: Number.isFinite(lon) ? lon : 139.7714,
  };
}

async function fetchOpenMeteo(
  params: URLSearchParams,
  cacheTtlMs: number,
): Promise<Record<string, unknown>> {
  const url = `${OPEN_METEO_ENDPOINT}?${params.toString()}`;
  const cacheKey = params.toString();
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(502, "WEATHER_UNAVAILABLE", "天気情報の取得に失敗しました");
  }

  if (!response.ok) {
    throw new ApiError(502, "WEATHER_UNAVAILABLE", "天気情報の取得に失敗しました");
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    weatherCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + cacheTtlMs,
    });
    return data;
  } catch {
    throw new ApiError(502, "WEATHER_UNAVAILABLE", "天気情報の解析に失敗しました");
  }
}

export const weatherRoutes = new Hono()
  .get("/current", async (c) => {
    const { latitude, longitude } = getZooCoordinates();
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m,weather_code",
      timezone: "Asia/Tokyo",
    });

    const data = await fetchOpenMeteo(params, 10 * 60 * 1000);
    const current = data.current as
      | {
          time?: string;
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
        }
      | undefined;

    if (
      !current ||
      typeof current.weather_code !== "number" ||
      typeof current.temperature_2m !== "number"
    ) {
      throw new ApiError(502, "WEATHER_UNAVAILABLE", "天気情報の形式が不正です");
    }

    const meta = getWeatherFromCode(current.weather_code);
    const updatedAt = current.time
      ? new Date(`${current.time}+09:00`).toISOString()
      : new Date().toISOString();

    return c.json(
      {
        weather: {
          ...meta,
          temperature: current.temperature_2m,
          humidity:
            typeof current.relative_humidity_2m === "number"
              ? current.relative_humidity_2m
              : null,
        },
        updatedAt,
      },
      200,
    );
  })
  .get("/forecast", async (c) => {
    const rawDays = c.req.query("days") ?? "7";
    if (!/^\d+$/.test(rawDays)) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "days", message: "daysは1〜14の整数で指定してください" },
      ]);
    }
    const days = Number(rawDays);
    if (days < 1 || days > 14) {
      throw new ApiError(400, "INVALID_PARAMS", "入力内容に誤りがあります", [
        { field: "days", message: "daysは1〜14の整数で指定してください" },
      ]);
    }

    const { latitude, longitude } = getZooCoordinates();
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      forecast_days: String(days),
      timezone: "Asia/Tokyo",
    });

    const data = await fetchOpenMeteo(params, 60 * 60 * 1000);
    const daily = data.daily as
      | {
          time?: string[];
          weather_code?: number[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          precipitation_probability_max?: Array<number | null>;
        }
      | undefined;

    if (
      !daily ||
      !Array.isArray(daily.time) ||
      !Array.isArray(daily.weather_code) ||
      !Array.isArray(daily.temperature_2m_max) ||
      !Array.isArray(daily.temperature_2m_min)
    ) {
      throw new ApiError(502, "WEATHER_UNAVAILABLE", "天気予報の形式が不正です");
    }

    const forecasts = daily.time.map((date, idx) => {
      const code = daily.weather_code?.[idx] ?? 3;
      const meta = getWeatherFromCode(code);
      return {
        date,
        code: meta.code,
        label: meta.label,
        icon: meta.icon,
        tempMax: daily.temperature_2m_max?.[idx] ?? null,
        tempMin: daily.temperature_2m_min?.[idx] ?? null,
        precipitationProbability: daily.precipitation_probability_max?.[idx] ?? 0,
      };
    });

    return c.json({ forecasts }, 200);
  });

