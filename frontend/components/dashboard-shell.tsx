import type React from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className,
}: Readonly<DashboardShellProps>) {
  return (
    <div className="w-full">
      <div className={cn("grid items-start gap-6", className)}>{children}</div>
    </div>
  );
}
