export type AqiCategory = 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export type AqiScale = 'us' | 'eu';

export type NavigationTab =
  | 'dashboard'
  | 'assistant'
  | 'map'
  | 'analytics'
  | 'compare'
  | 'alerts'
  | 'guide';

export interface LocationInfo {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
}

export interface PollutantValues {
  pm2_5: number | null;
  pm10: number | null;
  carbon_monoxide: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  ozone: number | null;
}

export interface CurrentAirQuality extends PollutantValues {
  time: string;
  us_aqi: number | null;
  european_aqi: number | null;
}

export interface HourlyAirQualityPoint extends PollutantValues {
  time: string;
  us_aqi: number | null;
  european_aqi: number | null;
  isForecast: boolean;
}

export interface DailyForecastSummary {
  date: string;
  label: string;
  minUsAqi: number | null;
  maxUsAqi: number | null;
  avgUsAqi: number | null;
  avgPm25: number | null;
  avgPm10: number | null;
}

export interface CurrentWeather {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  weatherLabel: string;
  isDay: boolean;
}

export interface EnvironmentalData {
  location: LocationInfo;
  currentAir: CurrentAirQuality;
  hourlyAir: HourlyAirQualityPoint[];
  dailyForecast: DailyForecastSummary[];
  weather: CurrentWeather;
  fetchedAt: string;
  timezone: string;
  trend: {
    direction: 'improving' | 'deteriorating' | 'stable' | 'unavailable';
    delta: number | null;
    summary: string;
  };
}

export type AgeGroup = 'child' | 'adult' | 'older_adult';
export type OutdoorActivity =
  | 'morning_walk'
  | 'running'
  | 'cycling'
  | 'commuting'
  | 'outdoor_work'
  | 'casual';
export type ExerciseIntensity = 'low' | 'moderate' | 'vigorous';
export type SensitivityLevel = 'none' | 'mild' | 'respiratory';

export interface UserProfile {
  name: string;
  ageGroup: AgeGroup;
  preferredActivity: OutdoorActivity;
  exerciseIntensity: ExerciseIntensity;
  sensitivity: SensitivityLevel;
}

export interface AlertSettings {
  aqiThreshold: number;
  pm25Threshold: number;
  notifyOnForecastSpike: boolean;
  notifyOnImprovement: boolean;
  exerciseWarningEnabled: boolean;
}

export interface EvaluatedAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  category: 'threshold' | 'pollutant' | 'activity' | 'forecast';
}

export type VerdictLevel = 'recommended' | 'caution' | 'limit' | 'avoid';

export interface ActivityRecommendation {
  id: string;
  title: string;
  verdict: VerdictLevel;
  verdictLabel: string;
  summary: string;
}

export interface RecommendationResult {
  overallVerdict: VerdictLevel;
  overallHeadline: string;
  effectiveAqi: number;
  dominantPollutant: {
    key: keyof PollutantValues;
    name: string;
    value: number | null;
    unit: string;
    ratioToGuideline: number;
  } | null;
  activities: ActivityRecommendation[];
  precautions: string[];
  bestTimeWindow: {
    found: boolean;
    label: string;
    expectedAqi: number | null;
    reason: string;
  };
  decisionRules: string[];
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

