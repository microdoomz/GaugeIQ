"use client";

import React, { useState } from "react";
import clsx from "classnames";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))]/80 transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500 font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>{label ?? "Copy"}</span>
        </>
      )}
    </button>
  );
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="relative my-2 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
      {title && (
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-3 py-1.5 text-xs text-[hsl(var(--foreground))]/70 font-mono">
          <span>{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      {!title && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={code} />
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs font-mono text-[hsl(var(--foreground))]/90 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export function ShortcutsGuideClient() {
  const [activeTab, setActiveTab] = useState<"flow" | "guide" | "api" | "tips">("guide");

  const tabs = [
    { id: "guide", label: "📱 Setup Guide (All-in-One)" },
    { id: "flow", label: "🗺️ Flowchart & Architecture" },
    { id: "api", label: "⚡ cURL API Reference" },
    { id: "tips", label: "💡 Tips & FAQ" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-5 border-l-4 border-l-[hsl(var(--primary))] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <span>⚡</span> One Shortcut to Rule Everything
            </h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70 mt-0.5">
              No multiple shortcuts needed. A single <strong>&quot;GaugeIQ&quot;</strong> shortcut handles first-time login, silent token refresh, daily odometer updates, and fuel fill-ups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--foreground))]/60">Endpoint:</span>
            <code className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono font-semibold text-[hsl(var(--primary))]">
              https://gauge-iq.vercel.app
            </code>
            <CopyButton text="https://gauge-iq.vercel.app" label="Copy URL" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[hsl(var(--border))] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] font-semibold"
                : "text-[hsl(var(--foreground))]/70 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FLOWCHART & ARCHITECTURE */}
      {activeTab === "flow" && (
        <section className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[hsl(var(--border))] pb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>🔄</span> Complete Shortcut Execution Flow
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                100% Supported by Backend
              </span>
            </div>
            <p className="text-sm text-[hsl(var(--foreground))]/75">
              The shortcut intelligently checks for your saved credentials, refreshes tokens when expired without annoying password prompts, and routes to your chosen action:
            </p>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6 overflow-x-auto">
              <pre className="font-mono text-xs sm:text-sm text-[hsl(var(--foreground))]/90 leading-relaxed whitespace-pre">
{`               GaugeIQ Shortcut
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
                 /        \\
              YES          NO (Token expired)
               │            │
               │       Refresh token API
               │            │
               │       Save new tokens
               │            │
               │       Re-fetch vehicles
               \\            /
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
                 Show Result`}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: STEP-BY-STEP GUIDE */}
      {activeTab === "guide" && (
        <section className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="border-b border-[hsl(var(--border))] pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📱</span> Build the &quot;GaugeIQ&quot; All-in-One Shortcut
                </h2>
                <span className="rounded-full bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
                  Only 1 Shortcut Needed
                </span>
              </div>
              <p className="mt-1 text-sm text-[hsl(var(--foreground))]/75">
                Follow these steps inside the <strong>Shortcuts</strong> app on iOS / iPadOS / macOS.
              </p>
            </div>

            {/* SECTION A */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--primary))]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-xs font-bold">A</span>
                Step 1: Saved Token Check &amp; First-Time Login
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Checks if you already logged in. If not, prompts for your credentials once and saves the tokens to iCloud Drive.
              </p>

              <div className="grid gap-3">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">Action 1</span>
                    <span>Read saved access token</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[hsl(var(--foreground))]/80 pl-1">
                    <li>Add: <strong>Get File from Folder</strong> → Path: <code className="font-mono text-[hsl(var(--primary))]">Shortcuts/GaugeIQ/access_token.txt</code> (Toggle <em>&quot;Error If Not Found&quot;</em> to <strong>OFF</strong>)</li>
                    <li>Add: <strong>Get Text from Input</strong></li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">token</code> → to <strong>Text</strong></li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">Action 2</span>
                    <span>If no token exists (First-time setup only)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[hsl(var(--foreground))]/80 pl-1">
                    <li>Add: <strong>If</strong> → <code className="font-mono">token</code> <strong>does not have any value</strong>:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li><strong>Ask for Input</strong> (Text) → Prompt: <code className="font-mono">Enter your GaugeIQ email</code> → <strong>Set Variable</strong> <code className="font-mono">email</code></li>
                        <li><strong>Ask for Input</strong> (Text) → Prompt: <code className="font-mono">Enter your GaugeIQ password</code> → <strong>Set Variable</strong> <code className="font-mono">password</code></li>
                        <li><strong>Get Contents of URL</strong>:
                          <div className="pl-4 mt-1 font-mono text-xs">
                            URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/auth</code><br/>
                            Method: <strong>POST</strong><br/>
                            Headers: <code className="text-[hsl(var(--primary))]">Content-Type: application/json</code>
                          </div>
                          <CodeBlock
                            code={`{\n  "email": email,\n  "password": password\n}`}
                            title="JSON Body"
                          />
                        </li>
                        <li><strong>Get Dictionary Value</strong> <code className="font-mono">access_token</code> → <strong>Save to File</strong> → <code className="font-mono">Shortcuts/GaugeIQ/access_token.txt</code> (overwrite)</li>
                        <li><strong>Set Variable</strong> <code className="font-mono">token</code> → to <code className="font-mono">access_token</code></li>
                        <li><strong>Get Dictionary Value</strong> <code className="font-mono">refresh_token</code> → <strong>Save to File</strong> → <code className="font-mono">Shortcuts/GaugeIQ/refresh_token.txt</code> (overwrite)</li>
                      </ul>
                    </li>
                    <li>Add: <strong>End If</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION B */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--primary))]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-xs font-bold">B</span>
                Step 2: Fetch Vehicles &amp; Silent Auto-Refresh
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Tries fetching your vehicle list. If your access token has expired, it automatically calls the refresh API and saves fresh tokens seamlessly.
              </p>

              <div className="grid gap-3">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="font-semibold flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">Action 3</span>
                      <span>Fetch Vehicles</span>
                    </div>
                    <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">GET</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[hsl(var(--foreground))]/80 pl-1">
                    <li>Add: <strong>Get Contents of URL</strong>
                      <div className="pl-4 mt-1 font-mono text-xs">
                        URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/vehicles</code><br/>
                        Method: <strong>GET</strong><br/>
                        Headers: <code className="text-[hsl(var(--primary))]">Authorization: Bearer [token]</code>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="font-semibold flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">Action 4</span>
                      <span>Silent Refresh Check</span>
                    </div>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">POST /refresh</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[hsl(var(--foreground))]/80 pl-1">
                    <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono text-[hsl(var(--primary))]">success</code> → from Contents of URL</li>
                    <li>Add: <strong>If</strong> → <code className="font-mono">success</code> <strong>does NOT equal</strong> <code className="font-mono">1</code>:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li><strong>Get File from Folder</strong> → Path: <code className="font-mono">Shortcuts/GaugeIQ/refresh_token.txt</code> → <strong>Get Text from Input</strong> → <strong>Set Variable</strong> <code className="font-mono">saved_refresh_token</code></li>
                        <li><strong>Get Contents of URL</strong>:
                          <div className="pl-4 mt-1 font-mono text-xs">
                            URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/auth/refresh</code><br/>
                            Method: <strong>POST</strong><br/>
                            Headers: <code className="text-[hsl(var(--primary))]">Content-Type: application/json</code>
                          </div>
                          <CodeBlock
                            code={`{\n  "refresh_token": saved_refresh_token\n}`}
                            title="JSON Body"
                          />
                        </li>
                        <li><strong>Get Dictionary Value</strong> <code className="font-mono">access_token</code> → <strong>Save to File</strong> → <code className="font-mono">Shortcuts/GaugeIQ/access_token.txt</code> (overwrite)</li>
                        <li><strong>Set Variable</strong> <code className="font-mono">token</code> → to new <code className="font-mono">access_token</code></li>
                        <li><strong>Get Dictionary Value</strong> <code className="font-mono">refresh_token</code> → <strong>Save to File</strong> → <code className="font-mono">Shortcuts/GaugeIQ/refresh_token.txt</code> (overwrite)</li>
                        <li><strong>Get Contents of URL</strong> <em>(re-fetch vehicles)</em>:
                          <div className="pl-4 mt-1 font-mono text-xs">
                            URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/vehicles</code><br/>
                            Method: <strong>GET</strong><br/>
                            Headers: <code className="text-[hsl(var(--primary))]">Authorization: Bearer [token]</code>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li>Add: <strong>End If</strong></li>
                    <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono">vehicles</code> → <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">vehicleList</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION C */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--primary))]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-xs font-bold">C</span>
                Step 3: Main Action Menu &amp; Recording
              </h3>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs sm:text-sm space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">Action 5</span>
                  <span>Menu Prompt</span>
                </div>
                <p className="text-[hsl(var(--foreground))]/80">
                  Add: <strong>Choose from Menu</strong> → Prompt: <code className="font-mono text-[hsl(var(--primary))]">What to record?</code>
                </p>
                <div className="flex gap-2 font-mono">
                  <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    🚗 Odometer
                  </span>
                  <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    ⛽ Fuel Fill-Up
                  </span>
                </div>
              </div>

              {/* Branch 1: Odometer */}
              <div className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/[0.02] p-5 space-y-3">
                <h4 className="text-base font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span>🚗</span> Inside &quot;🚗 Odometer&quot; Menu Branch:
                </h4>
                <div className="space-y-2 text-xs sm:text-sm text-[hsl(var(--foreground))]/85">
                  <p>1. <strong>Choose Vehicle:</strong> Add <strong>Choose from List</strong> (from <code className="font-mono">vehicleList</code>) → <strong>Get Dictionary Value</strong> <code className="font-mono">id</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">vehicle_id</code></p>
                  <p>2. <strong>Select Date:</strong> Add <strong>Date</strong> (Current Date) → <strong>Ask for Input</strong> (Date, default Current Date) → <strong>Format Date</strong> (<code className="font-mono">yyyy-MM-dd</code>) → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">date</code></p>
                  <p>3. <strong>Enter Reading:</strong> Add <strong>Ask for Input</strong> (Number, Allow Decimals: ✅) → Prompt: <code className="font-mono">Enter odometer reading</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">reading</code></p>
                  <p>4. <strong>Send to GaugeIQ:</strong> Add <strong>Get Contents of URL</strong></p>
                  <div className="pl-4 font-mono text-xs">
                    URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/odometer</code><br/>
                    Method: <strong>POST</strong><br/>
                    Headers:
                    <code className="block pl-2">Authorization: Bearer [token]</code>
                    <code className="block pl-2">Content-Type: application/json</code>
                  </div>
                  <CodeBlock
                    code={`{\n  "vehicle_id": vehicle_id,\n  "date": date,\n  "odometerReading": reading\n}`}
                    title="JSON Body"
                  />
                  <p>5. <strong>Show Alert:</strong> Add <strong>Get Dictionary Value</strong> <code className="font-mono">message</code> → <strong>Show Alert</strong> <code className="font-mono">[message]</code></p>
                </div>
              </div>

              {/* Branch 2: Fuel */}
              <div className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/[0.02] p-5 space-y-3">
                <h4 className="text-base font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span>⛽</span> Inside &quot;⛽ Fuel Fill-Up&quot; Menu Branch:
                </h4>
                <div className="space-y-2 text-xs sm:text-sm text-[hsl(var(--foreground))]/85">
                  <p>1. <strong>Choose Vehicle &amp; Date:</strong> Same as above (select vehicle and formatted <code className="font-mono">yyyy-MM-dd</code> date).</p>
                  <p>2. <strong>Odometer at Fill:</strong> Add <strong>Ask for Input</strong> (Number, Decimals: ✅) → Prompt: <code className="font-mono">Odometer reading at fill</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">odometerAtFill</code></p>
                  <p>3. <strong>Fuel Volume:</strong> Add <strong>Ask for Input</strong> (Number, Decimals: ✅) → Prompt: <code className="font-mono">Fuel volume (litres)</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">fuelVolume</code></p>
                  <p>4. <strong>Fuel Cost:</strong> Add <strong>Ask for Input</strong> (Number, Decimals: ✅) → Prompt: <code className="font-mono">Total fuel cost (₹)</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">totalCost</code></p>
                  <p>5. <strong>Full or Partial:</strong> Add <strong>Choose from Menu</strong>:
                    <span className="block pl-4 text-xs font-mono mt-0.5">Option &quot;Full Tank&quot; → Set Variable <code className="text-green-500 font-bold">isFullTank = true</code></span>
                    <span className="block pl-4 text-xs font-mono">Option &quot;Partial Fill&quot; → Set Variable <code className="text-amber-500 font-bold">isFullTank = false</code></span>
                  </p>
                  <p>6. <strong>Send to GaugeIQ:</strong> Add <strong>Get Contents of URL</strong></p>
                  <div className="pl-4 font-mono text-xs">
                    URL: <code className="text-[hsl(var(--primary))]">https://gauge-iq.vercel.app/api/shortcuts/fuel</code><br/>
                    Method: <strong>POST</strong><br/>
                    Headers:
                    <code className="block pl-2">Authorization: Bearer [token]</code>
                    <code className="block pl-2">Content-Type: application/json</code>
                  </div>
                  <CodeBlock
                    code={`{\n  "vehicle_id": vehicle_id,\n  "date": date,\n  "odometerAtFill": odometerAtFill,\n  "fuelVolume": fuelVolume,\n  "totalCost": totalCost,\n  "isFullTank": isFullTank\n}`}
                    title="JSON Body"
                  />
                  <p>7. <strong>Show Alert:</strong> Add <strong>Get Dictionary Value</strong> <code className="font-mono">message</code> → <strong>Show Alert</strong> <code className="font-mono">[message]</code></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: API REFERENCE */}
      {activeTab === "api" && (
        <section className="glass-card p-6 space-y-6">
          <div className="border-b border-[hsl(var(--border))] pb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>⚡</span> cURL API Reference
            </h3>
            <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70 mt-1">
              Test every endpoint directly with cURL against <code>https://gauge-iq.vercel.app</code>:
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                <span>1. Auth Login</span>
              </div>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"you@example.com","password":"yourpassword"}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                <span>2. Token Refresh</span>
              </div>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth/refresh \\\n  -H "Content-Type: application/json" \\\n  -d '{"refresh_token":"your_refresh_token_here"}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">GET</span>
                <span>3. List Vehicles</span>
              </div>
              <CodeBlock
                code={`curl https://gauge-iq.vercel.app/api/shortcuts/vehicles \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                <span>4. Upsert Odometer Reading</span>
              </div>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/odometer \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerReading":12345.6}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                <span>5. Record Fuel Fill-Up</span>
              </div>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/fuel \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerAtFill":12345.6,"fuelVolume":3.2,"totalCost":350,"isFullTank":true}'`}
              />
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: TIPS & FAQ */}
      {activeTab === "tips" && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[hsl(var(--border))] pb-3">
            <span className="text-xl">💡</span>
            <h3 className="text-lg font-semibold">Tips &amp; Best Practices</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-[hsl(var(--foreground))]/85">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h4 className="font-semibold text-sm">🏎️ Home Screen &amp; Action Button</h4>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                You can add the &quot;GaugeIQ&quot; shortcut as an icon to your iOS Home Screen, set it to your iPhone Action Button, or say <em>&quot;Hey Siri, GaugeIQ&quot;</em> to log readings in 5 seconds.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h4 className="font-semibold text-sm">🔄 Automatic Silent Refresh</h4>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                When your access token expires after 1 hour, Action 4 catches it, refreshes it using the saved refresh token, saves the new token to iCloud, and re-executes seamlessly.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h4 className="font-semibold text-sm">✏️ Safe Odometer Updates</h4>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                If you made a typo or entered an incorrect reading for today, just trigger the shortcut again with the right number. The API safely updates today&apos;s record in place.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h4 className="font-semibold text-sm">☁️ Instant Database Synchronization</h4>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Data recorded via Shortcuts goes straight into your authenticated Supabase database. You&apos;ll see updated metrics on your Dashboard and History immediately.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
