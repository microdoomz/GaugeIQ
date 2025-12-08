import React from "react";

export const ChartCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{title}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      </div>
      <div className="mt-3 w-full overflow-hidden">{children}</div>
    </div>
  );
};
