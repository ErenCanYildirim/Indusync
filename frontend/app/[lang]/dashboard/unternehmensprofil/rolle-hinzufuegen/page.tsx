"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleAdditionForm } from "../components/role-addition-form";
import {
  BusinessRole,
  parseBusinessRole,
} from "@/lib/types/company-role-management";
import { useCompany } from "@/lib/hooks/useCompany";
import { useCompanyRoles } from "@/hooks/use-company-roles";
import { toast } from "sonner";
import type { AddBusinessRoleData } from "@/lib/types/company-role-management";

/**
 * Role Addition Page
 *
 * This page provides a dedicated interface for adding business roles to companies.
 * It's accessed via navigation from the company profile page and provides a clean,
 * focused experience for role addition without nested form issues.
 */
export default function RoleAdditionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tCommon = useTranslations("Common.actions");

  // Get the role from URL parameters
  const roleParam = searchParams.get("role");
  let selectedRole: BusinessRole | null = null;

  try {
    if (roleParam) {
      selectedRole = parseBusinessRole(roleParam);
    }
  } catch (error) {
    console.error("Invalid role parameter:", roleParam);
  }

  // Get company data
  const { company, isLoading: companyLoading } = useCompany();

  // Get role management functions
  const { addBusinessRole, isAddingRole } = useCompanyRoles(company?.id);

  // Handle navigation back to company profile
  const handleBack = () => {
    router.push("/dashboard/unternehmensprofil");
  };

  // Handle form submission
  const handleFormSubmit = async (data: AddBusinessRoleData) => {
    try {
      await addBusinessRole(data.role, data);

      // Show success message
      const roleName =
        locale === "en"
          ? data.role === BusinessRole.AUFTRAGGEBER
            ? "Client"
            : "Service Provider"
          : data.role === BusinessRole.AUFTRAGGEBER
          ? "Auftraggeber"
          : "Auftragnehmer";

      const successMessage =
        locale === "en"
          ? `${roleName} role added successfully!`
          : `${roleName}-Rolle erfolgreich hinzugefügt!`;

      const description =
        locale === "en"
          ? "You will be redirected to the company profile."
          : "Sie werden zum Unternehmensprofil weitergeleitet.";

      toast.success(successMessage, { description });

      // Navigate back to company profile after successful addition
      setTimeout(() => {
        router.push("/dashboard/unternehmensprofil");
      }, 1500);
    } catch (error) {
      console.error("Failed to add role:", error);
      // Error handling is done in the form component and hook
      throw error; // Re-throw to let form handle it
    }
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    router.push("/dashboard/unternehmensprofil");
  };

  // Show loading state
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">
            {locale === "en"
              ? "Loading company data..."
              : "Lade Unternehmensdaten..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if no role specified
  if (!selectedRole) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">
          {locale === "en" ? "Invalid Role" : "Ungültige Rolle"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {locale === "en"
            ? "The specified role is invalid or was not found."
            : "Die angegebene Rolle ist ungültig oder wurde nicht gefunden."}
        </p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {locale === "en"
            ? "Back to Company Profile"
            : `${tCommon("back")} zum Unternehmensprofil`}
        </Button>
      </div>
    );
  }

  // Show error if no company data
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">
          {locale === "en" ? "Company Not Found" : "Unternehmen nicht gefunden"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {locale === "en"
            ? "Your company data could not be loaded."
            : "Ihre Unternehmensdaten konnten nicht geladen werden."}
        </p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {locale === "en" ? "Back to Dashboard" : "Zurück zum Dashboard"}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header with back navigation */}
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {locale === "en"
            ? "Back to Company Profile"
            : `${tCommon("back")} zum Unternehmensprofil`}
        </Button>

        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {locale === "en"
                  ? `Add ${
                      selectedRole === BusinessRole.AUFTRAGGEBER
                        ? "Client"
                        : "Service Provider"
                    } Role`
                  : `${
                      selectedRole === BusinessRole.AUFTRAGGEBER
                        ? "Auftraggeber"
                        : "Auftragnehmer"
                    }-Rolle hinzufügen`}
              </h1>
              <p className="text-muted-foreground mt-2">
                {locale === "en"
                  ? "Add a new business role to your company."
                  : "Fügen Sie eine neue Geschäftsrolle zu Ihrem Unternehmen hinzu."}
              </p>
            </div>
            <Button variant="outline" onClick={handleFormCancel}>
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      </div>

      {/* Role Addition Form */}
      <RoleAdditionForm
        role={selectedRole}
        company={company}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isLoading={isAddingRole}
      />
    </>
  );
}
