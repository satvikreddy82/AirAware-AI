import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AssistantView } from './components/AssistantView';
import { CompareView } from './components/CompareView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GuideView } from './components/GuideView';
import { Layout } from './components/Layout';
import { LocationBar } from './components/LocationBar';
import { MapView } from './components/MapView';
import { evaluateAlerts } from './engine/alertEngine';
import { generatePersonalizedRecommendations } from './engine/recommendationEngine';
import { useAirQuality } from './hooks/useAirQuality';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AlertSettings, NavigationTab, UserProfile } from './types/airQuality';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  ageGroup: 'adult',
  preferredActivity: 'morning_walk',
  exerciseIntensity: 'moderate',
  sensitivity: 'none',
};

const DEFAULT_ALERTS: AlertSettings = {
  aqiThreshold: 120,
  pm25Threshold: 35,
  notifyOnForecastSpike: true,
  notifyOnImprovement: true,
  exerciseWarningEnabled: true,
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('airaware_dark_mode', false);
  const [profile, setProfile] = useLocalStorage<UserProfile>('airaware_user_profile', DEFAULT_PROFILE);
  const [alertSettings, setAlertSettings] = useLocalStorage<AlertSettings>(
    'airaware_alert_settings',
    DEFAULT_ALERTS
  );

  const {
    selectedLocation,
    selectLocation,
    data,
    loading,
    error,
    refresh,
    detectCurrentLocation,
    locating,
    geoError,
    favorites,
    toggleFavorite,
    isFavorite,
  } = useAirQuality();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const recommendation = useMemo(() => {
    if (!data) return null;
    return generatePersonalizedRecommendations(data, profile);
  }, [data, profile]);

  const activeAlerts = useMemo(() => {
    return evaluateAlerts(data, alertSettings, recommendation);
  }, [data, alertSettings, recommendation]);

  const renderContent = () => {
    if (activeTab === 'guide') {
      return <GuideView />;
    }

    if (activeTab === 'compare') {
      return <CompareView primaryLocation={selectedLocation} favorites={favorites} />;
    }

    if (loading && !data) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Fetching live air quality &amp; weather data for {selectedLocation.name}...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Querying Open-Meteo Air Quality &amp; Forecast APIs
          </p>
        </div>
      );
    }

    if (error && !data) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Unable to Load Air Quality Data
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Retry Request
          </button>
        </div>
      );
    }

    if (!data || !recommendation) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            data={data}
            recommendation={recommendation}
            alerts={activeAlerts}
            onNavigate={setActiveTab}
          />
        );
      case 'assistant':
        return (
          <AssistantView
            data={data}
            profile={profile}
            onUpdateProfile={setProfile}
            recommendation={recommendation}
          />
        );
      case 'map':
        return (
          <MapView
            data={data}
            favorites={favorites}
            onSelectLocation={selectLocation}
          />
        );
      case 'analytics':
        return <AnalyticsView data={data} />;
      case 'alerts':
        return (
          <AlertsView
            alerts={activeAlerts}
            settings={alertSettings}
            onUpdateSettings={setAlertSettings}
            profile={profile}
            onUpdateProfile={setProfile}
            favorites={favorites}
            onSelectFavorite={(loc) => {
              selectLocation(loc);
              setActiveTab('dashboard');
            }}
            onRemoveFavorite={toggleFavorite}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        alertCount={activeAlerts.length}
      >
        <div className="space-y-6">
          {activeTab !== 'guide' && (
            <LocationBar
              selectedLocation={selectedLocation}
              onSelectLocation={selectLocation}
              onDetectLocation={detectCurrentLocation}
              onRefresh={refresh}
              locating={locating}
              loading={loading}
              geoError={geoError}
              fetchedAt={data?.fetchedAt ?? null}
              favorites={favorites}
              isFavorite={isFavorite(selectedLocation.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {error && data && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
              <span>Refresh failed: {error} (showing last loaded readings).</span>
              <button
                type="button"
                onClick={refresh}
                className="font-semibold underline shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {renderContent()}
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;

