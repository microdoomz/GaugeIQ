"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import clsx from "classnames";

export type ToastType = "success" | "error" | "info";
export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  timeoutMs?: number;
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = (toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: ToastItem = { id, timeoutMs: 2000, type: "success", ...toast };
    setToasts((prev) => [...prev, item]);
  };

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((p) => p.id !== t.id));
      }, t.timeoutMs ?? 2000)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts]);

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto w-full max-w-sm transform rounded-xl border px-4 py-3 shadow-lg transition duration-200",
              "bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
              t.type === "success" && "border-green-500/40 bg-green-500/5",
              t.type === "error" && "border-red-500/40 bg-red-500/5",
              t.type === "info" && "border-blue-500/40 bg-blue-500/5"
            )}
          >
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
