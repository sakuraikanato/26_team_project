export type WeatherIcon =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherMeta {
  code: number;
  label: string;
  icon: WeatherIcon;
}

const WMO_WEATHER_MAP: Record<number, { label: string; icon: WeatherIcon }> = {
  0: { label: "快晴", icon: "sunny" },
  1: { label: "晴れ", icon: "partly-cloudy" },
  2: { label: "一部曇り", icon: "partly-cloudy" },
  3: { label: "曇り", icon: "cloudy" },
  45: { label: "霧", icon: "fog" },
  48: { label: "着氷性の霧", icon: "fog" },
  51: { label: "弱い霧雨", icon: "rain" },
  53: { label: "霧雨", icon: "rain" },
  55: { label: "強い霧雨", icon: "rain" },
  56: { label: "弱い着氷性の霧雨", icon: "rain" },
  57: { label: "強い着氷性の霧雨", icon: "rain" },
  61: { label: "弱い雨", icon: "rain" },
  63: { label: "雨", icon: "rain" },
  65: { label: "強い雨", icon: "rain" },
  66: { label: "弱い着氷性の雨", icon: "rain" },
  67: { label: "強い着氷性の雨", icon: "rain" },
  71: { label: "弱い雪", icon: "snow" },
  73: { label: "雪", icon: "snow" },
  75: { label: "大雪", icon: "snow" },
  77: { label: "霧雪", icon: "snow" },
  80: { label: "弱いにわか雨", icon: "rain" },
  81: { label: "にわか雨", icon: "rain" },
  82: { label: "激しいにわか雨", icon: "rain" },
  85: { label: "弱いにわか雪", icon: "snow" },
  86: { label: "強いにわか雪", icon: "snow" },
  95: { label: "雷雨", icon: "thunder" },
  96: { label: "ひょうを伴う雷雨", icon: "thunder" },
  99: { label: "強いひょうを伴う雷雨", icon: "thunder" },
};

const WEATHER_KEY_MAP: Record<string, WeatherMeta> = {
  sunny: { code: 0, label: "快晴", icon: "sunny" },
  "partly-cloudy": { code: 1, label: "晴れ", icon: "partly-cloudy" },
  cloudy: { code: 3, label: "曇り", icon: "cloudy" },
  fog: { code: 45, label: "霧", icon: "fog" },
  rain: { code: 63, label: "雨", icon: "rain" },
  rainy: { code: 63, label: "雨", icon: "rain" },
  snow: { code: 73, label: "雪", icon: "snow" },
  snowy: { code: 73, label: "雪", icon: "snow" },
  thunder: { code: 95, label: "雷雨", icon: "thunder" },
};

export function getWeatherFromCode(code: number): WeatherMeta {
  const entry = WMO_WEATHER_MAP[code];
  if (entry) {
    return { code, label: entry.label, icon: entry.icon };
  }
  return { code, label: "不明", icon: "cloudy" };
}

export function getWeatherFromKey(key: string): WeatherMeta | null {
  return WEATHER_KEY_MAP[key] ?? null;
}

export function resolvePostWeather(params: {
  weather: string | null;
  weatherCode: number | null;
  temperature: number | null;
}) {
  if (params.weatherCode !== null && params.weatherCode !== undefined) {
    const meta = getWeatherFromCode(params.weatherCode);
    return {
      ...meta,
      temperature: params.temperature,
    };
  }
  if (params.weather) {
    const meta = getWeatherFromKey(params.weather);
    if (meta) {
      return {
        ...meta,
        temperature: params.temperature,
      };
    }
  }
  return null;
}

