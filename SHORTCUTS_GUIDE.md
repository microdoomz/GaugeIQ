# GaugeIQ — Apple Shortcuts Setup Guide

This guide walks you through creating an Apple Shortcut that lets you quickly record **daily odometer readings** and **fuel fill-ups** directly from your iPhone, iPad, or Mac — no need to open the web app.

---

## Prerequisites

- Your GaugeIQ app URL: `https://gauge-iq.vercel.app`
- You need at least one vehicle already added in the GaugeIQ web app
- You need your GaugeIQ login email and password

---

## Part 1: Create the "GaugeIQ Login" Shortcut (One-Time Setup)

This shortcut authenticates you and saves your tokens for future use.

### Steps:

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** to create a new Shortcut
3. Name it **"GaugeIQ Login"**

#### Add these actions in order:

**Action 1 — Ask for Email**
- Add: **Ask for Input** → Type: Text → Prompt: `Enter your GaugeIQ email`
- Add: **Set Variable** → Name: `email` → to **Provided Input**

**Action 2 — Ask for Password**
- Add: **Ask for Input** → Type: Text → Prompt: `Enter your GaugeIQ password`
- Add: **Set Variable** → Name: `password` → to **Provided Input**

**Action 3 — Login API Call**
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/auth`
  - Method: **POST**
  - Headers: `Content-Type` = `application/json`
  - Request Body: **JSON**
    ```json
    {
      "email": email,
      "password": password
    }
    ```
    *(Use the Magic Variables for `email` and `password`)*

**Action 4 — Check Success**
- Add: **Get Dictionary Value** → Key: `success` → from **Contents of URL**
- Add: **If** → `success` **equals** `1` (or `true`)

**Action 5 — Save Tokens (inside the If)**
- Add: **Get Dictionary Value** → Key: `access_token` → from **Contents of URL**
- Add: **Save to File** → save to: `Shortcuts/GaugeIQ/access_token.txt` *(iCloud Drive)*
- Add: **Get Dictionary Value** → Key: `refresh_token` → from **Contents of URL**
- Add: **Save to File** → save to: `Shortcuts/GaugeIQ/refresh_token.txt` *(iCloud Drive)*
- Add: **Show Alert** → `✅ Login successful! Tokens saved.`

**Action 6 — Error (Otherwise block)**
- Add: **Get Dictionary Value** → Key: `error` → from **Contents of URL**
- Add: **Show Alert** → `❌ Login failed: [error]`

**Run this shortcut once** to save your tokens. You won't need to run it again unless your refresh token expires.

---

## Part 2: Create the "GaugeIQ Token Refresh" Shortcut

This shortcut refreshes your access token when it expires (every ~1 hour).

### Steps:

1. Create a new Shortcut named **"GaugeIQ Refresh Token"**

**Action 1 — Read Refresh Token**
- Add: **Get File** → `Shortcuts/GaugeIQ/refresh_token.txt`
- Add: **Get Text from Input**
- Add: **Set Variable** → Name: `refresh_token`

**Action 2 — Refresh API Call**
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/auth/refresh`
  - Method: **POST**
  - Headers: `Content-Type` = `application/json`
  - Request Body: **JSON**
    ```json
    {
      "refresh_token": refresh_token
    }
    ```

**Action 3 — Save New Tokens**
- Add: **Get Dictionary Value** → Key: `success`
- Add: **If** → equals `1`
  - **Get Dictionary Value** → Key: `access_token` → **Save to File** → `Shortcuts/GaugeIQ/access_token.txt` (replace existing)
  - **Get Dictionary Value** → Key: `refresh_token` → **Save to File** → `Shortcuts/GaugeIQ/refresh_token.txt` (replace existing)

---

## Part 3: Create the Main "GaugeIQ Log" Shortcut

This is the shortcut you'll use daily.

### Steps:

1. Create a new Shortcut named **"GaugeIQ Log"**

#### Action 1 — Read Access Token
- Add: **Get File** → `Shortcuts/GaugeIQ/access_token.txt`
- Add: **Get Text from Input**
- Add: **Set Variable** → Name: `token`

