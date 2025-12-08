"use client";

import React from "react";
import clsx from "classnames";
import { Timeframe } from "@/lib/types";

const options: { value: Timeframe; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "custom", label: "Custom" },
  { value: "all", label: "All time" },
];

export const TimeRangeFilter = ({ value, onChange }: { value: Timeframe; onChange: (v: Timeframe) => void }) => (
  <div className="flex flex-wrap items-center gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={clsx(
          "rounded-full border px-3 py-1 text-xs",
          value === opt.value
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
            : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]/80"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
