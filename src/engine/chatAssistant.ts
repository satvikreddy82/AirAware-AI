import type { EnvironmentalData, RecommendationResult, UserProfile } from '../types/airQuality';
import { getAqiCategory, POLLUTANT_META } from '../utils/aqi';

export const SUGGESTED_QUESTIONS = [
  'What is the air quality in my city?',
  'Can I go running now?',
  'Why is PM2.5 dangerous?',
  'Which pollutant is currently the biggest concern?',
  'What precautions should I take today?',
  'When would be a better time to go outside?',
];

export function answerAirQualityQuestion(
  question: string,
  data: EnvironmentalData | null,
  profile: UserProfile,
  recommendation: RecommendationResult | null
): string {
  const q = question.toLowerCase().trim();

  if (!data || !recommendation) {
    return 'I do not have live air quality data loaded yet. Please select a city or enable location access on the Dashboard so I can give you accurate, location-specific answers.';
  }

  const city = `${data.location.name}, ${data.location.country}`;
  const aqi = data.currentAir.us_aqi;
  const cat = getAqiCategory(aqi, 'us');
  const pm25 = data.currentAir.pm2_5;
  const dom = recommendation.dominantPollutant;

  // 1. Why is PM2.5 dangerous?
  if (q.includes('pm2.5') && (q.includes('why') || q.includes('danger') || q.includes('harm') || q.includes('health'))) {
    const currentNote =
      pm25 !== null
        ? `Currently in **${city}**, PM2.5 is **${pm25.toFixed(1)} µg/m³** (WHO 24-hour guideline is 15 µg/m³).`
        : `PM2.5 readings are currently unavailable for ${city}.`;
    return [
      `**Why PM2.5 is harmful:** ${POLLUTANT_META.pm2_5.description}`,
      `${POLLUTANT_META.pm2_5.healthImpact}`,
      `**Common sources:** ${POLLUTANT_META.pm2_5.sources}`,
      currentNote,
    ].join('\n\n');
  }

  // 2. Which pollutant is currently the biggest concern?
  if (q.includes('biggest concern') || q.includes('dominant') || q.includes('which pollutant') || q.includes('worst pollutant')) {
    if (!dom) {
      return `Pollutant concentration readings are currently incomplete for **${city}**, so I cannot determine the dominant pollutant.`;
    }
    const meta = POLLUTANT_META[dom.key];
    return [
      `In **${city}**, the biggest concern right now relative to WHO guidelines is **${meta.name}** at **${dom.value} ${dom.unit}** (${dom.ratioToGuideline}× the ${meta.whoPeriod}).`,
      `**Health impact:** ${meta.healthImpact}`,
      `**Likely sources:** ${meta.sources}`,
    ].join('\n\n');
  }

  // 3. When would be a better time to go outside?
  if (q.includes('better time') || q.includes('best time') || q.includes('when') || q.includes('later')) {
    if (!recommendation.bestTimeWindow.found) {
      return `Hourly forecast data is currently unavailable for **${city}**, so I cannot pinpoint a cleaner window.`;
    }
    return [
      `**Best upcoming window in ${city}:** Around **${recommendation.bestTimeWindow.label}** (forecasted US AQI ~**${recommendation.bestTimeWindow.expectedAqi}**).`,
      `${recommendation.bestTimeWindow.reason}`,
      `Current US AQI is **${aqi ?? 'N/A'} (${cat.category})**. ${data.trend.summary}`,
    ].join('\n\n');
  }

  // 4. Can I go running / exercise / walk?
  if (
    q.includes('run') ||
    q.includes('jog') ||
    q.includes('exercise') ||
    q.includes('workout') ||
    q.includes('walk') ||
    q.includes('cycle')
  ) {
    const isWalk = q.includes('walk');
    const act = recommendation.activities.find((a) =>
      isWalk ? a.id === 'morning_walk' : a.id === 'outdoor_exercise'
    );
    const mask = recommendation.activities.find((a) => a.id === 'mask');
    return [
      `**${act?.title ?? 'Outdoor Activity'} in ${city}:** **${act?.verdictLabel ?? 'Check AQI'}**`,
      `${act?.summary ?? ''}`,
      `**Your context:** Effective AQI is **${recommendation.effectiveAqi}** (base US AQI ${aqi ?? 'N/A'}, sensitivity: ${profile.sensitivity}, intensity: ${profile.exerciseIntensity}, age group: ${profile.ageGroup.replace('_', ' ')}).`,
      mask ? `**Mask note:** ${mask.verdictLabel} — ${mask.summary}` : '',
      recommendation.bestTimeWindow.found
        ? `**Alternative window:** ${recommendation.bestTimeWindow.label} (expected AQI ~${recommendation.bestTimeWindow.expectedAqi}).`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  // 5. Precautions / mask / windows
  if (q.includes('precaution') || q.includes('protect') || q.includes('mask') || q.includes('window') || q.includes('should i')) {
    const mask = recommendation.activities.find((a) => a.id === 'mask');
    const win = recommendation.activities.find((a) => a.id === 'windows');
    const bulletList = recommendation.precautions.map((p) => `• ${p}`).join('\n');
    return [
      `**Precautions for ${city} (US AQI ${aqi ?? 'N/A'} – ${cat.category}):**`,
      bulletList,
      mask ? `**Mask:** ${mask.verdictLabel} — ${mask.summary}` : '',
      win ? `**Windows:** ${win.verdictLabel} — ${win.summary}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  // 6. What is the air quality in my city? / General status
  if (
    q.includes('air quality') ||
    q.includes('aqi') ||
    q.includes('how is') ||
    q.includes('status') ||
    q.includes('my city') ||
    q.includes('weather')
  ) {
    const tempStr = data.weather.temperature !== null ? `${data.weather.temperature.toFixed(1)}°C` : 'N/A';
    const windStr = data.weather.windSpeed !== null ? `${data.weather.windSpeed.toFixed(1)} km/h` : 'N/A';
    return [
      `**${city}** currently has a **US AQI of ${aqi ?? 'N/A'} (${cat.category})**${data.currentAir.european_aqi !== null ? ` (European AQI: ${data.currentAir.european_aqi})` : ''}.`,
      `${cat.meaning} **Trend:** ${data.trend.summary}`,
      `**Key Readings:** PM2.5: ${pm25 !== null ? `${pm25.toFixed(1)} µg/m³` : 'N/A'} | PM10: ${data.currentAir.pm10 !== null ? `${data.currentAir.pm10.toFixed(1)} µg/m³` : 'N/A'} | O₃: ${data.currentAir.ozone !== null ? `${data.currentAir.ozone.toFixed(1)} µg/m³` : 'N/A'}`,
      `**Weather:** ${data.weather.weatherLabel}, ${tempStr}, Wind ${windStr}.`,
      `**Personalized takeaway:** ${recommendation.overallHeadline}.`,
    ].join('\n\n');
  }

  // Fallback contextual response
  return [
    `Here is your current snapshot for **${city}**: US AQI is **${aqi ?? 'N/A'} (${cat.category})** with ${dom ? `${dom.name} at ${dom.value} ${dom.unit} as the leading pollutant` : 'mixed pollutant levels'}.`,
    `**Personalized guidance:** ${recommendation.overallHeadline}.`,
    `You can ask me about running or walking safety, why PM2.5 matters, the biggest pollutant concern, precautions, or the best time to go outside today.`,
  ].join('\n\n');
}

