import { useState, useEffect } from "react";
import { Sparkles, MapPin, Navigation, Info, RefreshCw, Sun, Moon, AlertTriangle } from "lucide-react";
import SearchBar from "./components/SearchBar";
import CurrentWeatherComponent from "./components/CurrentWeather";
import ForecastSection from "./components/ForecastSection";
import WeatherChart from "./components/WeatherChart";
import AIRecommendationsComponent from "./components/AIRecommendations";
import FavoriteCities from "./components/FavoriteCities";
import { WeatherPayload, AIRecommendations } from "./types";

export default function App() {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return localStorage.getItem("weather_active_city") || "San Francisco";
  });
  const [weatherData, setWeatherData] = useState<WeatherPayload | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [unit, setUnit] = useState<"C" | "F">(() => {
    return (localStorage.getItem("weather_temp_unit") as "C" | "F") || "C";
  });
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("weather_pinned_cities");
    return saved ? JSON.parse(saved) : ["New York", "London", "Tokyo"];
  });

  // Track if current location is active
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // Synchronize favorites with local storage
  useEffect(() => {
    localStorage.setItem("weather_pinned_cities", JSON.stringify(favorites));
  }, [favorites]);

  // Synchronize active temperature unit
  useEffect(() => {
    localStorage.setItem("weather_temp_unit", unit);
  }, [unit]);

  // Load weather when selectedCity or GPS trigger changes
  useEffect(() => {
    if (!isUsingGPS && selectedCity) {
      fetchWeatherDataByCity(selectedCity);
    }
  }, [selectedCity]);

  // Main geocoding + weather fetch orchestrator
  const fetchWeatherDataByCity = async (city: string) => {
    setIsLoadingWeather(true);
    setIsLoadingRecs(true);
    setError(null);
    setIsUsingGPS(false);

    try {
      const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!weatherRes.ok) {
        if (weatherRes.status === 404) {
          throw new Error("City not found. Please check the spelling or try a nearby city.");
        }
        throw new Error("Unable to retrieve weather data. Please try again.");
      }

      const weatherPayload: WeatherPayload = await weatherRes.json();
      setWeatherData(weatherPayload);
      localStorage.setItem("weather_active_city", weatherPayload.location.name);

      // Trigger Gemini recommendations with the fresh weather metrics
      await fetchAIInsights(weatherPayload);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load meteorological data.");
      setWeatherData(null);
      setRecommendations(null);
    } finally {
      setIsLoadingWeather(false);
      setIsLoadingRecs(false);
    }
  };

  // GPS coordinates fetch orchestrator
  const fetchWeatherDataByCoords = async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    setIsLoadingRecs(true);
    setError(null);
    setIsUsingGPS(true);

    try {
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!weatherRes.ok) {
        throw new Error("Failed to load meteorological data for your coordinates.");
      }

      const weatherPayload: WeatherPayload = await weatherRes.json();
      setWeatherData(weatherPayload);
      // We can set active city to current GPS name
      setSelectedCity(weatherPayload.location.name);
      localStorage.setItem("weather_active_city", weatherPayload.location.name);

      // Trigger Gemini recommendations
      await fetchAIInsights(weatherPayload);
    } catch (err: any) {
      console.error("Coords Fetch error:", err);
      setError(err.message || "Failed to locate weather at coordinates.");
      setWeatherData(null);
      setRecommendations(null);
    } finally {
      setIsLoadingWeather(false);
      setIsLoadingRecs(false);
    }
  };

  // Fetch AI clothing & activity tips from Gemini server route
  const fetchAIInsights = async (payload: WeatherPayload) => {
    setIsLoadingRecs(true);
    try {
      const recsRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: payload.location,
          current: payload.current,
          daily: payload.daily,
        }),
      });

      if (!recsRes.ok) {
        throw new Error("Failed to parse recommendation stream.");
      }

      const recsData = await recsRes.json();
      setRecommendations(recsData.recommendations);
      setIsDemo(recsData.isDemo);
    } catch (err) {
      console.error("AI Insights error:", err);
      // Fail silently to console, keeping fallback state handled gracefully
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // Toggle favorite city
  const handleToggleFavorite = () => {
    if (!weatherData) return;
    const cityName = weatherData.location.name;
    const isFav = favorites.some((fav) => fav.toLowerCase() === cityName.toLowerCase());

    if (isFav) {
      setFavorites(favorites.filter((fav) => fav.toLowerCase() !== cityName.toLowerCase()));
    } else {
      setFavorites([...favorites, cityName]);
    }
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
  };

  const handleRemoveFavorite = (city: string) => {
    setFavorites(favorites.filter((fav) => fav !== city));
  };

  // Browser Geolocation API interface
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingWeather(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherDataByCoords(latitude, longitude);
      },
      (geoErr) => {
        console.error("Geolocation permission issue:", geoErr);
        setError("Location access was denied. Please enter your city manually.");
        setIsLoadingWeather(false);
      },
      { timeout: 8000 }
    );
  };

  // Quick refresh
  const handleRefresh = () => {
    if (weatherData) {
      if (isUsingGPS) {
        fetchWeatherDataByCoords(weatherData.location.latitude, weatherData.location.longitude);
      } else {
        fetchWeatherDataByCity(weatherData.location.name);
      }
    } else {
      fetchWeatherDataByCity(selectedCity);
    }
  };

  const isCurrentFavorite = weatherData
    ? favorites.some((fav) => fav.toLowerCase() === weatherData.location.name.toLowerCase())
    : false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-100 transition-colors duration-300 pb-12">
      {/* Upper Brand / Top Utility Bar */}
      <header className="border-b border-zinc-800 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" id="app-logo-spark" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-100">
                Weather Intelligence
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                v1.2 AI Powered
              </span>
            </div>
          </div>

          {/* Unit Toggle & Locate Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLocateMe}
              className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold focus:outline-none"
              title="Detect my location coordinates"
              id="gps-locate-btn"
            >
              <Navigation className="w-4 h-4 fill-zinc-400 text-zinc-400" />
              <span className="hidden md:inline">Locate Me</span>
            </button>

            {/* Global C/F toggle */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setUnit("C")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none ${
                  unit === "C" ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit("F")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none ${
                  unit === "F" ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                °F
              </button>
            </div>

            {weatherData && (
              <button
                onClick={handleRefresh}
                disabled={isLoadingWeather}
                className="p-2.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 active:rotate-180 transition-all rounded-xl focus:outline-none"
                title="Refresh current weather data"
                id="refresh-weather-btn"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search Panel */}
        <div className="mb-6">
          <SearchBar onSelectCity={handleSelectCity} isLoading={isLoadingWeather} />
        </div>

        {/* Favorite Cities Bar */}
        <div className="mb-8">
          <FavoriteCities
            favorites={favorites}
            activeCity={weatherData?.location.name || selectedCity}
            onSelectCity={handleSelectCity}
            onRemoveFavorite={handleRemoveFavorite}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 flex gap-3 items-start max-w-xl mx-auto mb-8 shadow-md">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-300 text-sm">Search Issue</h4>
              <p className="text-rose-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading placeholders for initial layout */}
        {isLoadingWeather && !weatherData && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="relative flex items-center justify-center w-20 h-20 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-3xl shadow-lg mb-6 animate-pulse">
              <Sun className="w-10 h-10 animate-spin text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Retrieving Forecasts</h2>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm leading-relaxed">
              Contacting geocoding arrays and mapping meteorological data maps for {selectedCity}...
            </p>
          </div>
        )}

        {/* Main Dashboard Layout */}
        {weatherData && (
          <div className="space-y-6 animate-fade-in">
            {/* Row 1: Split Side-by-Side (Current Weather vs AI Insights) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-stretch">
                <CurrentWeatherComponent
                  location={weatherData.location}
                  current={weatherData.current}
                  unit={unit}
                  isFavorite={isCurrentFavorite}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col justify-stretch">
                <AIRecommendationsComponent
                  recommendations={recommendations}
                  isLoading={isLoadingRecs}
                  isDemo={isDemo}
                />
              </div>
            </div>

            {/* Row 2: 24-Hour Trend Interactive SVG Chart */}
            <div>
              <WeatherChart hourly={weatherData.hourly} unit={unit} />
            </div>

            {/* Row 3: 7-Day Forecast */}
            <div>
              <ForecastSection daily={weatherData.daily} unit={unit} />
            </div>
          </div>
        )}

        {/* Brand Footer */}
        <footer className="mt-16 text-center text-zinc-600 text-xs max-w-sm mx-auto select-none">
          <p>© 2026 Weather Intelligence. Powered by Open-Meteo & Google Gemini.</p>
          <p className="mt-1">All data is processed server-side with strict key protection.</p>
        </footer>
      </main>
    </div>
  );
}
