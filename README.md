# AirAware AI – Intelligent Urban Air Quality Assistant

AirAware AI is a context-aware urban air quality assistant built with React, TypeScript, Vite, and Tailwind CSS. Rather than showing a static AQI number, it combines live Open-Meteo air quality and weather data with a transparent, rule-based personalization engine and a conversational assistant to help urban residents make informed daily decisions.

---

## How It Addresses the Urban Air Quality Challenge

Most AQI dashboards show raw numbers without explaining what they mean for a specific person's activity, health sensitivity, or schedule. AirAware AI bridges this gap by:
1. **Personalizing risk** using age group, respiratory sensitivity, exercise intensity, and weather dispersion factors.
2. **Finding cleaner time windows** from hourly air quality forecasts so users can reschedule walks or runs rather than guessing.
3. **Explaining every decision** with transparent rules and WHO 2021 pollutant reference ratios—never claiming absolute safety or issuing medical diagnoses.
4. **Operating 100% key-free** using open, free public APIs so anyone can run or deploy it immediately.

---

## Key Features

- **Main Dashboard**:
  - Automatic browser geolocation (with permission) + debounced global city search + saved favorites + refresh & last-updated timestamp.
  - Prominent **US AQI (0–500)** and explicit **European AQI (EAQI)** switcher (never mixed), 5-category indicator (`Good`, `Moderate`, `Poor`, `Very Poor`, `Severe`), and recent-hour trend (Improving / Deteriorating / Stable).
  - Real-time pollutant cards for **PM2.5, PM10, CO, NO₂, SO₂, and O₃** with units (`µg/m³`) and WHO 2021 guideline comparisons.
  - Clearly separated **Weather** card (temperature, feels-like, humidity, wind speed, WMO weather condition).
- **Smart Personalized Air Quality Assistant**:
  - Live-updating personal context profile (Age group, Activity, Exercise intensity, Respiratory sensitivity).
  - Activity-specific verdicts for Morning Walk, Outdoor Exercise, Mask Guidance, Window Ventilation, and Indoor/Outdoor Balance, plus Best Time Window and transparent rule breakdown.
- **Conversational AI Assistant**:
  - Interactive chat interface with suggested questions and a local context-aware NLP/rule engine backed by live city AQI, dominant pollutant, weather, and hourly forecasts.
- **Interactive Air Quality Map**:
  - Leaflet + OpenStreetMap map with active/saved city markers and click-anywhere coordinate inspection.
- **Forecast & Analytics**:
  - Interactive Recharts visualizations: 48-hour US AQI trajectory (clearly separating Recent Modeled vs. Forecast), 5-day daily summary cards, PM2.5 & PM10 trends, and WHO guideline comparison chart.
- **Compare Cities**:
  - Side-by-side live comparison of up to 4 cities with AQI, PM2.5, dominant pollutant, weather, and bar chart.
- **Personalized Alert System & Settings**:
  - Configurable AQI & PM2.5 thresholds, exercise warnings, forecast spike/improvement alerts, favorite locations manager, dark mode, and LocalStorage persistence.
- **AQI & Pollutant Guide**:
  - Clear explanation of US AQI vs. EAQI scales, health impacts of all 6 pollutants, and data source transparency.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Charts**: Recharts