#### Action 2 — Fetch Vehicles
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/vehicles`
  - Method: **GET**
  - Headers:
    - `Authorization` = `Bearer [token]` *(use the token variable)*

- Add: **Get Dictionary Value** → Key: `success`
- Add: **If** → does NOT equal `1`:
  - **Run Shortcut** → `GaugeIQ Refresh Token`
  - Re-read the token file and re-fetch vehicles
  *(This handles automatic token refresh)*

#### Action 3 — Parse Vehicle List
- Add: **Get Dictionary Value** → Key: `vehicles` → from **Contents of URL**
- Add: **Set Variable** → Name: `vehicleList`

#### Action 4 — Main Menu
- Add: **Choose from Menu**
  - Prompt: `What do you want to record?`
  - Options:
    - `🚗 Daily Odometer`
    - `⛽ Fuel Fill-Up`

---

### Menu Option 1: 🚗 Daily Odometer

**Step A — Choose Vehicle**
- Add: **Choose from List** → from `vehicleList`
  - *(This will show vehicle names like "Honda Activa")*
- Add: **Get Dictionary Value** → Key: `id` → from **Chosen Item**
- Add: **Set Variable** → Name: `vehicle_id`

**Step B — Date**
- Add: **Date** → (defaults to Current Date)
- Add: **Ask for Input** → Type: Date → Prompt: `Date for this reading` → Default: **Current Date**
- Add: **Format Date** → Format: `yyyy-MM-dd` (Custom, ISO 8601)
- Add: **Set Variable** → Name: `date`

**Step C — Odometer Reading**
- Add: **Ask for Input** → Type: **Number** → Prompt: `Enter odometer reading` → Allow Decimals: ✅
- Add: **Set Variable** → Name: `reading`

**Step D — Save to GaugeIQ**
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/odometer`
  - Method: **POST**
  - Headers:
    - `Authorization` = `Bearer [token]`
    - `Content-Type` = `application/json`
  - Request Body: **JSON**
    ```json
    {
      "vehicle_id": vehicle_id,
      "date": date,
      "odometerReading": reading
    }
    ```

**Step E — Show Result**
- Add: **Get Dictionary Value** → Key: `message` → from **Contents of URL**
- Add: **Show Alert** → `[message]`
  *(Will show: "✅ Odometer reading of 12345.6 saved for 2024-01-15." or "✅ Odometer updated to 12345.6 for 2024-01-15.")*

---

### Menu Option 2: ⛽ Fuel Fill-Up

**Step A — Choose Vehicle**
- Same as Odometer Step A above

**Step B — Date**
- Same as Odometer Step B above

**Step C — Odometer at Fill**
- Add: **Ask for Input** → Type: **Number** → Prompt: `Odometer reading at fill` → Allow Decimals: ✅
- Add: **Set Variable** → Name: `odometerAtFill`

**Step D — Fuel Volume**
- Add: **Ask for Input** → Type: **Number** → Prompt: `Fuel volume (litres)` → Allow Decimals: ✅
- Add: **Set Variable** → Name: `fuelVolume`

**Step E — Fuel Cost**
- Add: **Ask for Input** → Type: **Number** → Prompt: `Total fuel cost (₹)` → Allow Decimals: ✅
- Add: **Set Variable** → Name: `totalCost`

**Step F — Full Tank or Partial?**
- Add: **Choose from Menu**
  - Prompt: `Was this a full tank?`
  - Options:
    - `Full Tank`
    - `Partial Fill`
- For "Full Tank": **Set Variable** → Name: `isFullTank` → to **true**
- For "Partial Fill": **Set Variable** → Name: `isFullTank` → to **false**

**Step G — Save to GaugeIQ**
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/fuel`
  - Method: **POST**
  - Headers:
    - `Authorization` = `Bearer [token]`
    - `Content-Type` = `application/json`
  - Request Body: **JSON**
    ```json
    {
      "vehicle_id": vehicle_id,
      "date": date,
      "odometerAtFill": odometerAtFill,
      "fuelVolume": fuelVolume,
      "totalCost": totalCost,
      "isFullTank": isFullTank
    }
    ```

**Step H — Show Result**
- Add: **Get Dictionary Value** → Key: `message` → from **Contents of URL**
- Add: **Show Alert** → `[message]`
  *(Will show: "⛽ Full tank: 3.2L at ₹350 saved for 2024-01-15.")*

---

## API Reference (for curl testing)

All curl commands use the production endpoint: `https://gauge-iq.vercel.app`.

### Login
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

### Refresh Token
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"your_refresh_token_here"}'
```

### List Vehicles
```bash
curl https://gauge-iq.vercel.app/api/shortcuts/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Add/Update Odometer
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/odometer \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"uuid","date":"2024-01-15","odometerReading":12345.6}'
```

### Add Fuel Fill-Up
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/fuel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"uuid","date":"2024-01-15","odometerAtFill":12345.6,"fuelVolume":3.2,"totalCost":350,"isFullTank":true}'
```

---

## Tips

- **Token expires after ~1 hour.** The main shortcut automatically refreshes it, so you usually won't notice.
- **If everything fails**, just re-run the "GaugeIQ Login" shortcut to get fresh tokens.
- **Editing an odometer reading**: Just run the odometer flow again for the same date — it will update the existing entry automatically.
- **All data goes to the same database** as the web app. You'll see your Shortcut-added entries on the Dashboard, History, and Logs pages immediately.
