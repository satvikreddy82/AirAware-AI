import type {
  CurrentAirQuality,
  CurrentWeather,
  DailyForecastSummary,
  EnvironmentalData,
  HourlyAirQualityPoint,
  LocationInfo,
} from '../types/airQuality';
import { computeAqiTrend, mapWmoWeatherCode } from '../utils/aqi';

const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`API request failed (${response.status} ${response.statusText})`);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and retry.');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

interface GeocodingApiResult {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

export async function searchCities(query: string): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const data = await fetchJsonWithTimeout<GeocodingApiResult>(`${GEOCODING_BASE}?${params.toString()}`);
  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map((item) => ({
    id: `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
    name: item.name,
    country: item.country ?? 'Unknown',
    admin1: item.admin1,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationInfo> {
  const fallback: LocationInfo = {
    id: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    name: `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    country: 'Coordinates',
    latitude,
    longitude,
    isCurrentLocation: true,
  };

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: latitude.toString(),
      lon: longitude.toString(),
      zoom: '10',
    });
    const data = await fetchJsonWithTimeout<NominatimResponse>(
      `${NOMINATIM_REVERSE}?${params.toString()}`,
      7000
    );
    const addr = data.address;
    if (!addr) return fallback;

    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county;
    if (!city) return fallback;

    return {
      id: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      name: city,
      country: addr.country ?? 'Unknown',
      admin1: addr.state,
      latitude,
      longitude,
      isCurrentLocation: true,
    };
  } catch {
    return fallback;
  }
}

interface OpenMeteoAirQualityResponse {
  timezone?: string;
  current?: {
    time: string;
    us_aqi: number | null;
    european_aqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
    carbon_monoxide: number | null;
    nitrogen_dioxide: number | null;
    sulphur_dioxide: number | null;
    ozone: number | null;
  };
  hourly?: {
    time: string[];
    us_aqi: (number | null)[];
    european_aqi: (number | null)[];
    pm2_5: (number | null)[];
    pm10: (number | null)[];
    carbon_monoxide: (number | null)[];
    nitrogen_dioxide: (number | null)[];
    sulphur_dioxide: (number | null)[];
    ozone: (number | null)[];
  };
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m: number | null;
    apparent_temperature: number | null;
    relative_humidity_2m: number | null;
    wind_speed_10m: number | null;
    weather_code: number | null;
    is_day: number | null;
  };
}

function buildDailyForecast(hourly: HourlyAirQualityPoint[]): DailyForecastSummary[] {
  const byDate = new Map<string, HourlyAirQualityPoint[]>();
  const forecastOnly = hourly.filter((h) => h.isForecast);
  const source = forecastOnly.length > 0 ? forecastOnly : hourly;

  for (const pt of source) {
    const dateKey = pt.time.slice(0, 10);
    const list = byDate.get(dateKey) ?? [];
    list.push(pt);
    byDate.set(dateKey, list);
  }

  const summaries: DailyForecastSummary[] = [];
  for (const [date, pts] of byDate.entries()) {
    const aqis = pts.map((p) => p.us_aqi).filter((v): v is number => v !== null);
    const pm25s = pts.map((p) => p.pm2_5).filter((v): v is number => v !== null);
    const pm10s = pts.map((p) => p.pm10).filter((v): v is number => v !== null);

    const parsedDate = new Date(`${date}T12:00:00`);
    const label = Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    summaries.push({
      date,
      label,
      minUsAqi: aqis.length > 0 ? Math.min(...aqis) : null,
      maxUsAqi: aqis.length > 0 ? Math.max(...aqis) : null,
      avgUsAqi: aqis.length > 0 ? Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length) : null,
      avgPm25: pm25s.length > 0 ? Number((pm25s.reduce((a, b) => a + b, 0) / pm25s.length).toFixed(1)) : null,
      avgPm10: pm10s.length > 0 ? Number((pm10s.reduce((a, b) => a + b, 0) / pm10s.length).toFixed(1)) : null,
    });
  }

  return summaries.slice(0, 5);
}

