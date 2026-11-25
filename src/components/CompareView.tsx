import { useEffect, useState } from 'react';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchLocationEnvironmentalData, searchCities } from '../services/openMeteo';
import type { EnvironmentalData, LocationInfo } from '../types/airQuality';
import { getAqiCategory } from '../utils/aqi';
import { findDominantPollutant } from '../engine/recommendationEngine';

interface CompareViewProps {
  primaryLocation: LocationInfo;
  favorites: LocationInfo[];
}

export function CompareView({ primaryLocation, favorites }: CompareViewProps) {
  const [cities, setCities] = useState<LocationInfo[]>(() => {
    const initial = [primaryLocation];
    for (const fav of favorites) {
      if (initial.length >= 3) break;
      if (!initial.some((c) => c.id === fav.id)) {
        initial.push(fav);
      }
    }
    return initial;
  });

  const [datasets, setDatasets] = useState<Record<string, EnvironmentalData>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    for (const city of cities) {
      if (datasets[city.id] || loadingIds[city.id]) continue;
      setLoadingIds((prev) => ({ ...prev, [city.id]: true }));
      fetchLocationEnvironmentalData(city)
        .then((res) => {
          setDatasets((prev) => ({ ...prev, [city.id]: res }));
        })
        .catch(() => {
          // Handled per card
        })
        .finally(() => {
          setLoadingIds((prev) => ({ ...prev, [city.id]: false }));
        });
    }
  }, [cities, datasets, loadingIds]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchCities(trimmed);
        setSearchResults(res.slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const addCity = (loc: LocationInfo) => {
    if (cities.length >= 4 || cities.some((c) => c.id === loc.id)) return;
    setCities((prev) => [...prev, loc]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeCity = (id: string) => {
    if (cities.length <= 1) return;
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  const chartData = cities
    .map((c) => {
      const d = datasets[c.id];
      if (!d) return null;
      return {
        name: c.name,
        usAqi: d.currentAir.us_aqi ?? 0,
        pm25: d.currentAir.pm2_5 ?? 0,
      };
    })
    .filter((x): x is { name: string; usAqi: number; pm25: number } => x !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Compare Air Quality Between Cities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Side-by-side live comparison of up to 4 cities using Open-Meteo Air Quality &amp; Weather APIs.
          </p>
        </div>

        {/* Add City Search */}
        {cities.length < 4 && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add city to compare..."
              aria-label="Add city to compare"
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searching && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => addCity(res)}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between border-b last:border-b-0 border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <span>
                      <strong className="text-slate-900 dark:text-white">{res.name}</strong>{' '}
                      <span className="text-xs text-slate-500">{res.country}</span>
                    </span>
                    <Plus className="w-4 h-4 text-emerald-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cities.map((city) => {
          const d = datasets[city.id];
          const isLoading = loadingIds[city.id];
          const cat = d ? getAqiCategory(d.currentAir.us_aqi, 'us') : null;
          const dom = d ? findDominantPollutant(d.currentAir) : null;

          return (
            <div
              key={city.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-base">
                      {city.name}
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{city.country}</span>
                  </div>
                  {cities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCity(city.id)}
                      aria-label={`Remove ${city.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isLoading && !d ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                ) : !d ? (
                  <p className="text-xs text-red-500 py-4">Failed to load data.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                          {d.currentAir.us_aqi ?? '—'}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">US AQI</span>
                      </div>
                      {cat && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.badgeClass}`}>
                          {cat.category}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">PM2.5</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {d.currentAir.pm2_5 !== null ? `${d.currentAir.pm2_5.toFixed(1)} µg/m³` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PM10</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {d.currentAir.pm10 !== null ? `${d.currentAir.pm10.toFixed(1)} µg/m³` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Primary Concern</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {dom ? dom.name : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weather</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {d.weather.temperature !== null ? `${d.weather.temperature.toFixed(1)}°C` : 'N/A'}
                          {d.weather.windSpeed !== null ? ` · ${d.weather.windSpeed.toFixed(0)} km/h` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            US AQI &amp; PM2.5 Comparison
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="usAqi" name="US AQI" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pm25" name="PM2.5 (µg/m³)" fill="#EA580C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

