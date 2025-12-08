import clsx from "classnames";
import React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helper?: string;
};

export const Textarea: React.FC<TextareaProps> = ({ label, helper, className, ...rest }) => {
  return (
    <label className="flex flex-col gap-1 text-sm text-[hsl(var(--foreground))]">
      {label && <span className="font-medium">{label}</span>}
      <textarea
        className={clsx(
          "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none",
          "focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent",
          className
        )}
        rows={3}
        {...rest}
      />
      {helper && <span className="text-xs text-gray-500 dark:text-gray-400">{helper}</span>}
    </label>
  );
};
