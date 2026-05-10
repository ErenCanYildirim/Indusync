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
import { CommonDatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface DeadlineExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (isoDate: string) => void;
  loading?: boolean;
}

export const DeadlineExtensionModal: React.FC<DeadlineExtensionModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
}) => {
  const [date, setDate] = useState<Date | null>(null);
  const t = useTranslations("Common.actions");

  const handleSubmit = () => {
    if (!date) return;
    onSubmit(date.toISOString());
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("proposeNewDeadline")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("proposeNewDeadlineDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <CommonDatePicker
          value={date}
          onChange={setDate}
          placeholder={t("selectDate")}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={loading || !date}>
            {loading ? t("sending") : t("propose")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
