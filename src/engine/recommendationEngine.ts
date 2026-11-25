import type {
  ActivityRecommendation,
  EnvironmentalData,
  PollutantValues,
  RecommendationResult,
  UserProfile,
  VerdictLevel,
} from '../types/airQuality';
import { formatHourLabel, getAqiCategory, POLLUTANT_META, POLLUTANT_ORDER } from '../utils/aqi';

function verdictLabel(level: VerdictLevel): string {
  switch (level) {
    case 'recommended':
      return 'Suitable';
    case 'caution':
      return 'Use Caution';
    case 'limit':
      return 'Limit Exposure';
    case 'avoid':
      return 'Avoid Outdoors';
  }
}

export function findDominantPollutant(values: PollutantValues) {
  let best: RecommendationResult['dominantPollutant'] = null;

  for (const key of POLLUTANT_ORDER) {
    const val = values[key];
    if (val === null || !Number.isFinite(val)) continue;
    const meta = POLLUTANT_META[key];
    const ratio = val / meta.whoGuideline;
    if (!best || ratio > best.ratioToGuideline) {
      best = {
        key,
        name: meta.shortName,
        value: val,
        unit: meta.unit,
        ratioToGuideline: Number(ratio.toFixed(2)),
      };
    }
  }
  return best;
}

