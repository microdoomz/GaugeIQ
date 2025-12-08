"use client";

import { createContext } from "react";

export type Theme = "light" | "dark";

export const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>(
  {
    theme: "light",
    setTheme: () => undefined,
    toggle: () => undefined,
  }
);
