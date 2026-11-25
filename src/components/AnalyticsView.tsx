import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, Info } from 'lucide-react';
import type { EnvironmentalData } from '../types/airQuality';
import { formatHourLabel, getAqiCategory, POLLUTANT_META, POLLUTANT_ORDER } from '../utils/aqi';

interface AnalyticsViewProps {
  data: EnvironmentalData;
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  // Take up to 12 past hours + 36 forecast hours for a crisp 48h window
  const past = data.hourlyAir.filter((h) => !h.isForecast).slice(-12);
  const future = data.hourlyAir.filter((h) => h.isForecast).slice(0, 36);
  const combined = [...past, ...future];

  const nowPoint = past.length > 0 ? past[past.length - 1] : null;
  const nowLabel = nowPoint ? formatHourLabel(nowPoint.time) : undefined;

  const hourlyChartData = combined.map((pt) => ({
    label: formatHourLabel(pt.time),
    fullTime: new Date(pt.time).toLocaleString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: pt.isForecast ? 'Forecast' : 'Recent Modeled',
    usAqi: pt.us_aqi,
    pm25: pt.pm2_5,
    pm10: pt.pm10,
  }));

  const pollutantComparisonData = POLLUTANT_ORDER.map((key) => {
    const meta = POLLUTANT_META[key];
    const val = data.currentAir[key];
    const pct = val !== null ? Math.round((val / meta.whoGuideline) * 100) : 0;
    return {
      name: meta.shortName,
      percentOfWho: pct,
      value: val ?? 0,
      unit: meta.unit,
      guideline: meta.whoGuideline,
    };
  });

  const hasHourly = hourlyChartData.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Forecast &amp; Air Quality Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hourly trends, 5-day forecast, and pollutant comparisons for{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            {data.location.name}, {data.location.country}
          </strong>
          .
        </p>
      </div>

      {/* Distinction Notice */}
      <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-2xl px-4 py-3 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Recent vs. Forecast:</strong> Points to the left of the &ldquo;Now&rdquo; marker reflect recent atmospheric model analysis; points to the right are Open-Meteo hourly forecasts.
        </span>
      </div>

      {/* Hourly US AQI Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            48-Hour US AQI Trajectory (Recent 12h + Forecast 36h)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track expected peaks and cleaner windows to plan outdoor activities.
          </p>
        </div>

        {!hasHourly ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-400">
            Hourly AQI data is unavailable for this location.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={5} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: number | string | Array<number | string>) => [
                    `${value} US AQI`,
                    'US AQI',
                  ]}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as { fullTime?: string; type?: string } | undefined;
                    return item ? `${item.fullTime} (${item.type})` : '';
                  }}
                />
                {nowLabel && (
                  <ReferenceLine
                    x={nowLabel}
                    stroke="#0284C7"
                    strokeDasharray="4 4"
                    label={{ value: 'Now', position: 'top', fontSize: 11, fill: '#0284C7' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="usAqi"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#aqiGradient)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5-Day Daily Forecast */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daily Air Quality Forecast (Next 5 Days)
          </h2>
        </div>

        {data.dailyForecast.length === 0 ? (
          <p className="text-sm text-slate-500">Daily forecast summary unavailable.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.dailyForecast.map((day) => {
              const cat = getAqiCategory(day.avgUsAqi, 'us');
              return (
                <div
                  key={day.date}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {day.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeClass}`}>
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {day.avgUsAqi ?? '—'}{' '}
                    <span className="text-xs font-normal text-slate-500">avg AQI</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 space-y-0.5">
                    <div>
                      Range: {day.minUsAqi ?? '—'} – {day.maxUsAqi ?? '—'}
                    </div>
                    <div>
                      Avg PM2.5: {day.avgPm25 !== null ? `${day.avgPm25} µg/m³` : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom 2 Charts: PM2.5 & PM10 Trends + Pollutant Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            PM2.5 &amp; PM10 Trends (µg/m³)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Fine and coarse particulate matter over the 48-hour window.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={7} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5 (µg/m³)"
                  stroke="#EA580C"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  name="PM10 (µg/m³)"
                  stroke="#0284C7"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Pollutant Levels vs. WHO Guidelines (%)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            100% equals the WHO 2021 reference guideline for each pollutant.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pollutantComparisonData}
                margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value: number | string | Array<number | string>, _name, props) => {
                    const p = props?.payload as { value?: number; unit?: string } | undefined;
                    return [`${value}% of WHO (${p?.value ?? 0} ${p?.unit ?? ''})`, 'Level'];
                  }}
                />
                <ReferenceLine y={100} stroke="#DC2626" strokeDasharray="4 4" />
                <Bar dataKey="percentOfWho" name="% of WHO Guideline" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

