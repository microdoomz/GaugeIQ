"use client";

import clsx from "classnames";
import React, { useState } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
  showToggle?: boolean;
};

export const Input: React.FC<InputProps> = ({ label, helper, className, showToggle, ...rest }) => {
  const isPasswordToggle = showToggle && rest.type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPasswordToggle && visible ? "text" : rest.type;

  const eyeIcon = (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a20 20 0 0 1 4.22-4.92" />
          <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
          <path d="m1 1 22 22" />
        </>
      )}
    </svg>
  );

  return (
    <label className="flex flex-col gap-1 text-sm text-[hsl(var(--foreground))]">
      {label && <span className="font-medium">{label}</span>}
      <div className="relative">
        <input
          className={clsx(
            "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 pr-10 text-sm outline-none",
            "focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent",
            className
          )}
          {...rest}
          type={inputType}
        />
        {isPasswordToggle && (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-2 flex items-center text-[hsl(var(--foreground))]/70 hover:text-[hsl(var(--foreground))]"
          >
            {eyeIcon}
          </button>
        )}
      </div>
      {helper && <span className="text-xs text-gray-500 dark:text-gray-400">{helper}</span>}
    </label>
  );
};
