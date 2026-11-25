import type { AqiCategory, AqiScale, HourlyAirQualityPoint, PollutantValues } from '../types/airQuality';

export interface AqiCategoryMeta {
  category: AqiCategory;
  rangeUs: string;
  rangeEu: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  meaning: string;
  generalGuidance: string;
}

export const AQI_CATEGORIES: Record<AqiCategory, AqiCategoryMeta> = {
  Good: {
    category: 'Good',
    rangeUs: '0 – 50',
    rangeEu: '0 – 20',
    colorHex: '#16A34A',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    badgeClass: 'bg-emerald-600 text-white',
    meaning: 'Air quality is satisfactory and poses little or no health risk for most people.',
    generalGuidance: 'Normal outdoor activities and natural ventilation are generally suitable.',
  },
  Moderate: {
    category: 'Moderate',
    rangeUs: '51 – 100',
    rangeEu: '21 – 40',
    colorHex: '#CA8A04',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    badgeClass: 'bg-amber-500 text-white',
    meaning: 'Air quality is acceptable, though unusually sensitive individuals may experience mild symptoms.',
    generalGuidance: 'Most people can be active outdoors; sensitive groups should monitor symptoms during prolonged exertion.',
  },
  Poor: {
    category: 'Poor',
    rangeUs: '101 – 200',
    rangeEu: '41 – 60',
    colorHex: '#EA580C',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
    badgeClass: 'bg-orange-600 text-white',
    meaning: 'Elevated pollution levels. Sensitive groups are at higher risk, and healthy individuals may feel irritation during heavy exertion.',
    generalGuidance: 'Reduce prolonged or vigorous outdoor exertion; consider wearing a well-fitted N95/KN95 mask.',
  },
  'Very Poor': {
    category: 'Very Poor',
    rangeUs: '201 – 300',
    rangeEu: '61 – 80',
    colorHex: '#DC2626',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800/60',
    badgeClass: 'bg-red-600 text-white',
    meaning: 'Unhealthy air quality. Everyone may begin to experience respiratory discomfort or reduced endurance.',
    generalGuidance: 'Avoid strenuous outdoor exercise, keep windows closed, and use indoor air filtration if available.',
  },
  Severe: {
    category: 'Severe',
    rangeUs: '301+',
    rangeEu: '81+',
    colorHex: '#9333EA',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
    badgeClass: 'bg-purple-600 text-white',
    meaning: 'Hazardous pollution levels. High likelihood of adverse respiratory and cardiovascular effects across the population.',
    generalGuidance: 'Remain indoors with windows sealed, run HEPA air purifiers if available, and wear an N95/FFP2 mask if travel is unavoidable.',
  },
};

export function getAqiCategory(value: number | null, scale: AqiScale = 'us'): AqiCategoryMeta {
  if (value === null || Number.isNaN(value)) {
    return AQI_CATEGORIES.Moderate;
  }

  if (scale === 'eu') {
    if (value <= 20) return AQI_CATEGORIES.Good;
    if (value <= 40) return AQI_CATEGORIES.Moderate;
    if (value <= 60) return AQI_CATEGORIES.Poor;
    if (value <= 80) return AQI_CATEGORIES['Very Poor'];
    return AQI_CATEGORIES.Severe;
  }

  // US AQI (0-500) mapped to the 5 AirAware categories
  if (value <= 50) return AQI_CATEGORIES.Good;
  if (value <= 100) return AQI_CATEGORIES.Moderate;
  if (value <= 200) return AQI_CATEGORIES.Poor;
  if (value <= 300) return AQI_CATEGORIES['Very Poor'];
  return AQI_CATEGORIES.Severe;
}

export interface PollutantMeta {
  key: keyof PollutantValues;
  name: string;
  shortName: string;
  unit: string;
  whoGuideline: number;
  whoPeriod: string;
  description: string;
  sources: string;
  healthImpact: string;
}

