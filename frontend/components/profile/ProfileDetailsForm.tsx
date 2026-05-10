"use client";

import React, { type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfilePictureSection } from "./ProfilePictureSection";
import type { UserProfile } from "@/lib/types/profile";

interface ProfileDetailsFormProps {
  user: UserProfile;
  firstName: string;
  lastName: string;
  phone: string;
  website: string;
  emailNotifications: boolean;
  profilePicture: string | null;
  profilePictureFile: File | null;
  fieldErrors: Record<string, string>;
  isAnyFormSubmitting: boolean;
  hasValidationErrors: boolean;
  isUpdatingProfile: boolean;
  isValidating: boolean;
  profileLoading: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onProfilePictureChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  validateFieldRealTime: (fieldName: string, value: string) => void;
  clearMessages: () => void;
  clearFieldError: (fieldName: string) => void;
}

export const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({
  user,
  firstName,
  lastName,
  phone,
  website,
  profilePicture,
  profilePictureFile,
  fieldErrors,
  isAnyFormSubmitting,
  hasValidationErrors,
  isUpdatingProfile,
  isValidating,
  profileLoading,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onWebsiteChange,
  onProfilePictureChange,
  onSubmit,
  validateFieldRealTime,
  clearMessages,
  clearFieldError,
}) => {
  const t = useTranslations("Profile");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalDetails.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            {/* Profile Picture */}
            <ProfilePictureSection
              profilePicture={profilePicture}
              profilePictureFile={profilePictureFile}
              firstName={firstName}
              lastName={lastName}
              onProfilePictureChange={onProfilePictureChange}
            />

            {/* User Details Fields */}
            <div className="flex-grow space-y-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t("personalDetails.firstName")}
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      onFirstNameChange(e.target.value);
                      clearMessages();
                      clearFieldError("firstName");
                      validateFieldRealTime("firstName", e.target.value);
                    }}
                    required
                    disabled={isAnyFormSubmitting}
                    className={
                      fieldErrors.firstName
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : ""
                    }
                    aria-label={t("personalDetails.firstName")}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={
                      fieldErrors.firstName ? "firstName-error" : undefined
                    }
                  />
                  {fieldErrors.firstName && (
                    <p
                      id="firstName-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t("personalDetails.lastName")}
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      onLastNameChange(e.target.value);
                      clearMessages();
                      clearFieldError("lastName");
                      validateFieldRealTime("lastName", e.target.value);
                    }}
                    required
                    disabled={isAnyFormSubmitting}
                    className={
                      fieldErrors.lastName
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : ""
                    }
                    aria-label={t("personalDetails.lastName")}
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby={
                      fieldErrors.lastName ? "lastName-error" : undefined
                    }
                  />
                  {fieldErrors.lastName && (
                    <p
                      id="lastName-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("personalDetails.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                  aria-label={t("personalDetails.email")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("personalDetails.emailNote")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("personalDetails.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      onPhoneChange(e.target.value);
                      clearMessages();
                      clearFieldError("phone");
                      validateFieldRealTime("phone", e.target.value);
                    }}
                    disabled={isAnyFormSubmitting}
                    className={
                      fieldErrors.phone
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : ""
                    }
                    aria-label={t("personalDetails.phone")}
                    aria-invalid={!!fieldErrors.phone}
                    aria-describedby={
                      fieldErrors.phone ? "phone-error" : undefined
                    }
                    placeholder={t("personalDetails.phonePlaceholder")}
                  />
                  {fieldErrors.phone && (
                    <p
                      id="phone-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">
                    {t("personalDetails.website")}
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => {
                      onWebsiteChange(e.target.value);
                      clearMessages();
                      clearFieldError("website");
                      validateFieldRealTime("website", e.target.value);
                    }}
                    disabled={isAnyFormSubmitting}
                    className={
                      fieldErrors.website
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : ""
                    }
                    aria-label={t("personalDetails.website")}
                    aria-invalid={!!fieldErrors.website}
                    aria-describedby={
                      fieldErrors.website ? "website-error" : undefined
                    }
                    placeholder={t("personalDetails.websitePlaceholder")}
                  />
                  {fieldErrors.website && (
                    <p
                      id="website-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.website}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isAnyFormSubmitting || profileLoading || hasValidationErrors
              }
              className="w-full sm:w-auto"
            >
              {isUpdatingProfile
                ? t("personalDetails.saving")
                : t("personalDetails.save")}
            </Button>
            {hasValidationErrors && (
              <p className="text-sm text-destructive mt-2">
                {t("validation.formErrorsMessage")}
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
                {t("validation.validatingMessage")}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
