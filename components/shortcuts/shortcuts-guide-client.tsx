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
  const [activeTab, setActiveTab] = useState<"all" | "part1" | "part2" | "part3" | "api" | "tips">("all");

  const tabs = [
    { id: "all", label: "Full Guide" },
    { id: "part1", label: "Part 1: Login Setup" },
    { id: "part2", label: "Part 2: Refresh Token" },
    { id: "part3", label: "Part 3: Daily Log" },
    { id: "api", label: "cURL Testing" },
    { id: "tips", label: "Tips & FAQ" },
  ] as const;

  const showSection = (section: "part1" | "part2" | "part3" | "api" | "tips") => {
    return activeTab === "all" || activeTab === section;
  };

  return (
    <div className="space-y-8">
      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[hsl(var(--border))] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] font-semibold"
                : "text-[hsl(var(--foreground))]/70 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prerequisites Banner */}
      <div className="glass-card p-5 border-l-4 border-l-[hsl(var(--primary))] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>📋</span> Prerequisites
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--foreground))]/60">App Endpoint:</span>
            <code className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono font-semibold text-[hsl(var(--primary))]">
              https://gauge-iq.vercel.app
            </code>
            <CopyButton text="https://gauge-iq.vercel.app" label="Copy URL" />
          </div>
        </div>
        <ul className="grid gap-2 text-sm text-[hsl(var(--foreground))]/80 md:grid-cols-3">
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>App URL configured to <strong>https://gauge-iq.vercel.app</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>At least one vehicle added in GaugeIQ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Your GaugeIQ login email and password</span>
          </li>
        </ul>
      </div>

      {/* PART 1: LOGIN SHORTCUT */}
      {showSection("part1") && (
        <section className="glass-card p-6 space-y-6">
          <div className="border-b border-[hsl(var(--border))] pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-xs font-bold text-[hsl(var(--primary))]">
                  1
                </span>
                <h2 className="text-lg font-semibold">Part 1: Create the &quot;GaugeIQ Login&quot; Shortcut</h2>
              </div>
              <span className="rounded-full bg-[hsl(var(--primary))]/10 px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--primary))]">
                One-Time Setup
              </span>
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--foreground))]/70">
              This shortcut authenticates your account and securely saves your access and refresh tokens to iCloud Drive for future calls.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Initial steps in the iOS Shortcuts App:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[hsl(var(--foreground))]/80">
              <li>Open the <strong>Shortcuts</strong> app on your iPhone, iPad, or Mac.</li>
              <li>Tap <strong>+</strong> to create a new Shortcut.</li>
              <li>Rename it to <strong>&quot;GaugeIQ Login&quot;</strong>.</li>
            </ol>

            <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]/60">
              Add these actions in exact sequence:
            </h3>

            <div className="grid gap-3">
              {/* Action 1 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 1</span>
                  <span>Ask for Email</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Ask for Input</strong> → Type: <code className="text-[hsl(var(--primary))]">Text</code> → Prompt: <code className="text-[hsl(var(--primary))]">Enter your GaugeIQ email</code></li>
                  <li>Add: <strong>Set Variable</strong> → Name: <code className="text-[hsl(var(--primary))]">email</code> → to <strong>Provided Input</strong></li>
                </ul>
              </div>

              {/* Action 2 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 2</span>
                  <span>Ask for Password</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Ask for Input</strong> → Type: <code className="text-[hsl(var(--primary))]">Text</code> → Prompt: <code className="text-[hsl(var(--primary))]">Enter your GaugeIQ password</code></li>
                  <li>Add: <strong>Set Variable</strong> → Name: <code className="text-[hsl(var(--primary))]">password</code> → to <strong>Provided Input</strong></li>
                </ul>
              </div>

              {/* Action 3 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 3</span>
                    <span>Login API Call</span>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    POST
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-xs sm:text-sm text-[hsl(var(--foreground))]/80">
                  <p>Add action: <strong>Get Contents of URL</strong></p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>URL: <code className="text-[hsl(var(--primary))] font-mono">https://gauge-iq.vercel.app/api/shortcuts/auth</code></li>
                    <li>Method: <strong>POST</strong></li>
                    <li>Headers: Key <code className="font-mono">Content-Type</code> = Value <code className="font-mono">application/json</code></li>
                    <li>Request Body: <strong>JSON</strong></li>
                  </ul>
                  <CodeBlock
                    code={`{\n  "email": email,\n  "password": password\n}`}
                    title="JSON Body (select the Magic Variables for email & password)"
                  />
                </div>
              </div>

              {/* Action 4 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 4</span>
                  <span>Check Success</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">success</code> → from <strong>Contents of URL</strong></li>
                  <li>Add: <strong>If</strong> → <code className="font-mono">success</code> <strong>equals</strong> <code className="font-mono">1</code> (or <code className="font-mono">true</code>)</li>
                </ul>
              </div>

              {/* Action 5 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 5</span>
                  <span>Save Tokens (inside the &quot;If&quot; block)</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">access_token</code> → from <strong>Contents of URL</strong></li>
                  <li>Add: <strong>Save to File</strong> → Path: <code className="font-mono text-[hsl(var(--primary))]">Shortcuts/GaugeIQ/access_token.txt</code> <em>(iCloud Drive)</em></li>
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">refresh_token</code> → from <strong>Contents of URL</strong></li>
                  <li>Add: <strong>Save to File</strong> → Path: <code className="font-mono text-[hsl(var(--primary))]">Shortcuts/GaugeIQ/refresh_token.txt</code> <em>(iCloud Drive)</em></li>
                  <li>Add: <strong>Show Alert</strong> → <code className="font-mono">✅ Login successful! Tokens saved.</code></li>
                </ul>
              </div>

              {/* Action 6 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 6</span>
                  <span>Handle Error (inside the &quot;Otherwise&quot; block)</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">error</code> → from <strong>Contents of URL</strong></li>
                  <li>Add: <strong>Show Alert</strong> → <code className="font-mono">❌ Login failed: [error]</code></li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-[hsl(var(--primary))]/10 p-3 text-xs sm:text-sm text-[hsl(var(--foreground))]/80">
              💡 <strong>Run this shortcut once</strong> now! You will see the confirmation alert and your tokens will be safely stored in your iCloud Drive.
            </div>
          </div>
        </section>
      )}

      {/* PART 2: TOKEN REFRESH */}
      {showSection("part2") && (
        <section className="glass-card p-6 space-y-6">
          <div className="border-b border-[hsl(var(--border))] pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-xs font-bold text-[hsl(var(--primary))]">
                  2
                </span>
                <h2 className="text-lg font-semibold">Part 2: Create the &quot;GaugeIQ Refresh Token&quot; Shortcut</h2>
              </div>
              <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--foreground))]/80">
                Helper Shortcut
              </span>
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--foreground))]/70">
              Access tokens expire after ~1 hour for security. This shortcut exchanges your persistent refresh token for a fresh access token without asking for your password again.
            </p>
          </div>

          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-1 text-sm text-[hsl(var(--foreground))]/80">
              <li>Create a new Shortcut named <strong>&quot;GaugeIQ Refresh Token&quot;</strong>.</li>
            </ol>

            <div className="grid gap-3">
              {/* Action 1 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 1</span>
                  <span>Read Saved Refresh Token</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get File</strong> → Path: <code className="text-[hsl(var(--primary))] font-mono">Shortcuts/GaugeIQ/refresh_token.txt</code></li>
                  <li>Add: <strong>Get Text from Input</strong></li>
                  <li>Add: <strong>Set Variable</strong> → Name: <code className="text-[hsl(var(--primary))]">refresh_token</code></li>
                </ul>
              </div>

              {/* Action 2 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 2</span>
                    <span>Call Refresh API</span>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    POST
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-xs sm:text-sm text-[hsl(var(--foreground))]/80">
                  <p>Add action: <strong>Get Contents of URL</strong></p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>URL: <code className="text-[hsl(var(--primary))] font-mono">https://gauge-iq.vercel.app/api/shortcuts/auth/refresh</code></li>
                    <li>Method: <strong>POST</strong></li>
                    <li>Headers: Key <code className="font-mono">Content-Type</code> = Value <code className="font-mono">application/json</code></li>
                    <li>Request Body: <strong>JSON</strong></li>
                  </ul>
                  <CodeBlock
                    code={`{\n  "refresh_token": refresh_token\n}`}
                    title="JSON Body"
                  />
                </div>
              </div>

              {/* Action 3 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 3</span>
                  <span>Save New Tokens</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">success</code></li>
                  <li>Add: <strong>If</strong> → <code className="font-mono">success</code> equals <code className="font-mono">1</code>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      <li><strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">access_token</code> → <strong>Save to File</strong> → <code className="font-mono text-[hsl(var(--primary))]">Shortcuts/GaugeIQ/access_token.txt</code> (replace existing)</li>
                      <li><strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">refresh_token</code> → <strong>Save to File</strong> → <code className="font-mono text-[hsl(var(--primary))]">Shortcuts/GaugeIQ/refresh_token.txt</code> (replace existing)</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PART 3: MAIN LOGGING SHORTCUT */}
      {showSection("part3") && (
        <section className="glass-card p-6 space-y-6">
          <div className="border-b border-[hsl(var(--border))] pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-xs font-bold text-[hsl(var(--primary))]">
                  3
                </span>
                <h2 className="text-lg font-semibold">Part 3: Create the Main &quot;GaugeIQ Log&quot; Shortcut</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Daily Shortcut
              </span>
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--foreground))]/70">
              This is the shortcut you trigger from your Home Screen, widget, Siri, or Action Button to record odometer readings and fuel fill-ups.
            </p>
          </div>

          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-1 text-sm text-[hsl(var(--foreground))]/80">
              <li>Create a new Shortcut named <strong>&quot;GaugeIQ Log&quot;</strong>.</li>
            </ol>

            <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]/60">
              Setup Actions (Actions 1 to 4):
            </h3>

            <div className="grid gap-3">
              {/* Action 1 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 1</span>
                  <span>Read Access Token</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get File</strong> → <code className="text-[hsl(var(--primary))] font-mono">Shortcuts/GaugeIQ/access_token.txt</code></li>
                  <li>Add: <strong>Get Text from Input</strong></li>
                  <li>Add: <strong>Set Variable</strong> → Name: <code className="text-[hsl(var(--primary))]">token</code></li>
                </ul>
              </div>

              {/* Action 2 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 2</span>
                    <span>Fetch Vehicles &amp; Auto-Refresh</span>
                  </div>
                  <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    GET
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Contents of URL</strong>
                    <ul className="list-disc list-inside pl-4 space-y-1 text-xs">
                      <li>URL: <code className="text-[hsl(var(--primary))] font-mono">https://gauge-iq.vercel.app/api/shortcuts/vehicles</code></li>
                      <li>Method: <strong>GET</strong></li>
                      <li>Headers: Key <code className="font-mono">Authorization</code> = Value <code className="font-mono">Bearer [token]</code> <em>(variable)</em></li>
                    </ul>
                  </li>
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono">success</code></li>
                  <li>Add: <strong>If</strong> → <code className="font-mono">success</code> <strong>does NOT equal</strong> <code className="font-mono">1</code>:
                    <ul className="list-disc list-inside pl-4 space-y-0.5 text-xs text-[hsl(var(--foreground))]/70">
                      <li>Add: <strong>Run Shortcut</strong> → <code className="font-medium">GaugeIQ Refresh Token</code></li>
                      <li>Add: Re-read token from file and re-fetch vehicles <em>(automatic silent token refresh!)</em></li>
                    </ul>
                  </li>
                </ul>
              </div>

              {/* Action 3 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 3</span>
                  <span>Parse Vehicle List</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80 list-disc list-inside">
                  <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="text-[hsl(var(--primary))] font-mono">vehicles</code> → from <strong>Contents of URL</strong></li>
                  <li>Add: <strong>Set Variable</strong> → Name: <code className="text-[hsl(var(--primary))]">vehicleList</code></li>
                </ul>
              </div>

              {/* Action 4 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold">Action 4</span>
                  <span>Main Prompt Menu</span>
                </div>
                <div className="mt-2 space-y-1 text-xs sm:text-sm text-[hsl(var(--foreground))]/80">
                  <p>Add: <strong>Choose from Menu</strong></p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Prompt: <code className="text-[hsl(var(--primary))]">What do you want to record?</code></li>
                    <li>Option 1: <strong className="font-mono">🚗 Daily Odometer</strong></li>
                    <li>Option 2: <strong className="font-mono">⛽ Fuel Fill-Up</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sub-menu 1: Odometer */}
            <div className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-base font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <span>🚗</span> Option 1: Daily Odometer Flow
                </h4>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  POST /api/shortcuts/odometer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Inside the <strong>🚗 Daily Odometer</strong> branch of the menu, add the following steps:
              </p>

              <div className="grid gap-2.5 text-xs sm:text-sm">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step A — Choose Vehicle:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Choose from List</strong> → from <code className="font-mono">vehicleList</code></li>
                    <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono text-[hsl(var(--primary))]">id</code> → from <strong>Chosen Item</strong></li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">vehicle_id</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step B — Date:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Date</strong> → defaults to Current Date</li>
                    <li>Add: <strong>Ask for Input</strong> → Type: <code className="font-mono">Date</code> → Prompt: <code className="font-mono">Date for this reading</code> → Default: <strong>Current Date</strong></li>
                    <li>Add: <strong>Format Date</strong> → Format: <code className="font-mono text-[hsl(var(--primary))]">yyyy-MM-dd</code> <em>(ISO 8601)</em></li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">date</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step C — Odometer Reading:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Ask for Input</strong> → Type: <strong>Number</strong> → Prompt: <code className="font-mono">Enter odometer reading</code> → Allow Decimals: ✅</li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">reading</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step D — Save to GaugeIQ (API Call):</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-1">
                    <li>Add: <strong>Get Contents of URL</strong></li>
                    <li>URL: <code className="text-[hsl(var(--primary))] font-mono">https://gauge-iq.vercel.app/api/shortcuts/odometer</code></li>
                    <li>Method: <strong>POST</strong></li>
                    <li>Headers:
                      <code className="block pl-4 font-mono text-xs">Authorization: Bearer [token]</code>
                      <code className="block pl-4 font-mono text-xs">Content-Type: application/json</code>
                    </li>
                    <li>Request Body: <strong>JSON</strong></li>
                  </ul>
                  <CodeBlock
                    code={`{\n  "vehicle_id": vehicle_id,\n  "date": date,\n  "odometerReading": reading\n}`}
                    title="JSON Body"
                  />
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step E — Show Result Alert:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono text-[hsl(var(--primary))]">message</code> → from <strong>Contents of URL</strong></li>
                    <li>Add: <strong>Show Alert</strong> → <code className="font-mono">[message]</code></li>
                    <li className="text-xs text-[hsl(var(--foreground))]/60">Shows: <em>&quot;✅ Odometer reading of 12345.6 saved for 2024-01-15.&quot;</em> or <em>&quot;✅ Odometer updated to 12345.6 for 2024-01-15.&quot;</em></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sub-menu 2: Fuel */}
            <div className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-base font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <span>⛽</span> Option 2: Fuel Fill-Up Flow
                </h4>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  POST /api/shortcuts/fuel
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Inside the <strong>⛽ Fuel Fill-Up</strong> branch of the menu, add the following steps:
              </p>

              <div className="grid gap-2.5 text-xs sm:text-sm">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step A &amp; B — Choose Vehicle and Date:</strong>
                  <p className="text-xs text-[hsl(var(--foreground))]/70 mt-1">Same as Steps A &amp; B in the Odometer flow above (choose vehicle, format date to <code className="font-mono">yyyy-MM-dd</code>).</p>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step C — Odometer Reading at Fill:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Ask for Input</strong> → Type: <strong>Number</strong> → Prompt: <code className="font-mono">Odometer reading at fill</code> → Allow Decimals: ✅</li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">odometerAtFill</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step D — Fuel Volume:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Ask for Input</strong> → Type: <strong>Number</strong> → Prompt: <code className="font-mono">Fuel volume (litres)</code> → Allow Decimals: ✅</li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">fuelVolume</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step E — Fuel Cost:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Ask for Input</strong> → Type: <strong>Number</strong> → Prompt: <code className="font-mono">Total fuel cost (₹)</code> → Allow Decimals: ✅</li>
                    <li>Add: <strong>Set Variable</strong> → Name: <code className="font-mono text-[hsl(var(--primary))]">totalCost</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step F — Full Tank or Partial Fill:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-1">
                    <li>Add: <strong>Choose from Menu</strong> → Prompt: <code className="font-mono">Was this a full tank?</code></li>
                    <li>Option 1: <code className="font-mono">Full Tank</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">isFullTank</code> to <code className="font-mono text-green-500">true</code></li>
                    <li>Option 2: <code className="font-mono">Partial Fill</code> → <strong>Set Variable</strong> <code className="font-mono text-[hsl(var(--primary))]">isFullTank</code> to <code className="font-mono text-amber-500">false</code></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step G — Save to GaugeIQ:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-1">
                    <li>Add: <strong>Get Contents of URL</strong></li>
                    <li>URL: <code className="text-[hsl(var(--primary))] font-mono">https://gauge-iq.vercel.app/api/shortcuts/fuel</code></li>
                    <li>Method: <strong>POST</strong></li>
                    <li>Headers:
                      <code className="block pl-4 font-mono text-xs">Authorization: Bearer [token]</code>
                      <code className="block pl-4 font-mono text-xs">Content-Type: application/json</code>
                    </li>
                    <li>Request Body: <strong>JSON</strong></li>
                  </ul>
                  <CodeBlock
                    code={`{\n  "vehicle_id": vehicle_id,\n  "date": date,\n  "odometerAtFill": odometerAtFill,\n  "fuelVolume": fuelVolume,\n  "totalCost": totalCost,\n  "isFullTank": isFullTank\n}`}
                    title="JSON Body"
                  />
                </div>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <strong>Step H — Show Result Alert:</strong>
                  <ul className="list-disc list-inside mt-1 text-[hsl(var(--foreground))]/80 pl-2 space-y-0.5">
                    <li>Add: <strong>Get Dictionary Value</strong> → Key: <code className="font-mono text-[hsl(var(--primary))]">message</code> → from <strong>Contents of URL</strong></li>
                    <li>Add: <strong>Show Alert</strong> → <code className="font-mono">[message]</code></li>
                    <li className="text-xs text-[hsl(var(--foreground))]/60">Shows: <em>&quot;⛽ Full tank: 3.2L at ₹350 saved for 2024-01-15.&quot;</em></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* API REFERENCE (cURL) */}
      {showSection("api") && (
        <section className="glass-card p-6 space-y-6">
          <div className="border-b border-[hsl(var(--border))] pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-xs font-bold text-[hsl(var(--primary))]">
                  ⚡
                </span>
                <h2 className="text-lg font-semibold">API Reference &amp; cURL Testing</h2>
              </div>
              <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-mono text-[hsl(var(--foreground))]/80">
                https://gauge-iq.vercel.app
              </span>
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--foreground))]/70">
              You can test each endpoint directly using Terminal or command prompt before setting up Shortcuts.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  POST
                </span>
                <span>1. Login Endpoint</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))]/70">Returns access_token and refresh_token.</p>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"you@example.com","password":"yourpassword"}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  POST
                </span>
                <span>2. Refresh Token Endpoint</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))]/70">Exchanges a refresh token for a brand new access token.</p>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/auth/refresh \\\n  -H "Content-Type: application/json" \\\n  -d '{"refresh_token":"your_refresh_token_here"}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                  GET
                </span>
                <span>3. List Vehicles Endpoint</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))]/70">Lists your vehicles for the shortcut picker.</p>
              <CodeBlock
                code={`curl https://gauge-iq.vercel.app/api/shortcuts/vehicles \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  POST
                </span>
                <span>4. Add / Update Odometer (Upsert)</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))]/70">Safely updates if an entry already exists for this vehicle and date, otherwise inserts a new record.</p>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/odometer \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerReading":12345.6}'`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  POST
                </span>
                <span>5. Add Fuel Fill-Up</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))]/70">Records fuel volume, cost, fill odometer reading, and full/partial tank status.</p>
              <CodeBlock
                code={`curl -X POST https://gauge-iq.vercel.app/api/shortcuts/fuel \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"vehicle_id":"YOUR_VEHICLE_UUID","date":"2024-01-15","odometerAtFill":12345.6,"fuelVolume":3.2,"totalCost":350,"isFullTank":true}'`}
              />
            </div>
          </div>
        </section>
      )}

      {/* TIPS & FAQ */}
      {showSection("tips") && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[hsl(var(--border))] pb-3">
            <span className="text-xl">💡</span>
            <h2 className="text-lg font-semibold">Helpful Tips &amp; FAQ</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-[hsl(var(--foreground))]/85">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h3 className="font-semibold text-sm">⏱️ Token Expiry</h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                Your access token expires every ~1 hour. The main shortcut automatically checks for this and calls the refresh shortcut silently so you will rarely notice.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h3 className="font-semibold text-sm">🔑 Re-login if needed</h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                If tokens ever get corrupted or removed from iCloud Drive, simply run the &quot;GaugeIQ Login&quot; shortcut once to renew credentials.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h3 className="font-semibold text-sm">✏️ Safe Odometer Edits</h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                If you made a mistake or want to update today&apos;s odometer reading, run the odometer shortcut again with the corrected value — it safely updates the existing entry without creating duplicates.
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1.5">
              <h3 className="font-semibold text-sm">⚡ Instant Sync</h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--foreground))]/70">
                All data sent from Apple Shortcuts writes directly into your GaugeIQ Supabase database. You will immediately see new entries on your Dashboard, History, and Logs pages.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