export const POLLUTANT_META: Record<keyof PollutantValues, PollutantMeta> = {
  pm2_5: {
    key: 'pm2_5',
    name: 'Fine Particulate Matter (PM2.5)',
    shortName: 'PM2.5',
    unit: 'µg/m³',
    whoGuideline: 15,
    whoPeriod: '24-hour WHO guideline (15 µg/m³)',
    description: 'Microscopic inhalable particles ≤ 2.5 micrometers in diameter.',
    sources: 'Vehicle exhaust, power plants, biomass burning, construction dust, and secondary atmospheric reactions.',
    healthImpact: 'Penetrates deep into alveoli and can enter the bloodstream, aggravating asthma, bronchitis, and cardiovascular strain.',
  },
  pm10: {
    key: 'pm10',
    name: 'Coarse Particulate Matter (PM10)',
    shortName: 'PM10',
    unit: 'µg/m³',
    whoGuideline: 45,
    whoPeriod: '24-hour WHO guideline (45 µg/m³)',
    description: 'Inhalable coarse particles ≤ 10 micrometers in diameter.',
    sources: 'Road dust, construction sites, windblown soil, pollen, and industrial emissions.',
    healthImpact: 'Irritates the eyes, nose, throat, and upper airways; can trigger coughing and wheezing.',
  },
  carbon_monoxide: {
    key: 'carbon_monoxide',
    name: 'Carbon Monoxide (CO)',
    shortName: 'CO',
    unit: 'µg/m³',
    whoGuideline: 4000,
    whoPeriod: '24-hour WHO guideline (4,000 µg/m³)',
    description: 'Colorless, odorless gas produced by incomplete combustion.',
    sources: 'Motor vehicle traffic, fuel-burning appliances, generators, and wildfires.',
    healthImpact: 'Reduces oxygen delivery to organs and tissues; particularly concerning for people with heart conditions.',
  },
  nitrogen_dioxide: {
    key: 'nitrogen_dioxide',
    name: 'Nitrogen Dioxide (NO₂)',
    shortName: 'NO₂',
    unit: 'µg/m³',
    whoGuideline: 25,
    whoPeriod: '24-hour WHO guideline (25 µg/m³)',
    description: 'Reactive reddish-brown gas common near busy urban roadways.',
    sources: 'Diesel and gasoline engines, power generation, and industrial combustion.',
    healthImpact: 'Inflames airway linings, lowers resistance to respiratory infections, and worsens asthma.',
  },
  sulphur_dioxide: {
    key: 'sulphur_dioxide',
    name: 'Sulphur Dioxide (SO₂)',
    shortName: 'SO₂',
    unit: 'µg/m³',
    whoGuideline: 40,
    whoPeriod: '24-hour WHO guideline (40 µg/m³)',
    description: 'Sharp-smelling gas from burning sulfur-containing fossil fuels.',
    sources: 'Coal and oil power plants, metal smelting, shipping, and industrial boilers.',
    healthImpact: 'Rapidly narrows airways in sensitive individuals, causing wheezing and shortness of breath.',
  },
  ozone: {
    key: 'ozone',
    name: 'Ground-Level Ozone (O₃)',
    shortName: 'O₃',
    unit: 'µg/m³',
    whoGuideline: 100,
    whoPeriod: '8-hour WHO guideline (100 µg/m³)',
    description: 'Secondary pollutant formed when sunlight reacts with NOx and VOCs.',
    sources: 'Photochemical reactions from traffic and industrial emissions, peaking on warm sunny afternoons.',
    healthImpact: 'Causes chest tightness, throat irritation, and reduced lung function during outdoor exercise.',
  },
};

export const POLLUTANT_ORDER: (keyof PollutantValues)[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

export function mapWmoWeatherCode(code: number | null): string {
  if (code === null) return 'Unavailable';
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Heavy thunderstorm with hail',
  };
  return map[code] ?? `Weather code ${code}`;
}

export function computeAqiTrend(
  currentUsAqi: number | null,
  hourly: HourlyAirQualityPoint[]
): {
  direction: 'improving' | 'deteriorating' | 'stable' | 'unavailable';
  delta: number | null;
  summary: string;
} {
  if (currentUsAqi === null) {
    return { direction: 'unavailable', delta: null, summary: 'Trend unavailable without current AQI.' };
  }

  const pastPoints = hourly.filter((p) => !p.isForecast && p.us_aqi !== null);
  if (pastPoints.length < 4) {
    return { direction: 'unavailable', delta: null, summary: 'Insufficient recent data to determine trend.' };
  }

  // Compare current against average of 3 to 6 hours ago
  const slice = pastPoints.slice(-7, -2);
  if (slice.length === 0) {
    return { direction: 'unavailable', delta: null, summary: 'Insufficient recent data to determine trend.' };
  }

  const avgPast = slice.reduce((sum, p) => sum + (p.us_aqi ?? 0), 0) / slice.length;
  const delta = Math.round(currentUsAqi - avgPast);

  if (delta <= -8) {
    return {
      direction: 'improving',
      delta,
      summary: `Improving (${Math.abs(delta)} AQI pts lower than recent hours)`,
    };
  }
  if (delta >= 8) {
    return {
      direction: 'deteriorating',
      delta,
      summary: `Deteriorating (+${delta} AQI pts higher than recent hours)`,
    };
  }
  return {
    direction: 'stable',
    delta,
    summary: 'Stable compared to recent hours',
  };
}

export function formatTimeShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatHourLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

