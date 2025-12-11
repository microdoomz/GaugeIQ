import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "classnames";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/logs", label: "Logs" },
  { href: "/history", label: "History" },
  { href: "/trips", label: "Trips" },
  { href: "/settings", label: "Settings" },
];

export const NavLinks = () => {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-2 text-sm overflow-x-auto">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-lg px-3 py-2 transition whitespace-nowrap",
              active
                ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                : "text-[hsl(var(--foreground))]/80 hover:text-[hsl(var(--foreground))]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
