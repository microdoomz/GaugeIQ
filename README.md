# GaugeIQ 🚗💨

> **Modern Mileage, Fuel Intelligence & Vehicle Expense Tracking**  
> Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

Live Production URL: **[https://gauge-iq.vercel.app](https://gauge-iq.vercel.app)**

---

## Overview

**GaugeIQ** is a modern vehicle intelligence platform designed to eliminate inaccurate mileage estimates and tedious vehicle expense tracking. It pairs a rich, glassmorphism web dashboard with an **All-in-One Apple Shortcuts integration** that lets you log daily odometer readings and fuel fill-ups in under 5 seconds directly from your iPhone, iPad, Apple Watch, or Mac.

---

## Key Features

### ⛽ Realistic Fuel Status & Remaining Range
- **Timeframe-Independent Fuel Status**: GaugeIQ always looks at your entire vehicle history up to the latest fill-up and odometer log to compute:
  - **Estimated Fuel Remaining** (in Litres / Gallons)
  - **Estimated Driving Range Left** (in km / miles)
  - **Estimated Days Remaining** based on your recent driving patterns
- **Multi-Interval Rolling Average**: Unlike naive calculators that assume empty-tank refills, GaugeIQ compares up to your last 6 fill-ups (5 driving intervals) to create a smoothed, accurate mileage metric that accounts for traffic, hills, and partial top-ups.

### 📊 Real-Time Analytics & Dashboard
- **Key Metrics at a Glance**: Total distance travelled, total fuel consumed, total money spent, and estimated carbon emissions ($CO_2$).
- **Responsive Visualizations**: Powered by Recharts with dynamic line graphs, bar charts, and donut breakdowns.
- **Custom Timeframes**: Filter stats across *Last 7 Days*, *Last 30 Days*, *Last 90 Days*, or *All Time*.

### 📱 All-in-One Apple Shortcuts Integration
- **Single Unified Shortcut**: No switching between separate shortcuts. One shortcut named **"GaugeIQ"** handles:
  - **First-Time Login**: Prompts for your email and password on the first run and securely saves tokens to iCloud Drive.
  - **Silent Token Refresh**: Automatically detects expired access tokens (~1 hour) and refreshes them in the background without user intervention.
  - **Daily Odometer Logging**: Prompt for vehicle, date, and reading with decimal support (automatically updates if an entry already exists for that date).
  - **Fuel Fill-Up Logging**: Prompt for vehicle, date, fill odometer, volume, total cost, and full/partial tank status.
- **Voice & Widget Ready**: Add it to your iPhone Home Screen, assign it to the Action Button, or activate it by saying *"Hey Siri, GaugeIQ"*.
- **In-App Guide**: Accessible at `/shortcuts` or via the top navigation bar.

### 🚗 Multi-Vehicle Management
- Track multiple two-wheelers and four-wheelers simultaneously.
- Set fuel tank capacity, fuel type (petrol, diesel, CNG, EV), registration number, and make/model.
- Edit vehicle details and tank specifications anytime.

### 📖 History & Timeline
- Combined chronological feed of daily odometer checks and fuel fill-ups.
- Edit or delete historical entries.
- Search, filter by vehicle, and export entire datasets to CSV for offline analysis.

### 🗺️ Trips & Expense Tracking
- Log dedicated road trips and daily commutes with start/end odometer readings, fuel used, and trip costs.
- Automatically calculates efficiency and expenditure per trip.

### ⚙️ Preferences & Personalization
- **Units**: Distance (`km` or `mi`), Fuel (`L` or `gal`), Emissions (`kg` or `lbs`).
- **Currency**: Multiple currency symbols supported (`INR ₹`, `USD $`, `EUR €`, `GBP £`, etc.).
- **Theme**: Seamless Light / Dark mode with custom HSL glassmorphism design tokens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with Glassmorphism System |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & SSR Auth) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Apple Shortcuts Architecture

```text
               GaugeIQ Shortcut
                      │
                      ▼
              Check saved token
                      │
           ┌──────────┴──────────┐
      Token exists            No token (1st run)
           │                     │
           │              Ask email / password
           │                     │
           │                  Login API
           │                     │
           │              Save new tokens
           │                     │
           └──────────┬──────────┘
                      │
                      ▼
             Try to get vehicles
                      │
                      ▼
               Does it work?
                 /        \
              YES          NO (Token expired)
               │            │
               │       Refresh token API
               │            │
               │       Save new tokens
               │            │
               │       Re-fetch vehicles
               \            /
                      ▼
            What do you want to record?
           ┌──────────┴──────────┐
           │                     │
     🚗 Odometer           ⛽ Fuel Fill-Up
           │                     │
        Vehicle               Vehicle
           │                     │
         Date                  Date
           │                     │
        Reading           Odometer at fill
           │                     │
           │                Fuel volume
           │                     │
           │                 Fuel cost
           │                     │
           │              Full / Partial
           └──────────┬──────────┘
                      │
                      ▼
                 GaugeIQ API
                      │
                      ▼
                 Show Result
```

### Shortcuts API Endpoints

All endpoints support JSON payloads and Bearer token authentication:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/shortcuts/auth` | Login with email and password → returns access & refresh tokens |
| `POST` | `/api/shortcuts/auth/refresh` | Exchange a `refresh_token` for a fresh `access_token` |
| `GET` | `/api/shortcuts/vehicles` | Returns user's registered vehicles (`id`, `name`) |
| `POST` | `/api/shortcuts/odometer` | Upsert daily odometer reading (updates in-place if date matches) |
| `POST` | `/api/shortcuts/fuel` | Record fuel fill-up with volume, cost, and full/partial tank status |

---

## Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/microdoomz/GaugeIQ.git
cd GaugeIQ/gaugeiq
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
npm start
```

---

## Database Schema (Supabase)

GaugeIQ uses PostgreSQL with Row Level Security (RLS) enabled across all tables:

- **`profiles`**: User preferences (currency, units, theme, reminders, display name).
- **`vehicles`**: Vehicle registry (`make`, `model`, `tank_capacity`, `initial_odometer`, `fuel_type`).
- **`daily_odometer_entries`**: Daily odometer checkpoints (`vehicle_id`, `date`, `reading`).
- **`fuel_entries`**: Fuel fill-ups (`vehicle_id`, `date`, `odometer_at_fill`, `fuel_volume`, `total_cost`, `is_full_tank`).
- **`trips`**: Long-distance or special trip logs (`vehicle_id`, `start_date`, `end_date`, `start_odometer`, `end_odometer`, `cost`).

---

## Contributing & License

Contributions, issues, and feature requests are welcome!  
GaugeIQ is privately maintained by [@microdoomz](https://github.com/microdoomz).
