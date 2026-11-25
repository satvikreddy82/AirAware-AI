import { AlertTriangle, Bell, CheckCircle2, Info, Star, Trash2, User } from 'lucide-react';
import type {
  AlertSettings,
  EvaluatedAlert,
  LocationInfo,
  UserProfile,
} from '../types/airQuality';

interface AlertsViewProps {
  alerts: EvaluatedAlert[];
  settings: AlertSettings;
  onUpdateSettings: (s: AlertSettings) => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  favorites: LocationInfo[];
  onSelectFavorite: (loc: LocationInfo) => void;
  onRemoveFavorite: (loc: LocationInfo) => void;
}

export function AlertsView({
  alerts,
  settings,
  onUpdateSettings,
  profile,
  onUpdateProfile,
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
}: AlertsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Personalized Alerts &amp; Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure your thresholds, personal profile, and saved locations. All settings persist locally in your browser.
        </p>
      </div>

      {/* Honest In-App Evaluation Notice */}
      <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-2xl px-4 py-3 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>How Alerts Work:</strong> Alerts are evaluated live whenever you open or refresh AirAware AI. Because this is a client-side web app without a background server, it does not send push notifications when the tab is closed.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Evaluated Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Alerts ({alerts.length})
            </h2>
          </div>

          {alerts.length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                No active alerts triggered
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Current air quality and short-term forecast are within your configured thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const styles =
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200'
                    : 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-200';
                return (
                  <div key={alert.id} className={`p-3.5 rounded-xl border ${styles}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-bold">{alert.title}</h3>
                          <p className="text-xs opacity-90 mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                      <span className="text-[11px] opacity-75 shrink-0">{alert.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alert Threshold Configuration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Alert Thresholds
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">US AQI Alert Threshold</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {settings.aqiThreshold} US AQI
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={settings.aqiThreshold}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, aqiThreshold: Number(e.target.value) })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>50 (Strict)</span>
                <span>150 (Moderate)</span>
                <span>300 (Severe)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">PM2.5 Alert Threshold</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {settings.pm25Threshold} µg/m³
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={150}
                step={5}
                value={settings.pm25Threshold}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, pm25Threshold: Number(e.target.value) })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>15 µg/m³ (WHO)</span>
                <span>75 µg/m³</span>
                <span>150 µg/m³</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">
                  Warn when outdoor exercise is not recommended
                </span>
                <input
                  type="checkbox"
                  checked={settings.exerciseWarningEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, exerciseWarningEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">
                  Notify on forecasted AQI spike (next 12h)
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnForecastSpike}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, notifyOnForecastSpike: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">
                  Notify when cleaner air is expected later
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnImprovement}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, notifyOnImprovement: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Personal Profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Personal Profile
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
              placeholder="e.g., Alex"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Activity, age group, and sensitivity preferences can also be tuned directly in the{' '}
            <strong>AI Assistant</strong> tab and are synced automatically.
          </p>
        </div>

        {/* Favorite Locations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Saved Locations ({favorites.length})
            </h2>
          </div>

          {favorites.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved locations yet. Click the star icon next to any city name on the Dashboard to save it.
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => onSelectFavorite(fav)}
                    className="text-left flex-1 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {fav.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      {fav.country}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(fav)}
                    aria-label={`Remove ${fav.name} from favorites`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

