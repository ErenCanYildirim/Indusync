"use client";

import React, {
  useState,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useCallback,
} from "react";

import { CompanyMembershipCard } from "@/components/CompanyMembershipCard";
import { useProfile } from "@/hooks/use-profile";
import { useProfileValidation } from "@/hooks/use-profile-validation";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  UpdateProfileData,
  ChangePasswordData,
  ProfileApiError,
} from "@/lib/types/profile";
import {
  isProfileApiError,
  hasValidationErrors as hasValidationErrorsUtil,
} from "@/lib/types/profile";

// Import components
import { ValidationSummary } from "@/components/profile/ValidationSummary";
import { ProfileDetailsForm } from "@/components/profile/ProfileDetailsForm";
import { NotificationSettingsForm } from "@/components/profile/NotificationSettingsForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { LoadingSkeleton } from "@/components/profile/LoadingSkeleton";
import { ErrorState } from "@/components/profile/ErrorState";

const UserProfilePage = (): React.ReactNode => {
  const t = useTranslations("Profile");

  // Use the profile hook for real API integration
  const {
    user,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    changePassword,
    refreshProfile,
  } = useProfile();

  // Profile Picture State (for future implementation)
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State - initialized from user data
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  // Password State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");

  // Loading states for individual operations
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] =
    useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Local error and success states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use validation hook
  const {
    fieldErrors,
    isValidating,
    setFieldErrors,
    clearFieldError,
    validateFieldRealTime,
    validateProfileForm,
    validatePasswordForm,
  } = useProfileValidation(currentPassword, newPassword);

  // Check if any form operation is in progress
  const isAnyFormSubmitting =
    isUpdatingProfile || isUpdatingNotifications || isChangingPassword;

  // Check if there are validation errors that prevent form submission
  const hasValidationErrors = Object.keys(fieldErrors).length > 0;

  // Network retry functionality
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

  const handleNetworkRetry = useCallback(
    async (operation: () => Promise<void>) => {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          await operation();
          setRetryCount(0); // Reset retry count on success
          return;
        } catch (error) {
          attempts++;
          setRetryCount(attempts);

          if (attempts >= maxRetries) {
            throw error; // Re-throw after max retries
          }

          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },
    [maxRetries]
  );

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setWebsite(user.website || "");
      setEmailNotifications(user.emailNotifications);
    }
  }, [user]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
  };

  const handleProfilePictureChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    clearMessages();
    const file = event.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
      // For now, we just show a success message locally for preview
      setSuccessMessage(t("profilePicture.previewUpdated"));
    }
  };

  const handleProfileDetailsUpdate = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    clearMessages();

    // Client-side validation
    if (!validateProfileForm(firstName, lastName, phone, website)) {
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const profileData: UpdateProfileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        emailNotifications,
      };

      await updateProfile(profileData);
      setSuccessMessage(t("personalDetails.successMessage"));
      setProfilePictureFile(null); // Clear file after successful update
    } catch (err) {
      // Enhanced error handling for different failure scenarios
      if (isProfileApiError(err) && hasValidationErrorsUtil(err)) {
        const backendFieldErrors: Record<string, string> = {};
        err.validationErrors.forEach((validationError) => {
          backendFieldErrors[validationError.field] = validationError.message;
        });
        setFieldErrors(backendFieldErrors);
      } else if (err instanceof Error) {
        const errorMessage = err.message;

        // Enhanced network and server error handling with retry information
        if (
          errorMessage.includes("Netzwerkfehler") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Netzwerkfehler${retryMessage}. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.`
          );
        } else if (
          errorMessage.includes("Serverfehler") ||
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Serverfehler${retryMessage}. Bitte versuchen Sie es in wenigen Minuten erneut.`
          );
        } else if (
          errorMessage.includes("Nicht authentifiziert") ||
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          setError(
            "Ihre Sitzung ist abgelaufen. Sie werden zur Anmeldung weitergeleitet."
          );
          // The API client will handle the redirect automatically
        } else if (
          errorMessage.includes("Keine Berechtigung") ||
          errorMessage.includes("403") ||
          errorMessage.includes("Forbidden")
        ) {
          setError("Sie haben keine Berechtigung, diese Aktion auszuführen.");
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("Too Many Requests")
        ) {
          setError(
            "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("Timeout")
        ) {
          setError(
            "Die Anfrage ist abgelaufen. Bitte versuchen Sie es erneut."
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t("errors.profileUpdateFailed"));
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleNotificationSettingsUpdate = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    clearMessages();
    setIsUpdatingNotifications(true);

    try {
      // Update notifications as part of profile update
      const profileData: UpdateProfileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        emailNotifications,
      };

      await updateProfile(profileData);
      setSuccessMessage(t("notifications.successMessage"));
    } catch (err) {
      // Enhanced error handling for notification settings
      if (isProfileApiError(err) && hasValidationErrorsUtil(err)) {
        const backendFieldErrors: Record<string, string> = {};
        err.validationErrors.forEach((validationError) => {
          backendFieldErrors[validationError.field] = validationError.message;
        });
        setFieldErrors(backendFieldErrors);
      } else if (err instanceof Error) {
        const errorMessage = err.message;

        // Enhanced network and server error handling with retry information
        if (
          errorMessage.includes("Netzwerkfehler") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Netzwerkfehler${retryMessage}. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.`
          );
        } else if (
          errorMessage.includes("Serverfehler") ||
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Serverfehler${retryMessage}. Bitte versuchen Sie es in wenigen Minuten erneut.`
          );
        } else if (
          errorMessage.includes("Nicht authentifiziert") ||
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          setError(
            "Ihre Sitzung ist abgelaufen. Sie werden zur Anmeldung weitergeleitet."
          );
        } else if (
          errorMessage.includes("Keine Berechtigung") ||
          errorMessage.includes("403") ||
          errorMessage.includes("Forbidden")
        ) {
          setError("Sie haben keine Berechtigung, diese Aktion auszuführen.");
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("Too Many Requests")
        ) {
          setError(
            "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("Timeout")
        ) {
          setError(
            "Die Anfrage ist abgelaufen. Bitte versuchen Sie es erneut."
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t("errors.notificationUpdateFailed"));
      }
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handlePasswordUpdate = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    clearMessages();

    // Client-side validation matching backend ChangePasswordRequest requirements
    if (
      !validatePasswordForm(currentPassword, newPassword, confirmNewPassword)
    ) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const passwordData: ChangePasswordData = {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmNewPassword.trim(),
      };

      await changePassword(passwordData);

      // Success feedback and form reset
      setSuccessMessage(t("passwordChange.successMessage"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Clear any field errors on success
      setFieldErrors({});
    } catch (err) {
      // Handle different password change failure scenarios
      if (err instanceof Error) {
        // Map specific backend error messages to user-friendly messages
        const errorMessage = err.message;

        if (
          errorMessage.includes("Aktuelles Passwort ist nicht korrekt") ||
          errorMessage.includes("current password")
        ) {
          setFieldErrors({
            currentPassword: t("validation.currentPasswordIncorrect"),
          });
        } else if (
          errorMessage.includes(
            "Neues Passwort und Bestätigung stimmen nicht überein"
          ) ||
          errorMessage.includes("password confirmation")
        ) {
          setFieldErrors({
            confirmNewPassword: t("validation.passwordConfirmationMismatch"),
          });
        } else if (
          errorMessage.includes("mindestens 8 Zeichen") ||
          errorMessage.includes("8 characters")
        ) {
          setFieldErrors({
            newPassword: t("validation.passwordTooShort"),
          });
        } else if (
          errorMessage.includes("Passwort-Anforderungen") ||
          errorMessage.includes("password requirements")
        ) {
          setFieldErrors({
            newPassword: t("validation.passwordRequirements"),
          });
        } else if (
          errorMessage.includes("Netzwerkfehler") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Netzwerkfehler${retryMessage}. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.`
          );
        } else if (
          errorMessage.includes("Serverfehler") ||
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504")
        ) {
          const retryMessage =
            retryCount > 0 ? ` (Versuch ${retryCount}/${maxRetries})` : "";
          setError(
            `Serverfehler${retryMessage}. Bitte versuchen Sie es in wenigen Minuten erneut.`
          );
        } else if (
          errorMessage.includes("Nicht authentifiziert") ||
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          setError(
            "Ihre Sitzung ist abgelaufen. Sie werden zur Anmeldung weitergeleitet."
          );
        } else if (
          errorMessage.includes("Keine Berechtigung") ||
          errorMessage.includes("403") ||
          errorMessage.includes("Forbidden")
        ) {
          setError("Sie haben keine Berechtigung, diese Aktion auszuführen.");
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("Too Many Requests")
        ) {
          setError(
            "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("Timeout")
        ) {
          setError(
            "Die Anfrage ist abgelaufen. Bitte versuchen Sie es erneut."
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t("errors.passwordChangeFailed"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Remove hardcoded classes - we'll use design system components

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-foreground mb-10 text-center sm:text-left">
          {t("title")}
        </h1>

        {/* Global Messages */}
        {(error || profileError) && (
          <Alert variant="destructive">
            <AlertDescription>{error || profileError}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Validation Summary */}
        <ValidationSummary errors={fieldErrors} />

        {/* Loading skeleton during initial profile data fetch */}
        {profileLoading && !user && <LoadingSkeleton />}

        {/* Show error state when profile loading failed */}
        {!profileLoading && !user && profileError && (
          <ErrorState error={profileError} onRetry={refreshProfile} />
        )}

        {/* Only show content when profile data is loaded */}
        {user && (
          <>
            {/* Profile Details Section */}
            <ProfileDetailsForm
              user={user}
              firstName={firstName}
              lastName={lastName}
              phone={phone}
              website={website}
              emailNotifications={emailNotifications}
              profilePicture={profilePicture}
              profilePictureFile={profilePictureFile}
              fieldErrors={fieldErrors}
              isAnyFormSubmitting={isAnyFormSubmitting}
              hasValidationErrors={hasValidationErrors}
              isUpdatingProfile={isUpdatingProfile}
              isValidating={isValidating}
              profileLoading={profileLoading}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onPhoneChange={setPhone}
              onWebsiteChange={setWebsite}
              onProfilePictureChange={handleProfilePictureChange}
              onSubmit={handleProfileDetailsUpdate}
              validateFieldRealTime={validateFieldRealTime}
              clearMessages={clearMessages}
              clearFieldError={clearFieldError}
            />

            {/* Company Membership Section */}
            <CompanyMembershipCard />

            {/* Notification settings section */}
            <NotificationSettingsForm
              emailNotifications={emailNotifications}
              fieldErrors={fieldErrors}
              isUpdatingNotifications={isUpdatingNotifications}
              isValidating={isValidating}
              profileLoading={profileLoading}
              isUpdatingProfile={isUpdatingProfile}
              isChangingPassword={isChangingPassword}
              onEmailNotificationsChange={setEmailNotifications}
              onSubmit={handleNotificationSettingsUpdate}
              clearMessages={clearMessages}
            />

            {/* Password Change Section */}
            <PasswordChangeForm
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmNewPassword={confirmNewPassword}
              fieldErrors={fieldErrors}
              isAnyFormSubmitting={isAnyFormSubmitting}
              isChangingPassword={isChangingPassword}
              isValidating={isValidating}
              profileLoading={profileLoading}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmNewPasswordChange={setConfirmNewPassword}
              onSubmit={handlePasswordUpdate}
              validateFieldRealTime={validateFieldRealTime}
              clearMessages={clearMessages}
              clearFieldError={clearFieldError}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
