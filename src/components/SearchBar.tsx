import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, History, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSelectCity: (cityName: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSelectCity, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent_weather_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches(["New York", "London", "Tokyo"]);
      }
    } else {
      // Set defaults
      const defaults = ["New York", "London", "Tokyo"];
      setRecentSearches(defaults);
      localStorage.setItem("recent_weather_searches", JSON.stringify(defaults));
    }
  }, []);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch geocoding autocomplete matches from Open-Meteo Geocoding API directly or via server
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query
          )}&count=5&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      triggerSearch(query.trim());
    }
  };

  const triggerSearch = (city: string) => {
    onSelectCity(city);
    saveToRecent(city);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const saveToRecent = (city: string) => {
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
    const updated = [
      formattedCity,
      ...recentSearches.filter((item) => item.toLowerCase() !== city.toLowerCase())
    ].slice(0, 5); // Limit to top 5
    setRecentSearches(updated);
    localStorage.setItem("recent_weather_searches", JSON.stringify(updated));
  };

  const removeRecent = (e: React.MouseEvent, city: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== city);
    setRecentSearches(updated);
    localStorage.setItem("recent_weather_searches", JSON.stringify(updated));
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-6" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative z-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" id="search-icon" />
          <input
            type="text"
            id="city-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search for a city (e.g. Paris, San Francisco...)"
            className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-base placeholder-zinc-500 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" id="search-spinner" />}
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-500 hover:text-zinc-300 focus:outline-none"
                id="search-clear-btn"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (query.trim().length >= 2 || suggestions.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-30 divide-y divide-zinc-800">
            {isSearchingSuggestions && (
              <div className="p-4 text-center text-sm text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Searching locations...</span>
              </div>
            )}
            {!isSearchingSuggestions && suggestions.length === 0 && query.trim().length >= 2 && (
              <div className="p-4 text-center text-sm text-zinc-500">
                Press Enter to search "{query}"
              </div>
            )}
            {suggestions.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => triggerSearch(item.name)}
                className="w-full px-4 py-3 text-left hover:bg-zinc-800/80 flex items-center gap-3 transition-colors text-zinc-300 focus:outline-none"
              >
                <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-zinc-200">{item.name}</span>
                  {item.admin1 && (
                    <span className="text-zinc-500 text-sm ml-2">
                      {item.admin1}
                    </span>
                  )}
                  {item.country && (
                    <span className="text-zinc-500 text-xs ml-2 uppercase px-1.5 py-0.5 bg-zinc-950 rounded-md border border-zinc-800">
                      {item.country_code || item.country}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Recent Searches Section */}
      {recentSearches.length > 0 && (
        <div className="mt-3 flex items-center flex-wrap gap-2 text-xs text-zinc-500 px-1">
          <span className="flex items-center gap-1 font-medium text-zinc-400 select-none">
            <History className="w-3.5 h-3.5 text-zinc-500" /> Recent:
          </span>
          {recentSearches.map((city, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-100 transition-all cursor-pointer group"
              onClick={() => triggerSearch(city)}
            >
              <span>{city}</span>
              <button
                type="button"
                onClick={(e) => removeRecent(e, city)}
                className="text-zinc-500 hover:text-zinc-300 focus:outline-none ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
