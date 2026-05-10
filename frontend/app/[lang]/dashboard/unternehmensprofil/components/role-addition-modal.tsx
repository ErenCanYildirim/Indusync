"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  MapPin,
  Building,
  Phone,
  Mail,
  Clock,
  Award,
} from "lucide-react";
import {
  BusinessRole,
  BusinessRoleUtils,
  RoleRequirements,
  AddBusinessRoleData,
} from "@/lib/types/company-role-management";
import type { CompanyProfile } from "@/lib/api/types";

interface RoleAdditionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The role being added */
  role: BusinessRole | null;
  /** Current company data */
  company?: CompanyProfile | null;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when user confirms to proceed with role addition */
  onConfirm: (role: BusinessRole) => void;
  /** Whether the role addition is in progress */
  isLoading?: boolean;
}

/**
 * RoleAdditionModal component displays role requirements and description
 * before allowing the user to proceed with adding a business role.
 *
 * Features:
 * - Shows role description and benefits
 * - Displays required and optional fields
 * - Provides confirmation step before proceeding to form
 * - Handles modal state and user interactions
 * - Responsive design with proper accessibility
 */
export const RoleAdditionModal: React.FC<RoleAdditionModalProps> = ({
  isOpen,
  role,
  company,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const t = useTranslations("Dashboard.companyProfile.roleManagement");
  const currentLocale = useLocale();

  // Don't render if no role is selected
  if (!role) return null;

  // Get role requirements and information
  const roleRequirements = BusinessRoleUtils.getRoleRequirements(role);
  const roleDisplayName = BusinessRoleUtils.getDisplayName(role);
  const roleDescription = BusinessRoleUtils.getRoleDescription(role);

  // Get localized role display name
  const getLocalizedRoleDisplayName = (role: BusinessRole): string => {
    if (currentLocale === "en") {
      return role === BusinessRole.AUFTRAGGEBER ? "Client" : "Service Provider";
    }
    return roleDisplayName;
  };

  // Get localized role description
  const getLocalizedRoleDescription = (role: BusinessRole): string => {
    if (currentLocale === "en") {
      return role === BusinessRole.AUFTRAGGEBER
        ? "Enables creating orders and hiring service providers"
        : "Enables offering services and fulfilling orders";
    }
    return roleDescription;
  };

  // Get field display names for requirements
  const getFieldDisplayName = (fieldName: string): string => {
    const fieldTranslations: Record<string, { de: string; en: string }> = {
      specializations: { de: "Spezialisierungen", en: "Specializations" },
      industries: { de: "Branchen", en: "Industries" },
      workRadiusKm: { de: "Arbeitsradius", en: "Work Radius" },
      description: {
        de: "Unternehmensbeschreibung",
        en: "Company Description",
      },
      contactPersonName: {
        de: "Name des Ansprechpartners",
        en: "Contact Person Name",
      },
      contactPersonEmail: {
        de: "E-Mail des Ansprechpartners",
        en: "Contact Person Email",
      },
      orderCategories: { de: "Auftragskategorien", en: "Order Categories" },
      certifications: { de: "Zertifizierungen", en: "Certifications" },
      contactPersonPhone: {
        de: "Telefon des Ansprechpartners",
        en: "Contact Person Phone",
      },
      employeeCount: { de: "Anzahl Mitarbeiter", en: "Employee Count" },
      businessHours: { de: "Geschäftszeiten", en: "Business Hours" },
      verificationDocumentUrl: {
        de: "Verifizierungsdokument",
        en: "Verification Document",
      },
      certificatesDocumentUrl: {
        de: "Zertifikatsdokument",
        en: "Certificates Document",
      },
    };

    const translation = fieldTranslations[fieldName];
    if (!translation) return fieldName;

    return currentLocale === "en" ? translation.en : translation.de;
  };

  // Get field icon
  const getFieldIcon = (fieldName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      specializations: <Building className="h-4 w-4" />,
      industries: <Building className="h-4 w-4" />,
      workRadiusKm: <MapPin className="h-4 w-4" />,
      description: <FileText className="h-4 w-4" />,
      contactPersonName: <Users className="h-4 w-4" />,
      contactPersonEmail: <Mail className="h-4 w-4" />,
      contactPersonPhone: <Phone className="h-4 w-4" />,
      employeeCount: <Users className="h-4 w-4" />,
      businessHours: <Clock className="h-4 w-4" />,
      certifications: <Award className="h-4 w-4" />,
      verificationDocumentUrl: <FileText className="h-4 w-4" />,
      certificatesDocumentUrl: <FileText className="h-4 w-4" />,
    };

    return iconMap[fieldName] || <CheckCircle className="h-4 w-4" />;
  };

  // Handle confirm button click
  const handleConfirm = () => {
    onConfirm(role);
  };

  // Get role benefits based on role type
  const getRoleBenefits = (role: BusinessRole): string[] => {
    if (currentLocale === "en") {
      return role === BusinessRole.AUFTRAGGEBER
        ? [
            "Create and manage orders",
            "Search and hire service providers",
            "Access to order management tools",
            "Direct communication with contractors",
          ]
        : [
            "Receive and respond to order requests",
            "Showcase your services and expertise",
            "Build your professional reputation",
            "Access to project management tools",
          ];
    }

    return role === BusinessRole.AUFTRAGGEBER
      ? [
          "Aufträge erstellen und verwalten",
          "Dienstleister suchen und beauftragen",
          "Zugang zu Auftragsverwaltungstools",
          "Direkte Kommunikation mit Auftragnehmern",
        ]
      : [
          "Auftragsanfragen erhalten und beantworten",
          "Ihre Dienstleistungen und Expertise präsentieren",
          "Ihren professionellen Ruf aufbauen",
          "Zugang zu Projektmanagement-Tools",
        ];
  };

  const roleBenefits = getRoleBenefits(role);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant={
                role === BusinessRole.AUFTRAGGEBER ? "default" : "outline"
              }
            >
              {getLocalizedRoleDisplayName(role)}
            </Badge>
            {currentLocale === "en" ? "Role Addition" : "Rolle hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            {getLocalizedRoleDescription(role)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Role Benefits Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {currentLocale === "en"
                  ? "Benefits of this role:"
                  : "Vorteile dieser Rolle:"}
              </h4>
              <ul className="space-y-2">
                {roleBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Requirements Section */}
            {roleRequirements.requiredFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  {currentLocale === "en"
                    ? "Required Information:"
                    : "Erforderliche Informationen:"}
                </h4>
                <div className="grid gap-2">
                  {roleRequirements.requiredFields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center gap-2 text-sm p-2 bg-orange-50 rounded-md"
                    >
                      {getFieldIcon(field)}
                      <span>{getFieldDisplayName(field)}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {currentLocale === "en" ? "Required" : "Erforderlich"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Fields Section */}
            {roleRequirements.optionalFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  {currentLocale === "en"
                    ? "Optional Information:"
                    : "Optionale Informationen:"}
                </h4>
                <div className="grid gap-2">
                  {roleRequirements.optionalFields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded-md"
                    >
                      {getFieldIcon(field)}
                      <span>{getFieldDisplayName(field)}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {currentLocale === "en" ? "Optional" : "Optional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Flow Notice */}
            {roleRequirements.followsRegistrationFlow && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      {currentLocale === "en"
                        ? "Registration Process"
                        : "Registrierungsprozess"}
                    </p>
                    <p className="text-blue-700">
                      {currentLocale === "en"
                        ? "This role addition follows the same process as the initial registration. You'll be guided through each step to provide the necessary information."
                        : "Diese Rollenerweiterung folgt dem gleichen Prozess wie die ursprüngliche Registrierung. Sie werden durch jeden Schritt geführt, um die notwendigen Informationen bereitzustellen."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No Additional Requirements */}
            {roleRequirements.requiredFields.length === 0 &&
              roleRequirements.optionalFields.length === 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-700">
                      {currentLocale === "en"
                        ? "No additional information is required for this role. You can add it immediately."
                        : "Für diese Rolle sind keine zusätzlichen Informationen erforderlich. Sie können sie sofort hinzufügen."}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {currentLocale === "en" ? "Cancel" : "Abbrechen"}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {currentLocale === "en"
                  ? "Processing..."
                  : "Wird verarbeitet..."}
              </>
            ) : (
              <>{currentLocale === "en" ? "Continue" : "Weiter"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleAdditionModal;
