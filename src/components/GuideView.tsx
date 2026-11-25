import { BookOpen, Database, ExternalLink, HeartPulse, Scale } from 'lucide-react';
import { AQI_CATEGORIES, POLLUTANT_META, POLLUTANT_ORDER } from '../utils/aqi';

export function GuideView() {
  const categories = Object.values(AQI_CATEGORIES);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          AQI Scales, Pollutants &amp; Data Sources
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Understand how Air Quality Index categories work, what each pollutant means for your health, and where AirAware AI sources its data.
        </p>
      </div>

      {/* AQI Scale Comparison */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            AQI Categories Explained (US AQI vs. European AQI)
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          AirAware AI never mixes US AQI and European AQI numbers. By default, the dashboard displays{' '}
          <strong>US AQI (0–500)</strong> mapped to five clear action-oriented categories, and lets you switch explicitly to{' '}
          <strong>European AQI (EAQI, 0–100+)</strong>.
        </p>

        <div className="space-y-2.5">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className={`p-4 rounded-xl border ${cat.bgClass} ${cat.borderClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.badgeClass}`}>
                    {cat.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    US AQI: {cat.rangeUs} &nbsp;|&nbsp; EAQI: {cat.rangeEu}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{cat.meaning}</p>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:max-w-xs">
                {cat.generalGuidance}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pollutants Encyclopedia */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Key Pollutants &amp; Health Impacts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POLLUTANT_ORDER.map((key) => {
            const meta = POLLUTANT_META[key];
            return (
              <div
                key={key}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{meta.name}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {meta.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>What it is:</strong> {meta.description}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Main sources:</strong> {meta.sources}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Health impact:</strong> {meta.healthImpact}
                </p>
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Reference: {meta.whoPeriod}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Data Sources & Transparency */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Sources &amp; Methodology
          </h2>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
          <li>
            <strong>Air Quality &amp; Forecasts:</strong>{' '}
            <a
              href="https://open-meteo.com/en/docs/air-quality-api"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Open-Meteo Air Quality API <ExternalLink className="w-3 h-3" />
            </a>{' '}
            (powered by Copernicus Atmosphere Monitoring Service / CAMS &amp; NOAA atmospheric models).
          </li>
          <li>
            <strong>Weather Conditions:</strong> Open-Meteo Weather Forecast API (temperature, apparent temperature, humidity, wind speed, WMO weather codes).
          </li>
          <li>
            <strong>City Search &amp; Maps:</strong> Open-Meteo Geocoding API, OpenStreetMap tiles via Leaflet, and Nominatim reverse geocoding.
          </li>
          <li>
            <strong>Recommendation Engine:</strong> Rule-based decision engine combining US AQI, WHO 2021 pollutant ratios, weather dispersion factors, and your personal sensitivity/activity profile.
          </li>
        </ul>
        <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>
            Disclaimer: AirAware AI is an informational environmental assistant and does not provide medical advice or diagnosis.
          </span>
        </div>
      </section>
    </div>
  );
}

