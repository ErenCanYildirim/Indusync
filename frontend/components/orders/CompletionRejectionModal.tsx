"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompletionRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (rejectionReason?: string) => void;
}

export function CompletionRejectionModal({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: CompletionRejectionModalProps) {
  const [rejectionReason, setRejectionReason] = React.useState("");
  const t = useTranslations("Common.actions");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rejectionReason.trim() || undefined);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setRejectionReason("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            {t("rejectCompletion")}
          </DialogTitle>
          <DialogDescription>
            {t("rejectCompletionDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">
                {t("rejectionReasonOptional")}
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={t("rejectionReasonCompletionPlaceholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={500}
                disabled={loading}
                className="mt-1.5 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("charactersCount", { count: rejectionReason.length })}
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="text-sm text-orange-800">
                <strong>{t("note")}:</strong> {t("rejectionNote")}
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("rejectingCompletion")}
                </>
              ) : (
                t("rejectCompletion")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
