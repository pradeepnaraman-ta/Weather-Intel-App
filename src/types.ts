export interface LocationDetails {
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  uv_index: number[];
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface WeatherPayload {
  location: LocationDetails;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

export interface AIActivity {
  name: string;
  type: "outdoor" | "indoor";
  reason: string;
}

export interface AIRecommendations {
  summary: string;
  clothing: string[];
  activities: AIActivity[];
  warnings: string[];
  weeklyOutlook: string;
}
