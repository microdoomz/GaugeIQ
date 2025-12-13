import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], display: "swap" });

/* ----------------------------
   FIX: themeColor belongs here
----------------------------- */
export const viewport: Viewport = {
  themeColor: "#0A0F1F",
};

/* ----------------------------
   Metadata (safe for Next.js 14)
----------------------------- */
export const metadata: Metadata = {
  title: "GaugeIQ – Vehicle mileage & fuel analytics",
  description:
    "Track odometer, fuel, mileage, cost, emissions, and projections with GaugeIQ.",
  manifest: "/manifest.json",

  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Chrome/Android PWA support */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>

      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
