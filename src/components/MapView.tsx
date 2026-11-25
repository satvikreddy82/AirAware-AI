import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Info, Loader2, MapPin, Navigation } from 'lucide-react';
import { fetchLocationEnvironmentalData, reverseGeocode } from '../services/openMeteo';
import type { EnvironmentalData, LocationInfo } from '../types/airQuality';
import { getAqiCategory } from '../utils/aqi';

interface MapViewProps {
  data: EnvironmentalData;
  favorites: LocationInfo[];
  onSelectLocation: (loc: LocationInfo) => void;
}

export function MapView({ data, favorites, onSelectLocation }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [inspectedData, setInspectedData] = useState<EnvironmentalData | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [data.location.latitude, data.location.longitude],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setInspecting(true);
      setInspectError(null);
      try {
        const loc = await reverseGeocode(lat, lng);
        loc.isCurrentLocation = false;
        const env = await fetchLocationEnvironmentalData(loc);
        setInspectedData(env);
      } catch (err) {
        setInspectError(err instanceof Error ? err.message : 'Unable to fetch data for this point.');
      } finally {
        setInspecting(false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update center & markers when selected location or inspected data changes
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const currentCat = getAqiCategory(data.currentAir.us_aqi, 'us');

    // Selected location marker
    const mainMarker = L.circleMarker([data.location.latitude, data.location.longitude], {
      radius: 16,
      fillColor: currentCat.colorHex,
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.88,
    });

    mainMarker.bindPopup(
      `<div style="font-family:Inter,sans-serif;min-width:160px">
        <strong>${data.location.name}, ${data.location.country}</strong><br/>
        <span>US AQI: <strong>${data.currentAir.us_aqi ?? 'N/A'}</strong> (${currentCat.category})</span><br/>
        <span>PM2.5: ${data.currentAir.pm2_5 !== null ? `${data.currentAir.pm2_5.toFixed(1)} µg/m³` : 'N/A'}</span>
      </div>`
    );
    mainMarker.addTo(group);

    // Favorite city markers
    for (const fav of favorites) {
      if (fav.id === data.location.id) continue;
      const favMarker = L.circleMarker([fav.latitude, fav.longitude], {
        radius: 8,
        fillColor: '#0EA5E9',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });
      favMarker.bindPopup(
        `<div style="font-family:Inter,sans-serif">
          <strong>${fav.name}</strong><br/>
          <span style="font-size:12px;color:#64748b">Saved location</span>
        </div>`
      );
      favMarker.on('click', () => onSelectLocation(fav));
      favMarker.addTo(group);
    }

    // Inspected point marker
    if (inspectedData) {
      const inspCat = getAqiCategory(inspectedData.currentAir.us_aqi, 'us');
      const inspMarker = L.circleMarker(
        [inspectedData.location.latitude, inspectedData.location.longitude],
        {
          radius: 12,
          fillColor: inspCat.colorHex,
          color: '#0F172A',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }
      );
      inspMarker.addTo(group);
    }

    map.setView([data.location.latitude, data.location.longitude], map.getZoom(), {
      animate: true,
    });
  }, [data, favorites, inspectedData, onSelectLocation]);

  const activePanel = inspectedData ?? data;
  const activeCat = getAqiCategory(activePanel.currentAir.us_aqi, 'us');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Interactive Air Quality Map
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Click anywhere on the OpenStreetMap canvas to query live Open-Meteo air quality and weather data for those coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Canvas */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs relative">
          <div ref={mapContainerRef} className="w-full h-[440px] sm:h-[500px]" />

          {inspecting && (
            <div className="absolute top-3 right-3 z-20 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              Fetching coordinates...
            </div>
          )}
        </div>

        {/* Location Details Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {inspectedData ? 'Inspected Coordinates' : 'Active Location'}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  {activePanel.location.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activePanel.location.country} ({activePanel.location.latitude.toFixed(3)}°,{' '}
                  {activePanel.location.longitude.toFixed(3)}°)
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${activeCat.badgeClass}`}>
                {activeCat.category}
              </span>
            </div>

            {inspectError && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl">
                {inspectError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">US AQI</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {activePanel.currentAir.us_aqi ?? 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">European AQI</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {activePanel.currentAir.european_aqi ?? 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">PM2.5</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activePanel.currentAir.pm2_5 !== null
                    ? `${activePanel.currentAir.pm2_5.toFixed(1)} µg/m³`
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">PM10</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activePanel.currentAir.pm10 !== null
                    ? `${activePanel.currentAir.pm10.toFixed(1)} µg/m³`
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">NO₂</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activePanel.currentAir.nitrogen_dioxide !== null
                    ? `${activePanel.currentAir.nitrogen_dioxide.toFixed(1)} µg/m³`
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">O₃</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activePanel.currentAir.ozone !== null
                    ? `${activePanel.currentAir.ozone.toFixed(1)} µg/m³`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {inspectedData && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocation(inspectedData.location);
                    setInspectedData(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Set as Active City
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedData(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-2xl p-4 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0" /> Data Resolution &amp; Limitations
            </div>
            <p className="leading-relaxed opacity-90">
              AirAware AI displays assimilated atmospheric model data from Open-Meteo (CAMS/NOAA) rather than individual physical street-level sensor hardware. Hyperlocal micro-variations (e.g., directly beside an intersection) may differ from grid averages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

