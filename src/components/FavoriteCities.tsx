import { Heart, MapPin, X, Sparkles } from "lucide-react";

interface FavoriteCitiesProps {
  favorites: string[];
  activeCity: string;
  onSelectCity: (city: string) => void;
  onRemoveFavorite: (city: string) => void;
}

export default function FavoriteCities({
  favorites,
  activeCity,
  onSelectCity,
  onRemoveFavorite,
}: FavoriteCitiesProps) {
  if (favorites.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-zinc-600" /> No favorite cities pinned yet. Click the heart icon on any city to pin it!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Pinned Locations
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {favorites.map((city) => {
          const isActive = city.toLowerCase() === activeCity.toLowerCase();
          return (
            <div
              key={city}
              className={`inline-flex items-center rounded-xl overflow-hidden border transition-all ${
                isActive
                  ? "bg-zinc-100 border-zinc-100 text-slate-900 shadow-md"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80"
              }`}
            >
              <button
                onClick={() => onSelectCity(city)}
                className="px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 focus:outline-none"
              >
                <MapPin className={`w-3.5 h-3.5 ${isActive ? "text-rose-500" : "text-zinc-500"}`} />
                <span>{city}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(city);
                }}
                className={`px-2 py-2 border-l transition-all focus:outline-none flex items-center justify-center ${
                  isActive
                    ? "border-slate-900/10 hover:bg-slate-900/5 text-slate-800"
                    : "border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
                title="Remove location"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
