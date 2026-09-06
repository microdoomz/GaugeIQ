# GaugeIQ — Apple Shortcuts All-in-One Setup Guide

This guide walks you through setting up a **single, unified Apple Shortcut** named **"GaugeIQ"** that handles everything:
1. **Automatic Login**: Prompts for credentials only on the very first run and securely saves tokens to iCloud Drive.
2. **Silent Token Refresh**: Automatically detects expired tokens, refreshes them seamlessly in the background, and saves the new token.
3. **Daily Odometer Logging**: Prompt for vehicle, date, and reading with decimal support (automatically updates if an entry already exists for that date).
4. **Fuel Fill-Up Logging**: Prompt for vehicle, date, fill odometer, volume, total cost, and full/partial tank status.

You only build and run **one single shortcut** on your iPhone, iPad, or Mac.

---

## The Workflow Architecture

```text
               GaugeIQ Shortcut
                      │
                      ▼
              Check saved token
                      │
           ┌──────────┴──────────┐
      Token exists            No token
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

---

## Prerequisites

- Live App URL: `https://gauge-iq.vercel.app`
- At least one vehicle registered in GaugeIQ
- Your GaugeIQ login email and password

---

## Step-by-Step Shortcut Setup

Open the **Shortcuts** app on your iPhone / iPad / Mac, tap **+** to create a new Shortcut, and name it **"GaugeIQ"**.

### Section 1: Check Saved Token & First-Time Login

**Action 1 — Check for saved token**
- Add: **Get File from Folder**
  - Path: `Shortcuts/GaugeIQ/access_token.txt`
  - Error If Not Found: **Turn OFF**
- Add: **Get Text from Input**
- Add: **Set Variable** → Name: `token` → to **Text**

**Action 2 — If No Token (First-Time Run)**
- Add: **If** → `token` **does not have any value**:
  - Add: **Ask for Input** → Type: `Text` → Prompt: `Enter your GaugeIQ email`
  - Add: **Set Variable** → Name: `email`
  - Add: **Ask for Input** → Type: `Text` → Prompt: `Enter your GaugeIQ password`
  - Add: **Set Variable** → Name: `password`
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
  - Add: **Get Dictionary Value** → Key: `access_token` → from **Contents of URL**
  - Add: **Save to File** → Path: `Shortcuts/GaugeIQ/access_token.txt` (overwrite)
  - Add: **Set Variable** → Name: `token` → to `access_token`
  - Add: **Get Dictionary Value** → Key: `refresh_token` → from **Contents of URL**
  - Add: **Save to File** → Path: `Shortcuts/GaugeIQ/refresh_token.txt` (overwrite)
- Add: **End If**

---

### Section 2: Fetch Vehicles & Silent Auto-Refresh

**Action 3 — Try to Fetch Vehicles**
- Add: **Get Contents of URL**
  - URL: `https://gauge-iq.vercel.app/api/shortcuts/vehicles`
  - Method: **GET**
  - Headers: `Authorization` = `Bearer [token]`

**Action 4 — Verify Token & Auto-Refresh if Expired**
- Add: **Get Dictionary Value** → Key: `success` → from **Contents of URL**
- Add: **If** → `success` **does NOT equal** `1` *(Token is expired)*:
  - Add: **Get File from Folder** → Path: `Shortcuts/GaugeIQ/refresh_token.txt`
  - Add: **Get Text from Input**
  - Add: **Set Variable** → Name: `saved_refresh_token`
  - Add: **Get Contents of URL**
    - URL: `https://gauge-iq.vercel.app/api/shortcuts/auth/refresh`
    - Method: **POST**
    - Headers: `Content-Type` = `application/json`
    - Request Body: **JSON**
      ```json
      {
        "refresh_token": saved_refresh_token
      }
      ```
  - Add: **Get Dictionary Value** → Key: `access_token` → from **Contents of URL**
  - Add: **Save to File** → Path: `Shortcuts/GaugeIQ/access_token.txt` (overwrite)
  - Add: **Set Variable** → Name: `token` → to new `access_token`
  - Add: **Get Dictionary Value** → Key: `refresh_token` → from **Contents of URL**
  - Add: **Save to File** → Path: `Shortcuts/GaugeIQ/refresh_token.txt` (overwrite)
  - Add: **Get Contents of URL** *(re-fetch vehicles with fresh token)*
    - URL: `https://gauge-iq.vercel.app/api/shortcuts/vehicles`
    - Method: **GET**
    - Headers: `Authorization` = `Bearer [token]`
- Add: **End If**

**Action 5 — Store Vehicles List**
- Add: **Get Dictionary Value** → Key: `vehicles` → from **Contents of URL**
- Add: **Set Variable** → Name: `vehicleList`

