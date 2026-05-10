"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";

interface NavGroup {
  id: string;
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export function DashboardMobileNav({
  navGroups,
}: Readonly<{ navGroups: NavGroup[] }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([
    "projekte",
    "unternehmen",
  ]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleGroup = (group: string) => {
    setOpenGroups((current) =>
      current.includes(group)
        ? current.filter((g) => g !== group)
        : [...current, group]
    );
  };

  const isGroupOpen = (group: string) => openGroups.includes(group);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu öffnen"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] max-w-[80vw]">
          <SheetHeader className="h-16 px-4 border-b flex items-center justify-between">
            <SheetTitle className="flex items-center">
              <span className="text-xl font-semibold">
                IndustrieConnect<span className="text-primary">.</span>
              </span>
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Schließen</span>
            </Button>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="px-3 py-4">
              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isGroupOpen(group.id) && "transform rotate-180"
                        )}
                      />
                    </button>

                    {isGroupOpen(group.id) && (
                      <div className="space-y-1 pl-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
                              isActive(item.href)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="h-px bg-border my-2" />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
