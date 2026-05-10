"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useCompanyRoles } from "@/hooks/use-company-roles";
import {
  BusinessRole,
  BusinessRoleUtils,
  AddBusinessRoleData,
} from "@/lib/types/company-role-management";
import type { CompanyProfile } from "@/lib/api/types";
import { RoleAdditionModal } from "./role-addition-modal";

interface CompanyRoleManagementCardProps {
  /** Company profile data */
  company?: CompanyProfile | null;
  /** Callback when a role is successfully added */
  onRoleAdded?: (role: BusinessRole) => void;
}

/**
 * CompanyRoleManagementCard component displays current company roles and provides
 * functionality to add new business roles (Auftraggeber/Auftragnehmer).
 *
 * Features:
 * - Displays current roles with badges
 * - Shows "Add Role" buttons for available roles
 * - Handles loading states during role operations
 * - Provides error handling and user feedback
 * - Integrates with role addition modal (to be implemented in task 9)
 */
export const CompanyRoleManagementCard: React.FC<
  CompanyRoleManagementCardProps
> = ({ company, onRoleAdded }) => {
  const router = useRouter();
  const t = useTranslations("Dashboard.companyProfile.roleManagement");
  const currentLocale = useLocale();

  // State for modal control
  const [selectedRole, setSelectedRole] = useState<BusinessRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the company roles hook for state management
  const {
    currentRoles,
    availableRoles,
    isLoading,
    isAddingRole,
    error,
    canAddRole,
    clearError,
    addBusinessRole,
  } = useCompanyRoles(company?.id);

  // Mapping utility for role display names
  const getRoleDisplayName = (role: BusinessRole): string => {
    const displayName = BusinessRoleUtils.getDisplayName(role);
    if (currentLocale === "en") {
      return role === BusinessRole.AUFTRAGGEBER ? "Client" : "Service Provider";
    }
    return displayName;
  };

  // Handle add role button click
  const handleAddRoleClick = (role: BusinessRole) => {
    if (!canAddRole(role)) return;

    clearError();
    setSelectedRole(role);
    setIsModalOpen(true);

    // TODO: This will open the RoleAdditionModal when implemented in task 9
    console.log(`Opening role addition modal for role: ${role}`);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  // Handle role addition confirmation from modal
  const handleRoleAdditionConfirm = async (role: BusinessRole) => {
    handleModalClose();

    // Check if role requires additional data (Auftragnehmer role)
    if (BusinessRoleUtils.requiresSpecializationData(role)) {
      // Navigate to the role addition page
      console.log("Navigating to role addition page for role:", role);
      router.push(
        `/dashboard/unternehmensprofil/rolle-hinzufuegen?role=${role}`
      );
    } else {
      // For Auftraggeber role, no additional data needed, add directly
      try {
        const roleData: AddBusinessRoleData = {
          role: role,
          specializations: [],
          industries: [],
          orderCategories: [],
          certifications: [],
        };

        await addBusinessRole(role, roleData);
        onRoleAdded?.(role);
      } catch (error) {
        console.error("Failed to add role:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
      }
    }
  };

  // Don't render if no company data
  if (!company) return null;

  // Determine current roles from company data or hook data
  const effectiveCurrentRoles = currentRoles || {
    isAuftraggeber: company.isAuftraggeber || false,
    isAuftragnehmer: company.isAuftragnehmer || false,
  };

  // Determine available roles
  const effectiveAvailableRoles =
    availableRoles.length > 0
      ? availableRoles
      : BusinessRoleUtils.getAvailableRoles(effectiveCurrentRoles);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("title")}</span>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Roles Display */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            {t("currentRoles")}
          </h4>
          <div className="flex gap-2">
            {effectiveCurrentRoles.isAuftraggeber && (
              <Badge variant="default">
                {getRoleDisplayName(BusinessRole.AUFTRAGGEBER)}
              </Badge>
            )}
            {effectiveCurrentRoles.isAuftragnehmer && (
              <Badge variant="outline">
                {getRoleDisplayName(BusinessRole.AUFTRAGNEHMER)}
              </Badge>
            )}
            {!effectiveCurrentRoles.isAuftraggeber &&
              !effectiveCurrentRoles.isAuftragnehmer && (
                <span className="text-sm text-muted-foreground">
                  {t("noRoles")}
                </span>
              )}
          </div>
        </div>

        {/* Available Roles to Add */}
        {effectiveAvailableRoles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t("availableRoles")}
            </h4>
            <div className="flex flex-col gap-2">
              {effectiveAvailableRoles.map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getRoleDisplayName(role)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {BusinessRoleUtils.getRoleDescription(role)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRoleClick(role)}
                    disabled={isAddingRole || !canAddRole(role)}
                    className="ml-3"
                  >
                    {isAddingRole ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t("adding")}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addRole")}
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Available Roles Message */}
        {effectiveAvailableRoles.length === 0 && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              {t("allRolesActive")}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto text-destructive hover:text-destructive"
            >
              {t("dismiss")}
            </Button>
          </div>
        )}

        {/* Role Addition Modal */}
        <RoleAdditionModal
          isOpen={isModalOpen}
          role={selectedRole}
          company={company}
          onClose={handleModalClose}
          onConfirm={handleRoleAdditionConfirm}
          isLoading={isAddingRole}
        />
      </CardContent>
    </Card>
  );
};

export default CompanyRoleManagementCard;
