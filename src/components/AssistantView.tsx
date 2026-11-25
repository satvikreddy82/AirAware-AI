import { useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Clock,
  Info,
  Send,
  ShieldAlert,
  Sliders,
  Sparkles,
  User,
} from 'lucide-react';
import { answerAirQualityQuestion, SUGGESTED_QUESTIONS } from '../engine/chatAssistant';
import type {
  AgeGroup,
  ChatMessage,
  EnvironmentalData,
  ExerciseIntensity,
  OutdoorActivity,
  RecommendationResult,
  SensitivityLevel,
  UserProfile,
  VerdictLevel,
} from '../types/airQuality';

interface AssistantViewProps {
  data: EnvironmentalData;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  recommendation: RecommendationResult;
}

function verdictStyles(verdict: VerdictLevel) {
  switch (verdict) {
    case 'recommended':
      return {
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        border: 'border-emerald-200/80 dark:border-emerald-800/50',
      };
    case 'caution':
      return {
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        border: 'border-amber-200/80 dark:border-amber-800/50',
      };
    case 'limit':
      return {
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        border: 'border-orange-200/80 dark:border-orange-800/50',
      };
    case 'avoid':
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        border: 'border-red-200/80 dark:border-red-800/50',
      };
  }
}

function renderFormattedText(text: string) {
  return text.split('\n\n').map((para, idx) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={idx} className="mb-2 last:mb-0 leading-relaxed whitespace-pre-line">
        {parts.map((part, pIdx) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={pIdx}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export function AssistantView({
  data,
  profile,
  onUpdateProfile,
  recommendation,
}: AssistantViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${profile.name ? ` ${profile.name}` : ''}! I am **AirAware AI**, connected to live Open-Meteo data for **${data.location.name}, ${data.location.country}** (US AQI: **${data.currentAir.us_aqi ?? 'N/A'}**). Ask me anything about outdoor safety, pollutants, or the best time to step outside today.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: now,
    };

    const replyText = answerAirQualityQuestion(trimmed, data, profile, recommendation);
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      content: replyText,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Smart Personalized Air Quality Assistant
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tailored activity guidance and conversational Q&amp;A powered by live data for{' '}
            <strong className="text-slate-800 dark:text-slate-200">{data.location.name}</strong>.
          </p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Profile Configurator + Recommendation Engine */}
        <div className="xl:col-span-7 space-y-5">
          {/* Context Profile Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Your Personal Context (Updates Recommendations Live)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Age Group
                </label>
                <select
                  value={profile.ageGroup}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, ageGroup: e.target.value as AgeGroup })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="adult">Adult (18–64)</option>
                  <option value="child">Child / Youth (&lt;18)</option>
                  <option value="older_adult">Older Adult (65+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Respiratory Sensitivity
                </label>
                <select
                  value={profile.sensitivity}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, sensitivity: e.target.value as SensitivityLevel })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="none">None reported</option>
                  <option value="mild">Mild sensitivity / allergies</option>
                  <option value="respiratory">Asthma / COPD / respiratory sensitivity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Primary Outdoor Activity
                </label>
                <select
                  value={profile.preferredActivity}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, preferredActivity: e.target.value as OutdoorActivity })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="morning_walk">Morning Walk</option>
                  <option value="running">Running / Jogging</option>
                  <option value="cycling">Cycling</option>
                  <option value="commuting">Daily Commute</option>
                  <option value="outdoor_work">Outdoor Work</option>
                  <option value="casual">Casual Errands</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Exercise Intensity
                </label>
                <select
                  value={profile.exerciseIntensity}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, exerciseIntensity: e.target.value as ExerciseIntensity })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="low">Low (Casual walking)</option>
                  <option value="moderate">Moderate (Brisk walk / light cycling)</option>
                  <option value="vigorous">Vigorous (Running / sports)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Decisions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {recommendation.overallHeadline}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Effective AQI: <strong>{recommendation.effectiveAqi}</strong> (Base US AQI{' '}
                  {data.currentAir.us_aqi ?? 'N/A'} + personal &amp; weather adjustments)
                </p>
              </div>
              {recommendation.bestTimeWindow.found && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-xs font-medium border border-sky-200/80 dark:border-sky-800/60">
                  <Clock className="w-3.5 h-3.5" />
                  Best window: {recommendation.bestTimeWindow.label} (AQI ~{recommendation.bestTimeWindow.expectedAqi})
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendation.activities.map((act) => {
                const st = verdictStyles(act.verdict);
                return (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border bg-slate-50/70 dark:bg-slate-800/50 ${st.border}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {act.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.badge}`}>
                        {act.verdictLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {act.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Precautions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Recommended Precautions
              </h3>
              <ul className="space-y-1.5">
                {recommendation.precautions.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explainable Decision Rules */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Transparent Decision Rules
              </h3>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                {recommendation.decisionRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{recommendation.disclaimer}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Conversational AI Assistant */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-[640px]">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Conversational Assistant
                </h2>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Using live {data.location.name} AQI ({data.currentAir.us_aqi ?? 'N/A'})
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? <p>{msg.content}</p> : renderFormattedText(msg.content)}
                    <span
                      className={`block text-[10px] mt-1 ${
                        isUser ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Questions */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about running, PM2.5, precautions..."
              aria-label="Ask AirAware AI"
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

