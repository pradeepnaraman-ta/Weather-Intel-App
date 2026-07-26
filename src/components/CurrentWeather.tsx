import { getWeatherCondition, formatTemp, getWindDirection } from "../utils/weatherUtils";
import { LocationDetails, CurrentWeather } from "../types";
import { Wind, Droplets, Heart, Thermometer, Cloud, Navigation } from "lucide-react";

interface CurrentWeatherProps {
  location: LocationDetails;
  current: CurrentWeather;
  unit: "C" | "F";
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function CurrentWeatherComponent({
  location,
  current,
  unit,
  isFavorite,
  onToggleFavorite,
}: CurrentWeatherProps) {
  const isDay = current.is_day;
  const condition = getWeatherCondition(current.weather_code, isDay);
  const WeatherIcon = condition.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 text-zinc-100 shadow-2xl transition-all duration-500">
      {/* Absolute Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative flex justify-between items-start z-10">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm">
            Current Weather
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-3 text-white">
            {location.name}
          </h1>
          <p className="text-zinc-400 text-sm font-medium mt-1">
            {location.region ? `${location.region}, ` : ""}{location.country}
          </p>
        </div>

        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className="p-3 bg-zinc-950/60 border border-zinc-800 hover:bg-zinc-800 rounded-2xl transition-all shadow-sm focus:outline-none"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          id="favorite-btn"
        >
          <Heart
            className={`w-6 h-6 transition-transform hover:scale-110 duration-200 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-zinc-400 hover:text-zinc-200"
            }`}
          />
        </button>
      </div>

      {/* Main Stats Display */}
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-8 md:mt-12 z-10">
        {/* Core Temperature & Icon */}
        <div className="md:col-span-6 flex items-center gap-6">
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl shadow-inner">
            <WeatherIcon className="w-16 h-16 md:w-20 md:h-20 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-6xl md:text-7xl font-extrabold tracking-tighter text-white">
                {formatTemp(current.temperature_2m, unit)}
              </span>
            </div>
            <p className="text-lg md:text-xl font-semibold mt-1 text-indigo-400">
              {condition.label}
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          {/* Feels Like */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl">
              <Thermometer className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium">Feels Like</p>
              <p className="text-zinc-200 font-bold text-base mt-0.5">
                {formatTemp(current.apparent_temperature, unit)}
              </p>
            </div>
          </div>

          {/* Wind */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl">
              <Wind className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium">Wind</p>
              <p className="text-zinc-200 font-bold text-sm mt-0.5 flex items-center gap-1">
                <span>{Math.round(current.wind_speed_10m)} km/h</span>
                <Navigation
                  className="w-3.5 h-3.5 rotate-180 inline-block text-zinc-400"
                  style={{ transform: `rotate(${current.wind_direction_10m}deg)` }}
                />
                <span className="text-[10px] text-zinc-500">{getWindDirection(current.wind_direction_10m)}</span>
              </p>
            </div>
          </div>

          {/* Humidity */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl">
              <Droplets className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium">Humidity</p>
              <p className="text-zinc-200 font-bold text-base mt-0.5">
                {current.relative_humidity_2m}%
              </p>
            </div>
          </div>

          {/* Cloud Cover */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl">
              <Cloud className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium">Cloud Cover</p>
              <p className="text-zinc-200 font-bold text-base mt-0.5">
                {current.cloud_cover}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
