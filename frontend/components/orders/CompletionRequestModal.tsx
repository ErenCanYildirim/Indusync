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
import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompletionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (completionMessage?: string) => void;
}

export function CompletionRequestModal({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: CompletionRequestModalProps) {
  const [completionMessage, setCompletionMessage] = React.useState("");
  const t = useTranslations("Common.actions");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(completionMessage.trim() || undefined);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setCompletionMessage("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {t("markAsCompleted")}
          </DialogTitle>
          <DialogDescription>
            {t("markAsCompletedDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="completion-message">
                {t("completionMessage")}
              </Label>
              <Textarea
                id="completion-message"
                placeholder={t("completionMessagePlaceholder")}
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
                maxLength={500}
                disabled={loading}
                className="mt-1.5 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("charactersCount", { count: completionMessage.length })}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-800">
                <strong>{t("note")}:</strong> {t("completionNote")}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("requesting")}
                </>
              ) : (
                t("requestCompletion")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
