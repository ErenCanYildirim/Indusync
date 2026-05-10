"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationSummaryProps {
  errors: Record<string, string>;
}

// Helper function to get user-friendly field names
const getFieldDisplayName = (fieldName: string): string => {
  const fieldNames: Record<string, string> = {
    firstName: "Vorname",
    lastName: "Nachname",
    phone: "Telefonnummer",
    website: "Website",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmNewPassword: "Passwort bestätigen",
    emailNotifications: "E-Mail-Benachrichtigungen",
  };
  return fieldNames[fieldName] || fieldName;
};

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
}) => {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">
            {errorCount === 1
              ? "Es gibt einen Validierungsfehler:"
              : `Es gibt ${errorCount} Validierungsfehler:`}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <strong>{getFieldDisplayName(field)}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
