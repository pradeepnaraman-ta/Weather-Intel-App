import { Sparkles, Shirt, Compass, AlertTriangle, CloudRain, Info } from "lucide-react";
import { AIRecommendations } from "../types";

interface AIRecommendationsProps {
  recommendations: AIRecommendations | null;
  isLoading: boolean;
  isDemo: boolean;
  hasError?: boolean;
}

export default function AIRecommendationsComponent({
  recommendations,
  isLoading,
  isDemo,
  hasError,
}: AIRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="relative flex items-center justify-center w-14 h-14 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl mb-4 animate-bounce">
          <Sparkles className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100">Generating Weather Insights</h3>
        <p className="text-zinc-500 text-sm max-w-xs mt-1.5 leading-relaxed">
          Translating meteorological measurements into personal styling and planning recommendations...
        </p>
      </div>
    );
  }

  if (hasError || !recommendations) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-rose-300">Failed to Generate Recommendations</h3>
        <p className="text-rose-400 text-sm mt-1 max-w-sm">
          The weather intelligence model experienced an issue. Check your connection or retry shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-600 rounded-3xl border border-indigo-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
      {/* Decorative Brand Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 text-white rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">AI Weather Intelligence</h2>
        </div>

        {isDemo && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-indigo-100 text-[10px] font-bold rounded-full border border-white/10 uppercase tracking-wider">
            <Info className="w-3 h-3" /> Rule-Based Fallback
          </span>
        )}
      </div>

      {/* Summary Brief */}
      <div className="mb-6">
        <p className="text-white text-base md:text-lg font-semibold leading-relaxed">
          "{recommendations.summary}"
        </p>
      </div>

      {/* Warnings & Notices Alert Banner if present */}
      {recommendations.warnings && recommendations.warnings.length > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-100 rounded-2xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-300">Safety Alerts & Cautions</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-amber-200">
              {recommendations.warnings.map((warn, index) => (
                <li key={index}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Core Split columns: Clothing & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-500/20">
        {/* Clothing Suggestions */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/10 text-white rounded-lg">
              <Shirt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Recommended Outfit</h3>
          </div>

          <div className="bg-white/10 rounded-2xl border border-white/10 p-4 flex-1">
            <ul className="space-y-2.5">
              {recommendations.clothing.map((cloth, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm text-indigo-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                  <span>{cloth}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggested Activities */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/10 text-white rounded-lg">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Suggested Daily Activities</h3>
          </div>

          <div className="bg-white/10 rounded-2xl border border-white/10 p-4 flex-1 space-y-4">
            {recommendations.activities.map((act, index) => (
              <div key={index} className="flex gap-3 items-start group">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                  act.type === "outdoor" ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/25" : "bg-blue-500/20 text-blue-200 border border-blue-500/25"
                }`}>
                  {act.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-indigo-100 transition-colors">
                    {act.name}
                  </p>
                  <p className="text-xs text-indigo-100/80 mt-0.5 leading-relaxed">
                    {act.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planning Outlook Footer */}
      {recommendations.weeklyOutlook && (
        <div className="mt-6 pt-4 border-t border-indigo-500/20 text-xs text-indigo-100 flex gap-2 items-start bg-white/5 p-3 rounded-2xl border border-white/5">
          <Info className="w-4 h-4 text-indigo-200 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-white">7-Day Outlook Tip:</span> {recommendations.weeklyOutlook}
          </p>
        </div>
      )}
    </div>
  );
}
