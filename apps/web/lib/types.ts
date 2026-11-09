export type WeatherIcon =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
}

export interface WeatherForecast {
  date: string;
  code: number;
  label: string;
  icon: WeatherIcon;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
}