export function generatePersonalizedRecommendations(
  data: EnvironmentalData,
  profile: UserProfile
): RecommendationResult {
  const baseAqi = data.currentAir.us_aqi ?? 50;
  const rules: string[] = [];
  let adjustment = 0;

  rules.push(`Base US AQI measured/modeled at ${baseAqi} (${getAqiCategory(baseAqi, 'us').category}).`);

  if (profile.sensitivity === 'respiratory') {
    adjustment += 35;
    rules.push('Respiratory sensitivity (+35 effective AQI): stricter threshold applied for airway protection.');
  } else if (profile.sensitivity === 'mild') {
    adjustment += 15;
    rules.push('Mild sensitivity (+15 effective AQI): earlier caution advised.');
  }

  if (profile.ageGroup === 'child' || profile.ageGroup === 'older_adult') {
    adjustment += 15;
    rules.push(
      `${profile.ageGroup === 'child' ? 'Children' : 'Older adults'} (+15 effective AQI): higher vulnerability to fine particulates and ozone.`
    );
  }

  if (profile.exerciseIntensity === 'vigorous') {
    adjustment += 20;
    rules.push('Vigorous exercise (+20 effective AQI): deeper, faster breathing increases inhaled pollutant dose.');
  } else if (profile.exerciseIntensity === 'moderate') {
    adjustment += 10;
    rules.push('Moderate exercise (+10 effective AQI): elevated minute ventilation increases exposure.');
  }

  // Weather modifiers
  const temp = data.weather.temperature;
  const wind = data.weather.windSpeed;
  const code = data.weather.weatherCode;
  const isRaining = code !== null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82));

  if (wind !== null && wind < 6 && baseAqi > 50) {
    adjustment += 10;
    rules.push(`Low wind speed (${wind.toFixed(1)} km/h): stagnant air may trap urban pollutants near ground level.`);
  } else if (wind !== null && wind >= 20) {
    rules.push(`Breezy conditions (${wind.toFixed(1)} km/h): stronger winds help disperse local emissions.`);
  }

  if (isRaining) {
    rules.push(`Active precipitation (${data.weather.weatherLabel}): rain can partially wash out coarse particles, though wet/stormy conditions affect outdoor safety.`);
  }

  if (temp !== null && (temp >= 34 || temp <= 2)) {
    adjustment += 10;
    rules.push(`Thermal stress (${temp.toFixed(1)}°C): extreme temperatures compound cardiovascular and respiratory strain.`);
  }

  const effectiveAqi = Math.max(0, Math.round(baseAqi + adjustment));
  const dominantPollutant = findDominantPollutant(data.currentAir);

  if (dominantPollutant) {
    rules.push(
      `Primary pollutant relative to WHO guidelines: ${dominantPollutant.name} at ${dominantPollutant.value} ${dominantPollutant.unit} (${dominantPollutant.ratioToGuideline}× WHO reference).`
    );
  }

  // Determine overall verdict
  let overallVerdict: VerdictLevel = 'recommended';
  if (effectiveAqi > 200) overallVerdict = 'avoid';
  else if (effectiveAqi > 130) overallVerdict = 'limit';
  else if (effectiveAqi > 75) overallVerdict = 'caution';

  // Activity-specific recommendations
  const walkVerdict: VerdictLevel =
    effectiveAqi <= 80 ? 'recommended' : effectiveAqi <= 140 ? 'caution' : effectiveAqi <= 210 ? 'limit' : 'avoid';

  const exerciseVerdict: VerdictLevel =
    effectiveAqi <= 65 ? 'recommended' : effectiveAqi <= 115 ? 'caution' : effectiveAqi <= 175 ? 'limit' : 'avoid';

  const maskVerdict: VerdictLevel =
    baseAqi > 150 || effectiveAqi > 165
      ? 'avoid' // here "avoid" means strongly recommended to wear mask outdoors; let's phrase clearly
      : baseAqi > 95 || effectiveAqi > 110
      ? 'limit'
      : baseAqi > 60 && profile.sensitivity === 'respiratory'
      ? 'caution'
      : 'recommended';

  const windowVerdict: VerdictLevel =
    baseAqi <= 65 ? 'recommended' : baseAqi <= 110 ? 'caution' : baseAqi <= 165 ? 'limit' : 'avoid';

  const indoorsVerdict: VerdictLevel =
    effectiveAqi > 175 ? 'avoid' : effectiveAqi > 120 ? 'limit' : effectiveAqi > 75 ? 'caution' : 'recommended';

  const activities: ActivityRecommendation[] = [
    {
      id: 'morning_walk',
      title: 'Morning / Casual Walk',
      verdict: walkVerdict,
      verdictLabel: verdictLabel(walkVerdict),
      summary:
        walkVerdict === 'recommended'
          ? 'Low-intensity walking is generally reasonable right now. Stay alert to local traffic corridors.'
          : walkVerdict === 'caution'
          ? 'Keep walks shorter and choose parks or tree-lined streets away from busy roads.'
          : walkVerdict === 'limit'
          ? 'Limit outdoor walking to essential trips; avoid peak traffic hours.'
          : 'Postpone recreational walks and stay indoors until air quality improves.',
    },
    {
      id: 'outdoor_exercise',
      title: 'Outdoor Exercise & Running',
      verdict: exerciseVerdict,
      verdictLabel: verdictLabel(exerciseVerdict),
      summary:
        exerciseVerdict === 'recommended'
          ? `Conditions are favorable for ${profile.exerciseIntensity} outdoor exercise, though no outdoor environment is risk-free.`
          : exerciseVerdict === 'caution'
          ? 'Reduce intensity or duration (e.g., brisk walk instead of vigorous run) and watch for any shortness of breath.'
          : exerciseVerdict === 'limit'
          ? 'Move workouts indoors. High breathing rates during exercise significantly increase particulate intake.'
          : 'Do not exercise outdoors under current conditions; choose indoor low-dust spaces.',
    },
    {
      id: 'mask',
      title: 'Mask Guidance',
      verdict: maskVerdict === 'recommended' ? 'recommended' : maskVerdict,
      verdictLabel:
        baseAqi > 150 || effectiveAqi > 165
          ? 'N95 / FFP2 Recommended'
          : baseAqi > 95 || effectiveAqi > 110
          ? 'Consider N95 Outdoors'
          : baseAqi > 60 && profile.sensitivity === 'respiratory'
          ? 'Optional for Sensitive'
          : 'Not Typically Needed',
      summary:
        baseAqi > 150 || effectiveAqi > 165
          ? 'Wear a well-fitted N95, KN95, or FFP2 respirator when outside to filter fine PM2.5 particles.'
          : baseAqi > 95 || effectiveAqi > 110
          ? 'A well-fitted N95/KN95 mask is helpful during commutes or extended time near traffic.'
          : 'Routine mask use is not required for most people at current levels, unless near heavy dust or smoke.',
    },
    {
      id: 'windows',
      title: 'Window Ventilation',
      verdict: windowVerdict,
      verdictLabel:
        windowVerdict === 'recommended'
          ? 'Open Windows'
          : windowVerdict === 'caution'
          ? 'Brief Ventilation'
          : 'Keep Windows Closed',
      summary:
        windowVerdict === 'recommended'
          ? 'Outdoor air is cleaner than typical stagnant indoor air; cross-ventilate to refresh your space.'
          : windowVerdict === 'caution'
          ? 'Ventilate briefly during lower-traffic hours and close windows if outdoor odors or haze appear.'
          : 'Keep windows and exterior doors closed. Use recirculating air conditioning or a HEPA purifier if available.',
    },
    {
      id: 'stay_indoors',
      title: 'Indoor vs. Outdoor Balance',
      verdict: indoorsVerdict,
      verdictLabel:
        effectiveAqi > 175
          ? 'Stay Indoors'
          : effectiveAqi > 120
          ? 'Prefer Indoors'
          : effectiveAqi > 75
          ? 'Flexible with Care'
          : 'Outdoors Suitable',
      summary:
        effectiveAqi > 175
          ? 'Prioritize staying indoors, especially for sensitive individuals, children, and older adults.'
          : effectiveAqi > 120
          ? 'Spend the majority of your day indoors and batch essential outdoor errands.'
          : 'Normal daily routines are appropriate with basic awareness of changing hourly conditions.',
    },
  ];

  // Best time window in next 24h
  const next24h = data.hourlyAir.filter((h) => h.isForecast && h.us_aqi !== null).slice(0, 24);
  let bestTimeWindow: RecommendationResult['bestTimeWindow'] = {
    found: false,
    label: 'Unavailable',
    expectedAqi: null,
    reason: 'Hourly forecast data is unavailable to identify an optimal window.',
  };

  if (next24h.length > 0) {
    let bestPoint = next24h[0];
    for (const pt of next24h) {
      if ((pt.us_aqi ?? 999) < (bestPoint.us_aqi ?? 999)) {
        bestPoint = pt;
      }
    }
    const bestVal = bestPoint.us_aqi ?? baseAqi;
    const bestCat = getAqiCategory(bestVal, 'us').category;
    bestTimeWindow = {
      found: true,
      label: `${formatHourLabel(bestPoint.time)} (${new Date(bestPoint.time).toLocaleDateString([], { weekday: 'short' })})`,
      expectedAqi: bestVal,
      reason:
        bestVal < baseAqi - 10
          ? `Forecasted US AQI dips to ${bestVal} (${bestCat}), notably cleaner than the current ${baseAqi}.`
          : `Forecasted US AQI is lowest around ${bestVal} (${bestCat}) over the next 24 hours.`,
    };
  }

  // Precautions
  const precautions: string[] = [];
  if (effectiveAqi > 100) {
    precautions.push('Avoid exercising near high-traffic roads where NO₂ and ultrafine particles concentrate.');
  }
  if ((data.currentAir.pm2_5 ?? 0) > 35) {
    precautions.push('Run a HEPA air purifier indoors or set HVAC systems to recirculate mode.');
  }
  if ((data.currentAir.ozone ?? 0) > 100) {
    precautions.push('Ground-level ozone is elevated; schedule outdoor tasks for early morning or after sunset.');
  }
  if (profile.sensitivity === 'respiratory') {
    precautions.push('Keep prescribed rescue inhalers or action-plan medications accessible when stepping out.');
  }
  if (temp !== null && temp > 30) {
    precautions.push('Stay well hydrated, as warm air combined with pollutants increases airway irritation.');
  }
  if (precautions.length === 0) {
    precautions.push('Monitor hourly AQI updates before long outdoor sessions, as urban air can shift with traffic and wind.');
    precautions.push('Choose green spaces or low-traffic routes whenever possible.');
  }

  const overallHeadline =
    overallVerdict === 'recommended'
      ? `Good conditions for ${profile.preferredActivity.replace('_', ' ')} based on your profile`
      : overallVerdict === 'caution'
      ? `Moderate caution advised for ${profile.preferredActivity.replace('_', ' ')}`
      : overallVerdict === 'limit'
      ? `Limit outdoor ${profile.preferredActivity.replace('_', ' ')} under current conditions`
      : `Outdoor ${profile.preferredActivity.replace('_', ' ')} is not recommended right now`;

  return {
    overallVerdict,
    overallHeadline,
    effectiveAqi,
    dominantPollutant,
    activities,
    precautions,
    bestTimeWindow,
    decisionRules: rules,
    disclaimer:
      'AirAware AI provides informational guidance based on modeled air quality data and general public health thresholds. It is not a medical diagnosis and cannot guarantee absolute safety.',
  };
}

