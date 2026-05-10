"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { MatchingPreviewModal } from "./MatchingPreviewModal";
import { useMatchingPreview } from "@/lib/hooks/useMatchingPreview";
import { useTranslations } from "next-intl";

interface MatchingPreviewButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function MatchingPreviewButton({
  variant = "default",
  size = "default",
  className,
}: MatchingPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { loading } = useMatchingPreview();
  const t = useTranslations("Dashboard.orders");

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={loading}
        onClick={() => setIsOpen(true)}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span className="hidden sm:inline">{t("loading")}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t("matchingPreview")}</span>
            <span className="sm:hidden">{t("matchingPreviewShort")}</span>
          </>
        )}
      </Button>

      <MatchingPreviewModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function MatchingPreviewIconButton({
  variant = "outline",
  size = "default",
  className,
}: MatchingPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { loading } = useMatchingPreview();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={loading}
        onClick={() => setIsOpen(true)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>

      <MatchingPreviewModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