export async function fetchLocationEnvironmentalData(location: LocationInfo): Promise<EnvironmentalData> {
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    throw new Error('Invalid coordinates provided for air quality lookup.');
  }

  const aqParams = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: 'us_aqi,european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    hourly: 'us_aqi,european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    timezone: 'auto',
    past_days: '1',
    forecast_days: '5',
  });

  const weatherParams = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    timezone: 'auto',
  });

  const [aqRes, weatherRes] = await Promise.all([
    fetchJsonWithTimeout<OpenMeteoAirQualityResponse>(`${AIR_QUALITY_BASE}?${aqParams.toString()}`),
    fetchJsonWithTimeout<OpenMeteoWeatherResponse>(`${WEATHER_BASE}?${weatherParams.toString()}`).catch(
      () => null
    ),
  ]);

  if (!aqRes.current) {
    throw new Error('Open-Meteo Air Quality API returned no current readings for these coordinates.');
  }

  const currentTimeMs = new Date(aqRes.current.time).getTime();

  const currentAir: CurrentAirQuality = {
    time: aqRes.current.time,
    us_aqi: aqRes.current.us_aqi ?? null,
    european_aqi: aqRes.current.european_aqi ?? null,
    pm2_5: aqRes.current.pm2_5 ?? null,
    pm10: aqRes.current.pm10 ?? null,
    carbon_monoxide: aqRes.current.carbon_monoxide ?? null,
    nitrogen_dioxide: aqRes.current.nitrogen_dioxide ?? null,
    sulphur_dioxide: aqRes.current.sulphur_dioxide ?? null,
    ozone: aqRes.current.ozone ?? null,
  };

  const hourlyAir: HourlyAirQualityPoint[] = [];
  if (aqRes.hourly && Array.isArray(aqRes.hourly.time)) {
    const len = aqRes.hourly.time.length;
    for (let i = 0; i < len; i++) {
      const t = aqRes.hourly.time[i];
      const tMs = new Date(t).getTime();
      hourlyAir.push({
        time: t,
        us_aqi: aqRes.hourly.us_aqi?.[i] ?? null,
        european_aqi: aqRes.hourly.european_aqi?.[i] ?? null,
        pm2_5: aqRes.hourly.pm2_5?.[i] ?? null,
        pm10: aqRes.hourly.pm10?.[i] ?? null,
        carbon_monoxide: aqRes.hourly.carbon_monoxide?.[i] ?? null,
        nitrogen_dioxide: aqRes.hourly.nitrogen_dioxide?.[i] ?? null,
        sulphur_dioxide: aqRes.hourly.sulphur_dioxide?.[i] ?? null,
        ozone: aqRes.hourly.ozone?.[i] ?? null,
        isForecast: Number.isFinite(currentTimeMs) && Number.isFinite(tMs) ? tMs > currentTimeMs : false,
      });
    }
  }

  const weather: CurrentWeather = {
    temperature: weatherRes?.current?.temperature_2m ?? null,
    apparentTemperature: weatherRes?.current?.apparent_temperature ?? null,
    humidity: weatherRes?.current?.relative_humidity_2m ?? null,
    windSpeed: weatherRes?.current?.wind_speed_10m ?? null,
    weatherCode: weatherRes?.current?.weather_code ?? null,
    weatherLabel: mapWmoWeatherCode(weatherRes?.current?.weather_code ?? null),
    isDay: weatherRes?.current?.is_day !== 0,
  };

  const trend = computeAqiTrend(currentAir.us_aqi, hourlyAir);
  const dailyForecast = buildDailyForecast(hourlyAir);

  return {
    location,
    currentAir,
    hourlyAir,
    dailyForecast,
    weather,
    fetchedAt: new Date().toISOString(),
    timezone: aqRes.timezone ?? 'auto',
    trend,
  };
}

