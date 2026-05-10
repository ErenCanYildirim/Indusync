"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/#ueber-uns",
      label: "Über uns",
      active: pathname === "/#ueber-uns",
    },
    {
      href: "/#fachbereiche",
      label: "Fachbereiche",
      active: pathname === "/#fachbereiche",
    },
    {
      href: "/#referenzen",
      label: "Referenzen",
      active: pathname === "/#referenzen",
    },
    {
      href: "/#dienstleistung",
      label: "Dienstleistung",
      active: pathname === "/#dienstleistung",
    },
    {
      href: "/#kontakt",
      label: "Kontakt",
      active: pathname === "/#kontakt",
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-primary dark:text-primary"
              : "text-foreground/60 hover:text-foreground/80 dark:text-foreground/70 dark:hover:text-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

//Placeholder
