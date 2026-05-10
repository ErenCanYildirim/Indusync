"use client";

import React, { type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";

interface PasswordChangeFormProps {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  fieldErrors: Record<string, string>;
  isAnyFormSubmitting: boolean;
  isChangingPassword: boolean;
  isValidating: boolean;
  profileLoading: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmNewPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  validateFieldRealTime: (fieldName: string, value: string) => void;
  clearMessages: () => void;
  clearFieldError: (fieldName: string) => void;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  currentPassword,
  newPassword,
  confirmNewPassword,
  fieldErrors,
  isAnyFormSubmitting,
  isChangingPassword,
  isValidating,
  profileLoading,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onSubmit,
  validateFieldRealTime,
  clearMessages,
  clearFieldError,
}) => {
  const t = useTranslations("Profile");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("passwordChange.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t("passwordChange.currentPassword")}
            </Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => {
                onCurrentPasswordChange(e.target.value);
                clearMessages();
                clearFieldError("currentPassword");
              }}
              required
              disabled={isAnyFormSubmitting}
              autoComplete="current-password"
              className={
                fieldErrors.currentPassword
                  ? "border-destructive focus:border-destructive focus:ring-destructive"
                  : ""
              }
              aria-label={t("passwordChange.currentPassword")}
              aria-invalid={!!fieldErrors.currentPassword}
              aria-describedby={
                fieldErrors.currentPassword
                  ? "currentPassword-error"
                  : undefined
              }
            />
            {fieldErrors.currentPassword && (
              <p
                id="currentPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("passwordChange.newPassword")}
            </Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                onNewPasswordChange(e.target.value);
                clearMessages();
                clearFieldError("newPassword");
                validateFieldRealTime("newPassword", e.target.value);
              }}
              required
              disabled={isAnyFormSubmitting}
              autoComplete="new-password"
              className={
                fieldErrors.newPassword
                  ? "border-destructive focus:border-destructive focus:ring-destructive"
                  : ""
              }
              aria-label={t("passwordChange.newPassword")}
              aria-invalid={!!fieldErrors.newPassword}
              aria-describedby={
                fieldErrors.newPassword
                  ? "newPassword-error"
                  : "newPassword-hint"
              }
            />
            {fieldErrors.newPassword ? (
              <p
                id="newPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.newPassword}
              </p>
            ) : (
              <p
                id="newPassword-hint"
                className="text-xs text-muted-foreground"
              >
                {t("passwordChange.passwordHint")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">
              {t("passwordChange.confirmPassword")}
            </Label>
            <PasswordInput
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => {
                onConfirmNewPasswordChange(e.target.value);
                clearMessages();
                clearFieldError("confirmNewPassword");
                validateFieldRealTime("confirmNewPassword", e.target.value);
              }}
              required
              disabled={isAnyFormSubmitting}
              autoComplete="new-password"
              className={
                fieldErrors.confirmNewPassword
                  ? "border-destructive focus:border-destructive focus:ring-destructive"
                  : ""
              }
              aria-label={t("passwordChange.confirmPassword")}
              aria-invalid={!!fieldErrors.confirmNewPassword}
              aria-describedby={
                fieldErrors.confirmNewPassword
                  ? "confirmNewPassword-error"
                  : undefined
              }
            />
            {fieldErrors.confirmNewPassword && (
              <p
                id="confirmNewPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.confirmNewPassword}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isChangingPassword ||
                profileLoading ||
                isAnyFormSubmitting ||
                Object.keys(fieldErrors).length > 0
              }
              className="w-full sm:w-auto"
            >
              {isChangingPassword
                ? t("passwordChange.saving")
                : t("passwordChange.save")}
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
