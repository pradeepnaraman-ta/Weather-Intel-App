import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  LucideIcon
} from "lucide-react";

export interface WeatherCondition {
  label: string;
  icon: LucideIcon;
  gradientClass: string; // Background gradient for cards/panels
  textTheme: string; // Complementary text theme
}

export function getWeatherCondition(code: number, isDay: number = 1): WeatherCondition {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  switch (code) {
    case 0: // Clear sky
      return {
        label: "Clear Sky",
        icon: Sun,
        gradientClass: isDay ? "from-amber-400 via-orange-400 to-amber-500" : "from-slate-900 to-slate-850",
        textTheme: isDay ? "text-amber-950" : "text-amber-100"
      };

    case 1: // Mainly clear
    case 2: // Partly cloudy
      return {
        label: code === 1 ? "Mainly Clear" : "Partly Cloudy",
        icon: CloudSun,
        gradientClass: isDay ? "from-sky-400 via-sky-400 to-blue-500" : "from-slate-900 to-indigo-950",
        textTheme: isDay ? "text-sky-950" : "text-sky-100"
      };

    case 3: // Overcast
      return {
        label: "Overcast",
        icon: Cloud,
        gradientClass: "from-slate-300 via-slate-400 to-slate-500",
        textTheme: "text-slate-900"
      };

    case 45: // Fog
    case 48: // Depositing rime fog
      return {
        label: "Foggy",
        icon: Cloud,
        gradientClass: "from-slate-400 to-zinc-500",
        textTheme: "text-zinc-950"
      };

    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
      return {
        label: "Drizzle",
        icon: CloudDrizzle,
        gradientClass: "from-blue-200 via-slate-300 to-blue-400",
        textTheme: "text-blue-950"
      };

    case 56: // Freezing drizzle
    case 57:
      return {
        label: "Freezing Drizzle",
        icon: CloudSnow,
        gradientClass: "from-cyan-100 via-blue-200 to-cyan-300",
        textTheme: "text-blue-950"
      };

    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
      return {
        label: code === 61 ? "Light Rain" : code === 63 ? "Moderate Rain" : "Heavy Rain",
        icon: CloudRain,
        gradientClass: "from-blue-400 via-indigo-400 to-blue-600",
        textTheme: "text-white"
      };

    case 66: // Freezing rain
    case 67:
      return {
        label: "Freezing Rain",
        icon: CloudSnow,
        gradientClass: "from-sky-300 via-blue-400 to-teal-400",
        textTheme: "text-slate-950"
      };

    case 71: // Slight snow
    case 73: // Moderate snow
    case 75: // Heavy snow
    case 77: // Snow grains
      return {
        label: "Snowfall",
        icon: CloudSnow,
        gradientClass: "from-indigo-100 via-sky-100 to-blue-200",
        textTheme: "text-indigo-950"
      };

    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return {
        label: "Rain Showers",
        icon: CloudRain,
        gradientClass: "from-sky-500 via-blue-500 to-indigo-600",
        textTheme: "text-white"
      };

    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return {
        label: "Snow Showers",
        icon: CloudSnow,
        gradientClass: "from-cyan-200 via-sky-200 to-blue-300",
        textTheme: "text-sky-950"
      };

    case 95: // Thunderstorm
    case 96: // Thunderstorm with hail
    case 99:
      return {
        label: "Thunderstorm",
        icon: CloudLightning,
        gradientClass: "from-purple-900 via-slate-900 to-indigo-950",
        textTheme: "text-purple-100"
      };

    default:
      return {
        label: "Windy / Variable",
        icon: Wind,
        gradientClass: "from-zinc-100 via-slate-200 to-zinc-300",
        textTheme: "text-zinc-900"
      };
  }
}

export function formatTemp(temp: number, unit: "C" | "F"): string {
  if (unit === "F") {
    return `${Math.round((temp * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

export function getWindDirection(deg: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
  return directions[index];
}
