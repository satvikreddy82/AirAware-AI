import type { ReactNode } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  GitCompare,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Moon,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { NavigationTab } from '../types/airQuality';

interface LayoutProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  alertCount: number;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: NavigationTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'map', label: 'Air Quality Map', icon: MapIcon },
  { id: 'analytics', label: 'Forecast & Trends', icon: Activity },
  { id: 'compare', label: 'Compare Cities', icon: GitCompare },
  { id: 'alerts', label: 'Alerts & Profile', icon: Bell },
  { id: 'guide', label: 'AQI & Health Guide', icon: BookOpen },
];

export function Layout({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  alertCount,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (tab: NavigationTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-30">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
              AirAware AI
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Urban Air Assistant
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  {item.label}
                </span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
            Data: Open-Meteo Air Quality & Weather APIs (CAMS / NOAA models).
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Wind className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">AirAware AI</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

