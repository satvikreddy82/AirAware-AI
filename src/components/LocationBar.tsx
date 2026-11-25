import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Loader2,
  X,
} from 'lucide-react';
import { searchCities } from '../services/openMeteo';
import type { LocationInfo } from '../types/airQuality';
import { formatTimeShort } from '../utils/aqi';

interface LocationBarProps {
  selectedLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  onDetectLocation: () => void;
  onRefresh: () => void;
  locating: boolean;
  loading: boolean;
  geoError: string | null;
  fetchedAt: string | null;
  favorites: LocationInfo[];
  isFavorite: boolean;
  onToggleFavorite: (loc: LocationInfo) => void;
}

export function LocationBar({
  selectedLocation,
  onSelectLocation,
  onDetectLocation,
  onRefresh,
  locating,
  loading,
  geoError,
  fetchedAt,
  favorites,
  isFavorite,
  onToggleFavorite,
}: LocationBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const cities = await searchCities(trimmed);
        setResults(cities);
        setDropdownOpen(true);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'City search failed.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const handlePickCity = (loc: LocationInfo) => {
    onSelectLocation(loc);
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Current Location Display */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {selectedLocation.name}
              </h1>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {selectedLocation.admin1 ? `${selectedLocation.admin1}, ` : ''}
                {selectedLocation.country}
              </span>
              <button
                type="button"
                onClick={() => onToggleFavorite(selectedLocation)}
                title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Star
                  className={`w-4 h-4 ${
                    isFavorite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span>
                {selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E
              </span>
              {fetchedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {formatTimeShort(fetchedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64 md:w-72" ref={wrapperRef}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setDropdownOpen(true);
              }}
              placeholder="Search any city..."
              aria-label="Search city"
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setDropdownOpen(false);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            )}

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchError ? (
                  <div className="p-3 text-xs text-red-600 dark:text-red-400">{searchError}</div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 dark:text-slate-400">
                    No matching cities found for &ldquo;{query}&rdquo;.
                  </div>
                ) : (
                  results.map((city) => (
                    <button
                      key={`${city.id}-${city.name}`}
                      type="button"
                      onClick={() => handlePickCity(city)}
                      className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-emerald-50/70 dark:hover:bg-slate-800 flex items-center justify-between border-b last:border-b-0 border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">{city.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                          {city.admin1 ? `${city.admin1}, ` : ''}
                          {city.country}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {city.latitude.toFixed(1)}, {city.longitude.toFixed(1)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDetectLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{locating ? 'Locating...' : 'My Location'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh air quality data"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
          {geoError}
        </div>
      )}

      {/* Favorite Quick Pills */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">Saved:</span>
          {favorites.map((fav) => {
            const active = fav.id === selectedLocation.id;
            return (
              <button
                key={fav.id}
                type="button"
                onClick={() => onSelectLocation(fav)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {fav.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