- **Maps**: Leaflet + OpenStreetMap
- **APIs (No API Keys Required)**:
  - [Open-Meteo Air Quality API](https://air-quality-api.open-meteo.com/v1/air-quality)
  - [Open-Meteo Weather Forecast API](https://api.open-meteo.com/v1/forecast)
  - [Open-Meteo Geocoding API](https://geocoding-api.open-meteo.com/v1/search)
  - [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/reverse) (reverse geocoding for browser geolocation & map clicks)
- **Persistence**: Browser `localStorage`

---

## System Architecture

```text
src/
├── types/airQuality.ts          # Core TypeScript interfaces
├── utils/aqi.ts                 # AQI category mapping, WHO guidelines, WMO weather codes, trend math
├── services/openMeteo.ts        # Open-Meteo Air Quality, Weather, Geocoding & Nominatim clients
├── engine/
│   ├── recommendationEngine.ts  # Explainable rule-based personalization & best-window finder
│   ├── chatAssistant.ts         # Local context-aware conversational Q&A engine
│   └── alertEngine.ts           # Live threshold & forecast alert evaluator
├── hooks/
│   ├── useLocalStorage.ts       # Type-safe LocalStorage hook
│   └── useAirQuality.ts         # Location state, geolocation, API fetching & error handling
└── components/
    ├── ErrorBoundary.tsx        # React error boundary
    ├── Layout.tsx               # Responsive sidebar/mobile nav & dark mode toggle
    ├── LocationBar.tsx          # City search, geolocation, favorites & refresh bar
    ├── DashboardView.tsx        # Main AQI, Weather, Snapshot & 6 Pollutant cards
    ├── AssistantView.tsx        # Personal context configurator, rules & chat interface
    ├── MapView.tsx              # Leaflet + OpenStreetMap interactive inspection map
    ├── AnalyticsView.tsx        # Recharts 48h AQI, 5-day forecast, PM & WHO charts
    ├── CompareView.tsx          # Multi-city live comparison
    ├── AlertsView.tsx           # Alert thresholds, active alerts, profile & saved cities
    └── GuideView.tsx            # AQI scale guide, pollutant encyclopedia & methodology
```

---

## Recommendation Engine Logic

1. **Base Score**: Starts from the location's current **US AQI** (`0–500`).
2. **Personal Modifiers**:
   - Respiratory sensitivity (`+35` effective AQI) or mild sensitivity (`+15`).
   - Children or older adults (`+15`).
   - Vigorous (`+20`) or moderate (`+10`) exercise intensity due to higher minute ventilation.
3. **Meteorological Modifiers**:
   - Low wind (`< 6 km/h` when AQI > 50) adds `+10` for pollutant stagnation.
   - Extreme temperatures (`>= 34°C` or `<= 2°C`) add `+10` for compounded physiological stress.
4. **Dominant Pollutant**: Computes each pollutant's ratio to its WHO 2021 reference guideline (`PM2.5: 15`, `PM10: 45`, `NO₂: 25`, `O₃: 100`, `SO₂: 40`, `CO: 4000 µg/m³`).
5. **Best Time Window**: Scans the next 24 hours of Open-Meteo hourly forecasts to recommend the cleanest upcoming hour.

---

## Assumptions & Limitations

- **Modeled Grid Data**: Open-Meteo Air Quality uses assimilated atmospheric models (CAMS / NOAA) rather than physical street-level sensor hardware; hyperlocal micro-environments (e.g., directly beside a highway) may vary.
- **In-App Alerts Only**: Because AirAware AI runs client-side without a backend push server, alerts are evaluated live when the app is open or refreshed.
- **Not Medical Advice**: Guidance is informational only and never constitutes a medical diagnosis or guarantee of safety.

---

## Installation & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Type-check and build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## Testing Checklist

1. **Application Load**: Run `npm run dev` and verify the dashboard loads live data for the default city with zero console errors.
2. **Geolocation**: Click **My Location**, grant permission, and verify reverse geocoding updates the city and AQI.
3. **City Search**: Search for any city (e.g., `Tokyo`, `Bengaluru`, `Paris`) and confirm dropdown results and live data update.
4. **Personalization**: Change sensitivity to `Asthma / COPD` and intensity to `Vigorous` in **AI Assistant** and verify effective AQI and verdicts update immediately.
5. **Conversational AI**: Test all 6 suggested questions in the chat panel and verify responses cite the active city's live readings.
6. **Map & Charts**: Click a point on **Air Quality Map** to inspect coordinates; verify Recharts render in **Forecast & Trends** and **Compare Cities**.
7. **Persistence**: Toggle Dark Mode, save a favorite city, adjust alert thresholds, and refresh the page to confirm `localStorage` persistence.

---

## Deployment on Vercel

This project includes `vercel.json` for single-page routing and builds cleanly with `npm run build` (`dist/`).

1. Push the repository to a public GitHub repository (excluding `node_modules` and `dist` via `.gitignore`).
2. Import the repository in [Vercel](https://vercel.com/new).
3. Keep the default Vite settings (`Build Command: npm run build`, `Output Directory: dist`).
4. Click **Deploy**—no environment variables or API keys are required.

