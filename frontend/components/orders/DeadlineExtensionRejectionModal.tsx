"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface DeadlineExtensionRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rejectionReason?: string) => void;
  loading?: boolean;
  proposedDeadline: string;
}

export const DeadlineExtensionRejectionModal: React.FC<
  DeadlineExtensionRejectionModalProps
> = ({ open, onOpenChange, onSubmit, loading, proposedDeadline }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const t = useTranslations("Common.actions");

  const handleSubmit = () => {
    onSubmit(rejectionReason.trim() || undefined);
    setRejectionReason(""); // Reset for next time
  };

  const handleCancel = () => {
    setRejectionReason(""); // Reset on cancel
    onOpenChange(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("de-DE");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("rejectDeadlineExtension")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("rejectDeadlineExtensionDescription", {
              date: formatDate(proposedDeadline),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="rejection-reason">{t("rejectionReason")}</Label>
          <Textarea
            id="rejection-reason"
            placeholder={t("rejectionReasonPlaceholder")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            disabled={loading}
            maxLength={500}
          />
          <div className="text-sm text-muted-foreground text-right">
            {t("charactersCount", { count: rejectionReason.length })}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={handleCancel}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? t("rejecting") : t("reject")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
