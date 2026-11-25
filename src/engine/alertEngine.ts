import type {
  AlertSettings,
  EnvironmentalData,
  EvaluatedAlert,
  RecommendationResult,
} from '../types/airQuality';
import { formatHourLabel, getAqiCategory } from '../utils/aqi';

export function evaluateAlerts(
  data: EnvironmentalData | null,
  settings: AlertSettings,
  recommendation: RecommendationResult | null
): EvaluatedAlert[] {
  if (!data) return [];

  const alerts: EvaluatedAlert[] = [];
  const aqi = data.currentAir.us_aqi;
  const pm25 = data.currentAir.pm2_5;
  const nowLabel = new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. AQI threshold check
  if (aqi !== null && aqi >= settings.aqiThreshold) {
    const cat = getAqiCategory(aqi, 'us');
    alerts.push({
      id: 'aqi-threshold',
      severity: aqi > 200 ? 'critical' : 'warning',
      title: `US AQI (${aqi}) exceeded your ${settings.aqiThreshold} threshold`,
      message: `${data.location.name} is currently in the ${cat.category} category. ${cat.generalGuidance}`,
      timestamp: nowLabel,
      category: 'threshold',
    });
  }

  // 2. PM2.5 threshold check
  if (pm25 !== null && pm25 >= settings.pm25Threshold) {
    alerts.push({
      id: 'pm25-threshold',
      severity: pm25 > 55 ? 'critical' : 'warning',
      title: `Elevated PM2.5 (${pm25.toFixed(1)} µg/m³)`,
      message: `Fine particulate matter is above your ${settings.pm25Threshold} µg/m³ alert limit and ${(pm25 / 15).toFixed(1)}× the WHO 24-hour guideline.`,
      timestamp: nowLabel,
      category: 'pollutant',
    });
  }

  // 3. Exercise warning
  if (settings.exerciseWarningEnabled && recommendation) {
    const ex = recommendation.activities.find((a) => a.id === 'outdoor_exercise');
    if (ex && (ex.verdict === 'limit' || ex.verdict === 'avoid')) {
      alerts.push({
        id: 'exercise-warning',
        severity: ex.verdict === 'avoid' ? 'critical' : 'warning',
        title: 'Outdoor exercise not recommended',
        message: ex.summary,
        timestamp: nowLabel,
        category: 'activity',
      });
    }
  }

  // 4. Forecast spike or improvement in next 12 hours
  const next12 = data.hourlyAir.filter((h) => h.isForecast && h.us_aqi !== null).slice(0, 12);
  if (next12.length > 0 && aqi !== null) {
    if (settings.notifyOnForecastSpike) {
      const peak = next12.reduce((max, pt) => ((pt.us_aqi ?? 0) > (max.us_aqi ?? 0) ? pt : max), next12[0]);
      if ((peak.us_aqi ?? 0) >= Math.max(settings.aqiThreshold, aqi + 25)) {
        alerts.push({
          id: 'forecast-spike',
          severity: 'warning',
          title: `Forecasted AQI rise to ${peak.us_aqi} around ${formatHourLabel(peak.time)}`,
          message: `Air quality in ${data.location.name} is projected to worsen later. Plan outdoor errands earlier if possible.`,
          timestamp: nowLabel,
          category: 'forecast',
        });
      }
    }

    if (settings.notifyOnImprovement && aqi > 85) {
      const best = next12.reduce((min, pt) => ((pt.us_aqi ?? 999) < (min.us_aqi ?? 999) ? pt : min), next12[0]);
      if ((best.us_aqi ?? 999) <= aqi - 20) {
        alerts.push({
          id: 'forecast-improvement',
          severity: 'info',
          title: `Cleaner air expected around ${formatHourLabel(best.time)}`,
          message: `US AQI is forecasted to improve from ${aqi} down to ~${best.us_aqi} (${getAqiCategory(best.us_aqi, 'us').category}).`,
          timestamp: nowLabel,
          category: 'forecast',
        });
      }
    }
  }

  return alerts;
}

