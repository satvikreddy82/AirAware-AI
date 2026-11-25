import {
  AlertTriangle,
  ArrowRight,
  CloudSun,
  Droplets,
  Info,
  ShieldCheck,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Minus,
  Wind,
} from 'lucide-react';
import { useState } from 'react';
import type {
  AqiScale,
  EnvironmentalData,
  EvaluatedAlert,
  NavigationTab,
  RecommendationResult,
} from '../types/airQuality';
import { getAqiCategory, POLLUTANT_META, POLLUTANT_ORDER } from '../utils/aqi';

interface DashboardViewProps {
  data: EnvironmentalData;
  recommendation: RecommendationResult;
  alerts: EvaluatedAlert[];
  onNavigate: (tab: NavigationTab) => void;
}

export function DashboardView({ data, recommendation, alerts, onNavigate }: DashboardViewProps) {
  const [scale, setScale] = useState<AqiScale>('us');

  const aqiValue = scale === 'us' ? data.currentAir.us_aqi : data.currentAir.european_aqi;
  const cat = getAqiCategory(aqiValue, scale);

  const TrendIcon =
    data.trend.direction === 'improving'
      ? TrendingDown
      : data.trend.direction === 'deteriorating'
      ? TrendingUp
      : Minus;

  const trendBadgeColor =
    data.trend.direction === 'improving'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/60'
      : data.trend.direction === 'deteriorating'
      ? 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/50 dark:border-orange-800/60'
      : 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';

  const verdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'recommended':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'caution':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
      case 'limit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {alerts[0].title}
                {alerts.length > 1 ? ` (+${alerts.length - 1} more alert${alerts.length > 2 ? 's' : ''})` : ''}
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">{alerts[0].message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline shrink-0 cursor-pointer"
          >
            Manage alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Grid: Main AQI Card + Weather Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main AQI Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Air Quality Index
                </span>
                <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {scale === 'us' ? 'US AQI (EPA-based, 0–500)' : 'European AQI (EAQI, 0–100+)'}
                </h2>
              </div>

              {/* Explicit Scale Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setScale('us')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    scale === 'us'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  US AQI
                </button>
                <button
                  type="button"
                  onClick={() => setScale('eu')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    scale === 'eu'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  European AQI
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 my-2">
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0"
                  style={{
                    borderColor: cat.colorHex,
                    backgroundColor: `${cat.colorHex}15`,
                  }}
                >
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {aqiValue !== null ? Math.round(aqiValue) : '—'}
                  </span>
                  <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {scale === 'us' ? 'US AQI' : 'EAQI'}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cat.badgeClass}`}
                  >
                    {cat.category}
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 max-w-md leading-relaxed">
                    {cat.meaning}
                  </p>
                </div>
              </div>
            </div>

            {/* AQI Color Scale Bar */}
            <div className="mt-5">
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                <div className="flex-1 bg-emerald-500" title="Good" />
                <div className="flex-1 bg-amber-400" title="Moderate" />
                <div className="flex-1 bg-orange-500" title="Poor" />
                <div className="flex-1 bg-red-600" title="Very Poor" />
                <div className="flex-1 bg-purple-600" title="Severe" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                <span>Good</span>
                <span>Moderate</span>
                <span>Poor</span>
                <span>Very Poor</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          {/* Trend & Dominant Pollutant Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${trendBadgeColor}`}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {data.trend.summary}
            </span>

            {recommendation.dominantPollutant && (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Primary concern:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {recommendation.dominantPollutant.name}
                </strong>{' '}
                ({recommendation.dominantPollutant.value} {recommendation.dominantPollutant.unit})
              </span>
            )}
          </div>
        </div>

        {/* Weather Information Card (Clearly Separated) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Meteorology
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Current Weather
                </h2>
              </div>
              <CloudSun className="w-6 h-6 text-sky-500" />
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.weather.temperature !== null ? `${data.weather.temperature.toFixed(1)}°C` : '—'}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {data.weather.weatherLabel}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Thermometer className="w-4 h-4 text-sky-500" />
                  Feels like
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data.weather.apparentTemperature !== null
                    ? `${data.weather.apparentTemperature.toFixed(1)}°C`
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  Humidity
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data.weather.humidity !== null ? `${Math.round(data.weather.humidity)}%` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm py-2">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Wind className="w-4 h-4 text-sky-500" />
                  Wind speed
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data.weather.windSpeed !== null ? `${data.weather.windSpeed.toFixed(1)} km/h` : '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            Weather data (Open-Meteo Forecast) is displayed separately from pollutant concentrations.
          </p>
        </div>
      </div>

      {/* Quick Personalized Guidance Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Personalized Guidance Snapshot
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {recommendation.overallHeadline} (Effective AQI: {recommendation.effectiveAqi})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors self-start sm:self-auto cursor-pointer"
          >
            Open AI Assistant <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendation.activities.slice(0, 3).map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {act.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${verdictBadge(act.verdict)}`}>
                  {act.verdictLabel}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{act.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pollutant Monitoring Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pollutant Concentrations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time modeled concentrations compared against World Health Organization (WHO 2021) reference guidelines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('guide')}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" /> Pollutant Guide
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POLLUTANT_ORDER.map((key) => {
            const meta = POLLUTANT_META[key];
            const val = data.currentAir[key];
            const ratio = val !== null ? val / meta.whoGuideline : 0;
            const barPercent = Math.min(100, Math.round(ratio * 50)); // 2x guideline = 100% bar
            const barColor =
              ratio <= 0.75
                ? 'bg-emerald-500'
                : ratio <= 1.25
                ? 'bg-amber-400'
                : ratio <= 2.5
                ? 'bg-orange-500'
                : 'bg-red-600';

            return (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {meta.shortName}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {meta.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {val !== null ? val.toFixed(1) : 'N/A'}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        {meta.unit}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {meta.description}
                  </p>
                </div>

                <div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${val !== null ? Math.max(6, barPercent) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{meta.whoPeriod}</span>
                    {val !== null && (
                      <span className="font-semibold">
                        {ratio.toFixed(1)}× ref
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

