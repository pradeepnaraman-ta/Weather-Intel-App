import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, Umbrella, Sun } from "lucide-react";
import { HourlyForecast } from "../types";
import { formatTemp } from "../utils/weatherUtils";

interface WeatherChartProps {
  hourly: HourlyForecast;
  unit: "C" | "F";
}

export default function WeatherChart({ hourly, unit }: WeatherChartProps) {
  const [activeTab, setActiveTab] = useState<"temp" | "rain">("temp");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  // Take the first 24 hours for the trend chart
  const hoursCount = 24;
  const rawTimes = hourly.time.slice(0, hoursCount);
  const rawTemps = hourly.temperature_2m.slice(0, hoursCount);
  const rawRains = hourly.precipitation_probability.slice(0, hoursCount);

  // Measure responsiveness dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartWidth(Math.max(300, entry.contentRect.width));
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  // Format hour labels (e.g. "08:00" -> "8 AM")
  const formatHour = (isoStr: string) => {
    const date = new Date(isoStr);
    const hour = date.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  // Determine active dataset
  const values = activeTab === "temp" ? rawTemps : rawRains;
  const isRain = activeTab === "rain";

  // Calculate bounds
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  // Pad the vertical range for visual breathing room
  const yMin = isRain ? 0 : minVal - valRange * 0.15;
  const yMax = isRain ? 100 : maxVal + valRange * 0.15;
  const yRange = yMax - yMin;

  // Generate coordinate points
  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (hoursCount - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((val - yMin) / yRange) * (chartHeight - paddingY * 2);
    return { x, y, value: val, time: rawTimes[idx] };
  });

  // SVG Path generator
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : "";

  // Handle Mouse Hover tracking to find nearest point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Find the closest point index based on mouse X position
    let closestIndex = 0;
    let minDiff = Infinity;

    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    // Only set hover state if mouse is reasonably close to chart boundaries
    if (mouseX >= paddingX - 10 && mouseX <= chartWidth - paddingX + 10) {
      setHoverIndex(closestIndex);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Render horizontal grid lines (3 steps)
  const gridLinesY = [0.25, 0.5, 0.75].map((ratio) => {
    const val = yMin + ratio * yRange;
    const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
    return { y, label: isRain ? `${Math.round(val)}%` : formatTemp(val, unit) };
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl transition-all duration-300" ref={containerRef}>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">24-Hour Trend</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl self-start sm:self-auto border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("temp");
              setHoverIndex(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none ${
              activeTab === "temp"
                ? "bg-zinc-800 text-zinc-100 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Temperature</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("rain");
              setHoverIndex(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none ${
              activeTab === "rain"
                ? "bg-zinc-800 text-zinc-100 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Umbrella className="w-4 h-4" />
            <span>Rain Probability</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative select-none" id="trend-chart-canvas">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Definitions for gorgeous area gradients */}
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLinesY.map((line, idx) => (
            <g key={idx} className="opacity-60">
              <line
                x1={paddingX}
                y1={line.y}
                x2={chartWidth - paddingX}
                y2={line.y}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] font-semibold fill-zinc-500"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Area beneath the line */}
          {points.length > 0 && (
            <path
              d={areaPath}
              fill={isRain ? "url(#rainGradient)" : "url(#tempGradient)"}
              className="transition-all duration-300"
            />
          )}

          {/* Trend line */}
          {points.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke={isRain ? "#3b82f6" : "#6366f1"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* X-axis labels (render every 3 hours to avoid crowd) */}
          {points.map((p, idx) => {
            if (idx % 3 !== 0) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[10px] font-bold fill-zinc-500"
              >
                {formatHour(p.time)}
              </text>
            );
          })}

          {/* Vertical tracking line on hover */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              <line
                x1={points[hoverIndex].x}
                y1={paddingY}
                x2={points[hoverIndex].x}
                y2={chartHeight - paddingY}
                stroke="#3f3f46"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="6"
                fill={isRain ? "#3b82f6" : "#6366f1"}
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </g>
          )}
        </svg>

        {/* Floating Custom Tooltip */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute bg-zinc-950 text-zinc-100 rounded-xl p-3 shadow-2xl border border-zinc-800 text-xs pointer-events-none transition-all duration-100 z-10"
            style={{
              left: `${Math.min(
                chartWidth - 140,
                Math.max(10, points[hoverIndex].x - 65)
              )}px`,
              top: `${Math.max(0, points[hoverIndex].y - 75)}px`,
            }}
          >
            <p className="font-bold text-zinc-400">
              {new Date(points[hoverIndex].time).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
            <p className="text-sm font-extrabold mt-1 text-white flex items-center gap-1.5">
              {isRain ? (
                <>
                  <Umbrella className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rain: {points[hoverIndex].value}%</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Temp: {formatTemp(points[hoverIndex].value, unit)}</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
