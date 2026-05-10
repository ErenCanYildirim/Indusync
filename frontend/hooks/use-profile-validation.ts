"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

export interface ValidationHookReturn {
    fieldErrors: Record<string, string>;
    isValidating: boolean;
    setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    clearFieldError: (fieldName: string) => void;
    validateFieldRealTime: (fieldName: string, value: string, delay?: number) => void;
    validateProfileForm: (firstName: string, lastName: string, phone: string, website: string) => boolean;
    validatePasswordForm: (currentPassword: string, newPassword: string, confirmNewPassword: string) => boolean;
}

export function useProfileValidation(currentPassword: string, newPassword: string): ValidationHookReturn {
    const t = useTranslations("Profile");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState<boolean>(false);

    const clearFieldError = useCallback((fieldName: string) => {
        setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    const validateFieldRealTime = useCallback(
        (fieldName: string, value: string, delay: number = 500) => {
            // Clear existing timeout for this field
            const timeoutKey = `${fieldName}_timeout`;
            if ((window as any)[timeoutKey]) {
                clearTimeout((window as any)[timeoutKey]);
            }

            // Set new timeout for validation
            (window as any)[timeoutKey] = setTimeout(() => {
                const errors: Record<string, string> = {};

                switch (fieldName) {
                    case "firstName":
                        if (!value.trim()) {
                            errors.firstName = t("validation.firstNameRequired");
                        } else if (value.length > 100) {
                            errors.firstName = t("validation.firstNameTooLong");
                        } else if (value.trim().length < 2) {
                            errors.firstName = t("validation.firstNameTooShort");
                        } else if (!/^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(value.trim())) {
                            errors.firstName = t("validation.firstNameInvalidChars");
                        }
                        break;

                    case "lastName":
                        if (!value.trim()) {
                            errors.lastName = t("validation.lastNameRequired");
                        } else if (value.length > 100) {
                            errors.lastName = t("validation.lastNameTooLong");
                        } else if (value.trim().length < 2) {
                            errors.lastName = t("validation.lastNameTooShort");
                        } else if (!/^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(value.trim())) {
                            errors.lastName = t("validation.lastNameInvalidChars");
                        }
                        break;

                    case "phone":
                        if (value && value.trim()) {
                            if (value.length > 20) {
                                errors.phone = t("validation.phoneTooLong");
                            } else if (!/^[\+]?[0-9\s\-\(\)\.\/]+$/.test(value.trim())) {
                                errors.phone = t("validation.phoneInvalidChars");
                            } else if (value.trim().length < 5) {
                                errors.phone = t("validation.phoneTooShort");
                            }
                        }
                        break;

                    case "website":
                        if (value && value.trim()) {
                            if (value.length > 255) {
                                errors.website = t("validation.websiteTooLong");
                            } else {
                                const websiteValue = value.trim();
                                if (
                                    !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
                                        websiteValue
                                    )
                                ) {
                                    errors.website = t("validation.websiteInvalid");
                                } else {
                                    try {
                                        const url = new URL(
                                            websiteValue.startsWith("http")
                                                ? websiteValue
                                                : `https://${websiteValue}`
                                        );
                                        if (!["http:", "https:"].includes(url.protocol)) {
                                            errors.website = t("validation.websiteInvalidProtocol");
                                        }
                                        if (
                                            !url.hostname.includes(".") ||
                                            url.hostname.length < 4
                                        ) {
                                            errors.website = t("validation.websiteInvalidDomain");
                                        }
                                    } catch {
                                        errors.website = t("validation.websiteInvalid");
                                    }
                                }
                            }
                        }
                        break;

                    case "newPassword":
                        if (value.trim()) {
                            if (value.length < 8) {
                                errors.newPassword = t("validation.passwordTooShort");
                            } else if (value.length > 128) {
                                errors.newPassword =
                                    "Passwort darf maximal 128 Zeichen lang sein";
                            } else if (value === currentPassword) {
                                errors.newPassword =
                                    "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden";
                            } else {
                                const hasUpperCase = /[A-Z]/.test(value);
                                const hasLowerCase = /[a-z]/.test(value);
                                const hasNumbers = /\d/.test(value);
                                const hasSpecialChar =
                                    /[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'/~`]/.test(value);

                                const strengthErrors = [];
                                if (!hasUpperCase) strengthErrors.push("Großbuchstaben");
                                if (!hasLowerCase) strengthErrors.push("Kleinbuchstaben");
                                if (!hasNumbers) strengthErrors.push("Zahlen");
                                if (!hasSpecialChar) strengthErrors.push("Sonderzeichen");

                                if (strengthErrors.length > 0) {
                                    errors.newPassword = `Passwort muss folgende Zeichen enthalten: ${strengthErrors.join(
                                        ", "
                                    )}`;
                                } else if (/(.)\1{2,}/.test(value)) {
                                    errors.newPassword =
                                        "Passwort darf nicht mehr als 2 aufeinanderfolgende gleiche Zeichen enthalten";
                                } else if (/123|abc|qwe|password|passwort/i.test(value)) {
                                    errors.newPassword =
                                        "Passwort darf keine häufig verwendeten Muster enthalten";
                                }
                            }
                        }
                        break;

                    case "confirmNewPassword":
                        if (value.trim() && value !== newPassword) {
                            errors.confirmNewPassword = t("validation.passwordMismatch");
                        }
                        break;
                }

                // Update field errors
                setFieldErrors((prev) => {
                    const newErrors = { ...prev, ...errors };

                    // Clear error if validation passed
                    if (Object.keys(errors).length === 0) {
                        delete newErrors[fieldName];
                    }

                    return newErrors;
                });

                delete (window as any)[timeoutKey];
            }, delay);
        },
        [currentPassword, newPassword, t]
    );

    const validateProfileForm = useCallback(
        (firstName: string, lastName: string, phone: string, website: string): boolean => {
            const errors: Record<string, string> = {};

            // First name validation - matching backend @NotBlank and @Size(max = 100)
            if (!firstName.trim()) {
                errors.firstName = t("validation.firstNameRequired");
            } else if (firstName.length > 100) {
                errors.firstName = t("validation.firstNameTooLong");
            } else if (firstName.trim().length < 2) {
                errors.firstName = t("validation.firstNameTooShort");
            } else if (!/^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(firstName.trim())) {
                errors.firstName = t("validation.firstNameInvalidChars");
            }

            // Last name validation - matching backend @NotBlank and @Size(max = 100)
            if (!lastName.trim()) {
                errors.lastName = t("validation.lastNameRequired");
            } else if (lastName.length > 100) {
                errors.lastName = t("validation.lastNameTooLong");
            } else if (lastName.trim().length < 2) {
                errors.lastName = t("validation.lastNameTooShort");
            } else if (!/^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(lastName.trim())) {
                errors.lastName = t("validation.lastNameInvalidChars");
            }

            // Phone validation with enhanced rules - matching backend @Size(max = 20)
            if (phone && phone.trim()) {
                if (phone.length > 20) {
                    errors.phone = t("validation.phoneTooLong");
                } else if (!/^[\+]?[0-9\s\-\(\)\.\/]+$/.test(phone.trim())) {
                    errors.phone = t("validation.phoneInvalidChars");
                } else if (phone.trim().length < 5) {
                    errors.phone = t("validation.phoneTooShort");
                }
            }

            // Website validation with enhanced rules - matching backend @Size(max = 255)
            if (website && website.trim()) {
                if (website.length > 255) {
                    errors.website = t("validation.websiteTooLong");
                } else {
                    // Enhanced URL validation
                    const websiteValue = website.trim();

                    // Check for basic URL format
                    if (
                        !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
                            websiteValue
                        )
                    ) {
                        errors.website = t("validation.websiteInvalid");
                    } else {
                        // Try to validate as proper URL
                        try {
                            const url = new URL(
                                websiteValue.startsWith("http")
                                    ? websiteValue
                                    : `https://${websiteValue}`
                            );
                            if (!["http:", "https:"].includes(url.protocol)) {
                                errors.website = t("validation.websiteInvalidProtocol");
                            }
                            // Check for valid domain structure
                            if (!url.hostname.includes(".") || url.hostname.length < 4) {
                                errors.website = t("validation.websiteInvalidDomain");
                            }
                        } catch {
                            errors.website = t("validation.websiteInvalid");
                        }
                    }
                }
            }

            setFieldErrors(errors);
            return Object.keys(errors).length === 0;
        },
        [t]
    );

    const validatePasswordForm = useCallback(
        (currentPassword: string, newPassword: string, confirmNewPassword: string): boolean => {
            const errors: Record<string, string> = {};

            // Current password validation - required field
            if (!currentPassword.trim()) {
                errors.currentPassword = t("validation.currentPasswordRequired");
            } else if (currentPassword.length < 1) {
                errors.currentPassword = "Aktuelles Passwort ist erforderlich";
            }

            // New password validation with comprehensive rules
            if (!newPassword.trim()) {
                errors.newPassword = t("validation.newPasswordRequired");
            } else if (newPassword.length < 8) {
                errors.newPassword = t("validation.passwordTooShort");
            } else if (newPassword.length > 128) {
                errors.newPassword = "Passwort darf maximal 128 Zeichen lang sein";
            } else if (newPassword === currentPassword) {
                errors.newPassword =
                    "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden";
            } else {
                // Enhanced password strength requirements
                const hasUpperCase = /[A-Z]/.test(newPassword);
                const hasLowerCase = /[a-z]/.test(newPassword);
                const hasNumbers = /\d/.test(newPassword);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'/~`]/.test(
                    newPassword
                );

                const strengthErrors = [];

                if (!hasUpperCase) {
                    strengthErrors.push("Großbuchstaben");
                }
                if (!hasLowerCase) {
                    strengthErrors.push("Kleinbuchstaben");
                }
                if (!hasNumbers) {
                    strengthErrors.push("Zahlen");
                }
                if (!hasSpecialChar) {
                    strengthErrors.push("Sonderzeichen");
                }

                if (strengthErrors.length > 0) {
                    errors.newPassword = `Passwort muss folgende Zeichen enthalten: ${strengthErrors.join(
                        ", "
                    )}`;
                }

                // Check for common weak patterns
                if (/(.)\1{2,}/.test(newPassword)) {
                    errors.newPassword =
                        "Passwort darf nicht mehr als 2 aufeinanderfolgende gleiche Zeichen enthalten";
                } else if (/123|abc|qwe|password|passwort/i.test(newPassword)) {
                    errors.newPassword =
                        "Passwort darf keine häufig verwendeten Muster enthalten";
                }
            }

            // Confirm password validation - must match new password exactly
            if (!confirmNewPassword.trim()) {
                errors.confirmNewPassword = t("validation.confirmPasswordRequired");
            } else if (newPassword !== confirmNewPassword) {
                errors.confirmNewPassword = t("validation.passwordMismatch");
            }

            setFieldErrors(errors);
            return Object.keys(errors).length === 0;
        },
        [t]
    );

    return {
        fieldErrors,
        isValidating,
        setFieldErrors,
        clearFieldError,
        validateFieldRealTime,
        validateProfileForm,
        validatePasswordForm,
    };
}