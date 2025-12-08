import clsx from "classnames";
import Link from "next/link";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  asChild?: boolean;
  href?: string;
};

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  children,
  asChild,
  href,
  ...rest
}) => {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
    variant === "primary" && "bg-[hsl(var(--primary))] text-white hover:opacity-90",
    variant === "secondary" &&
      "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]",
    variant === "ghost" && "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
    className
  );

  if (asChild && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};
