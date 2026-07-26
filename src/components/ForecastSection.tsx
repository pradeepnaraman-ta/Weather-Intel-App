import { getWeatherCondition, formatTemp } from "../utils/weatherUtils";
import { DailyForecast } from "../types";
import { Calendar, Umbrella, Wind, Sun } from "lucide-react";

interface ForecastSectionProps {
  daily: DailyForecast;
  unit: "C" | "F";
}

export default function ForecastSection({ daily, unit }: ForecastSectionProps) {
  // Format dates into weekday abbreviations
  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return "Today";
    
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">7-Day Forecast</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {daily.time.map((dateStr, idx) => {
          const weatherCode = daily.weather_code[idx];
          const condition = getWeatherCondition(weatherCode, 1); // Assume daytime icon for summary list
          const IconComponent = condition.icon;
          
          const maxTemp = daily.temperature_2m_max[idx];
          const minTemp = daily.temperature_2m_min[idx];
          const rainProb = daily.precipitation_probability_max[idx];
          const windSpeed = daily.wind_speed_10m_max[idx];

          return (
            <div
              key={dateStr}
              className="bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 group hover:shadow-2xl cursor-default"
              id={`forecast-card-${idx}`}
            >
              <p className="text-sm font-bold text-zinc-100 tracking-tight">
                {getDayName(dateStr, idx)}
              </p>
              <p className="text-[10px] text-zinc-500 font-medium">
                {getFullDate(dateStr)}
              </p>

              {/* Icon Container with subtle zoom effect */}
              <div className="my-4 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <IconComponent className="w-8 h-8 text-indigo-400" />
              </div>

              <p className="text-xs font-semibold text-zinc-400 truncate max-w-full px-1" title={condition.label}>
                {condition.label}
              </p>

              {/* Temperature Range */}
              <div className="flex items-center gap-2 mt-3 mb-2">
                <span className="text-sm font-bold text-zinc-100">
                  {formatTemp(maxTemp, unit)}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {formatTemp(minTemp, unit)}
                </span>
              </div>

              {/* Rain Probability / Wind speed */}
              <div className="flex flex-col gap-1 w-full mt-auto pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
                {rainProb > 0 ? (
                  <span className="flex items-center justify-center gap-1 text-blue-400 font-semibold">
                    <Umbrella className="w-3 h-3" />
                    <span>{rainProb}%</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1 text-zinc-600">
                    <Sun className="w-3 h-3" />
                    <span>0%</span>
                  </span>
                )}
                <span className="flex items-center justify-center gap-1 text-zinc-500">
                  <Wind className="w-3 h-3 text-zinc-600" />
                  <span>{Math.round(windSpeed)} km/h</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
