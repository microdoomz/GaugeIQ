import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  hint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, hint }) => {
  return (
    <div className="glass-card p-4">
      <p className="text-sm text-[hsl(var(--foreground))]/70">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {change && <p className="mt-1 text-xs text-[hsl(var(--secondary))]">{change}</p>}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
};