---

### Section 3: Main Menu Prompt

**Action 6 — Menu Selection**
- Add: **Choose from Menu**
  - Prompt: `What to record?`
  - Option 1: `🚗 Odometer`
  - Option 2: `⛽ Fuel Fill-Up`

---

### Branch 1: 🚗 Odometer

Inside the `🚗 Odometer` block:

1. **Select Vehicle**:
   - Add: **Choose from List** → from `vehicleList`
   - Add: **Get Dictionary Value** → Key: `id` → from **Chosen Item**
   - Add: **Set Variable** → Name: `vehicle_id`
2. **Select Date**:
   - Add: **Date** (Current Date)
   - Add: **Ask for Input** → Type: `Date` → Prompt: `Date for this reading` → Default: **Current Date**
   - Add: **Format Date** → Format: `yyyy-MM-dd`
   - Add: **Set Variable** → Name: `date`
3. **Odometer Reading**:
   - Add: **Ask for Input** → Type: `Number` → Prompt: `Enter odometer reading` → Allow Decimals: ✅
   - Add: **Set Variable** → Name: `reading`
4. **Send to GaugeIQ**:
   - Add: **Get Contents of URL**
     - URL: `https://gauge-iq.vercel.app/api/shortcuts/odometer`
     - Method: **POST**
     - Headers:
       - `Authorization`: `Bearer [token]`
       - `Content-Type`: `application/json`
     - Request Body: **JSON**
       ```json
       {
         "vehicle_id": vehicle_id,
         "date": date,
         "odometerReading": reading
       }
       ```
5. **Show Result Alert**:
   - Add: **Get Dictionary Value** → Key: `message` → from **Contents of URL**
   - Add: **Show Alert** → `[message]`

---

### Branch 2: ⛽ Fuel Fill-Up

Inside the `⛽ Fuel Fill-Up` block:

1. **Select Vehicle**:
   - Same as above (Choose from `vehicleList` → `vehicle_id`)
2. **Select Date**:
   - Same as above (Ask for Date → format `yyyy-MM-dd` → `date`)
3. **Odometer at Fill**:
   - Add: **Ask for Input** → Type: `Number` → Prompt: `Odometer reading at fill` → Allow Decimals: ✅
   - Add: **Set Variable** → Name: `odometerAtFill`
4. **Fuel Volume**:
   - Add: **Ask for Input** → Type: `Number` → Prompt: `Fuel volume (litres)` → Allow Decimals: ✅
   - Add: **Set Variable** → Name: `fuelVolume`
5. **Fuel Cost**:
   - Add: **Ask for Input** → Type: `Number` → Prompt: `Total fuel cost (₹)` → Allow Decimals: ✅
   - Add: **Set Variable** → Name: `totalCost`
6. **Full / Partial Tank**:
   - Add: **Choose from Menu** → Prompt: `Was this a full tank?`
     - Option: `Full Tank` → **Set Variable** `isFullTank` to `true`
     - Option: `Partial Fill` → **Set Variable** `isFullTank` to `false`
7. **Send to GaugeIQ**:
   - Add: **Get Contents of URL**
     - URL: `https://gauge-iq.vercel.app/api/shortcuts/fuel`
     - Method: **POST**
     - Headers:
       - `Authorization`: `Bearer [token]`
       - `Content-Type`: `application/json`
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
8. **Show Result Alert**:
   - Add: **Get Dictionary Value** → Key: `message` → from **Contents of URL**
   - Add: **Show Alert** → `[message]`

---

## API Reference (Testing via cURL)

All endpoints run on `https://gauge-iq.vercel.app`:

### 1. Login
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

### 2. Silent Token Refresh
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"your_refresh_token_here"}'
```

### 3. List Vehicles
```bash
curl https://gauge-iq.vercel.app/api/shortcuts/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Add / Update Odometer (Upsert)
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/odometer \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerReading":12345.6}'
```

### 5. Add Fuel Fill-Up
```bash
curl -X POST https://gauge-iq.vercel.app/api/shortcuts/fuel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerAtFill":12345.6,"fuelVolume":3.2,"totalCost":350,"isFullTank":true}'
```

---

## Tips & Benefits of the All-in-One Shortcut

- **Zero Maintenance**: You never have to manually open or run helper shortcuts.
- **Silent Refresh**: Whenever the access token expires (~1 hour), it refreshes behind the scenes and updates the iCloud file automatically.
- **Safe Upserts**: Logging an odometer reading for a date that already has an entry automatically updates it without duplicates.
- **Instant Cloud Sync**: Entries immediately appear on the GaugeIQ Dashboard, History, and Logs pages.
