"use client";

import React, { type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationSettingsFormProps {
  emailNotifications: boolean;
  fieldErrors: Record<string, string>;
  isUpdatingNotifications: boolean;
  isValidating: boolean;
  profileLoading: boolean;
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  onEmailNotificationsChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  clearMessages: () => void;
}

export const NotificationSettingsForm: React.FC<
  NotificationSettingsFormProps
> = ({
  emailNotifications,
  fieldErrors,
  isUpdatingNotifications,
  isValidating,
  profileLoading,
  isUpdatingProfile,
  isChangingPassword,
  onEmailNotificationsChange,
  onSubmit,
  clearMessages,
}) => {
  const t = useTranslations("Profile");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => {
                  onEmailNotificationsChange(e.target.checked);
                  clearMessages();
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <Label
                htmlFor="emailNotifications"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("notifications.emailNotifications")}
              </Label>
            </div>
          </div>

          {/* Note: Outlook sync functionality will be implemented in a future update */}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isUpdatingNotifications ||
                profileLoading ||
                isUpdatingProfile ||
                isChangingPassword ||
                Object.keys(fieldErrors).length > 0
              }
              className="w-full sm:w-auto"
            >
              {isUpdatingNotifications
                ? t("notifications.saving")
                : t("notifications.save")}
            </Button>
            {Object.keys(fieldErrors).length > 0 && (
              <p className="text-sm text-destructive mt-2">
                Bitte korrigieren Sie die Fehler in den Formularfeldern.
              </p>
            )}
            {isValidating && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Validierung läuft...
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
