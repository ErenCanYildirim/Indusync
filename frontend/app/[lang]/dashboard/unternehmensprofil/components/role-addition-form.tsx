"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building,
  MapPin,
  FileText,
  Users,
  Mail,
  Phone,
  Clock,
  Award,
  ChevronRight,
  Upload,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { FileUploadField } from "./file-upload-field";
import { cn } from "@/lib/utils";
import {
  BusinessRole,
  BusinessRoleUtils,
  AddBusinessRoleData,
  AddBusinessRoleSchema,
} from "@/lib/types/company-role-management";
import {
  actual_specializations,
  industryCategories,
  type Specialization,
  type IndustryCategory,
} from "@/lib/constants/form-options";
import type { CompanyProfile } from "@/lib/api/types";

interface RoleAdditionFormProps {
  /** The role being added */
  role: BusinessRole;
  /** Current company data for pre-filling */
  company?: CompanyProfile | null;
  /** Callback when form is submitted */
  onSubmit: (data: AddBusinessRoleData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is submitting */
  isLoading?: boolean;
}

// Reused SpecializationSelector component from registration
const SpecializationSelector = ({
  specializations,
  selectedSpecializations,
  expandedSpecializations,
  onSpecializationChange,
  onToggleSpecialization,
  idPrefix = "spec",
  level = 0,
}: {
  specializations: Specialization[];
  selectedSpecializations: string[];
  expandedSpecializations: string[];
  onSpecializationChange: (specializationId: string) => void;
  onToggleSpecialization: (specializationId: string) => void;
  idPrefix?: string;
  level?: number;
}) => {
  if (level === 0) {
    return (
      <div className="space-y-1 border rounded-lg divide-y">
        {specializations.map((spec) => (
          <div key={spec.id} className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onToggleSpecialization(spec.id)}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-${spec.id}`}
                  checked={selectedSpecializations.includes(spec.id)}
                  onCheckedChange={() => onSpecializationChange(spec.id)}
                />
                <label
                  htmlFor={`${idPrefix}-${spec.id}`}
                  className="text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {spec.name}
                </label>
              </div>
              {spec.subCategories && spec.subCategories.length > 0 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSpecializations.includes(spec.id) && "rotate-90"
                  )}
                />
              )}
            </div>

            {spec.subCategories &&
              spec.subCategories.length > 0 &&
              expandedSpecializations.includes(spec.id) && (
                <div className="ml-6 mt-2 space-y-1">
                  <SpecializationSelector
                    specializations={spec.subCategories || []}
                    selectedSpecializations={selectedSpecializations}
                    expandedSpecializations={expandedSpecializations}
                    onSpecializationChange={onSpecializationChange}
                    onToggleSpecialization={onToggleSpecialization}
                    idPrefix={`${idPrefix}-${spec.id}`}
                    level={level + 1}
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {specializations.map((spec) => {
        const hasSubCategories =
          spec.subCategories && spec.subCategories.length > 0;
        const subCategories = spec.subCategories || [];

        return (
          <div key={spec.id} className="space-y-1">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() =>
                hasSubCategories && onToggleSpecialization(spec.id)
              }
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-${spec.id}`}
                  checked={selectedSpecializations.includes(spec.id)}
                  onCheckedChange={() => onSpecializationChange(spec.id)}
                />
                <label
                  htmlFor={`${idPrefix}-${spec.id}`}
                  className="text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {spec.name}
                </label>
              </div>
              {hasSubCategories && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSpecializations.includes(spec.id) && "rotate-90"
                  )}
                />
              )}
            </div>

            {hasSubCategories && expandedSpecializations.includes(spec.id) && (
              <div className="ml-6 mt-1 space-y-1">
                <SpecializationSelector
                  specializations={subCategories}
                  selectedSpecializations={selectedSpecializations}
                  expandedSpecializations={expandedSpecializations}
                  onSpecializationChange={onSpecializationChange}
                  onToggleSpecialization={onToggleSpecialization}
                  idPrefix={`${idPrefix}-${spec.id}`}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Reused IndustrySelector component from registration
const IndustrySelector = ({
  industryCategories,
  selectedIndustries,
  expandedCategories,
  onIndustryChange,
  onToggleCategory,
  idPrefix = "industry",
}: {
  industryCategories: IndustryCategory[];
  selectedIndustries: string[];
  expandedCategories: string[];
  onIndustryChange: (industryId: string) => void;
  onToggleCategory: (categoryId: string) => void;
  idPrefix?: string;
}) => {
  return (
    <div className="space-y-1 border rounded-lg divide-y">
      {industryCategories.map((category) => (
        <div key={category.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => onToggleCategory(category.id)}
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${idPrefix}-${category.id}`}
                checked={selectedIndustries.includes(category.id)}
                onCheckedChange={() => onIndustryChange(category.id)}
              />
              <label
                htmlFor={`${idPrefix}-${category.id}`}
                className="text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {category.label}
              </label>
            </div>
            {category.subcategories && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expandedCategories.includes(category.id) && "rotate-90"
                )}
              />
            )}
          </div>
          {category.subcategories &&
            expandedCategories.includes(category.id) && (
              <div className="ml-6 mt-2 space-y-1">
                {category.subcategories.map((subcat) => (
                  <div key={subcat.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => onToggleCategory(subcat.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${idPrefix}-${subcat.id}`}
                          checked={selectedIndustries.includes(subcat.id)}
                          onCheckedChange={() => onIndustryChange(subcat.id)}
                        />
                        <label
                          htmlFor={`${idPrefix}-${subcat.id}`}
                          className="text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {subcat.label}
                        </label>
                      </div>
                      {subcat.subcategories && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            expandedCategories.includes(subcat.id) &&
                              "rotate-90"
                          )}
                        />
                      )}
                    </div>
                    {subcat.subcategories &&
                      expandedCategories.includes(subcat.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {subcat.subcategories.map((subsubcat) => (
                            <div
                              key={subsubcat.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`${idPrefix}-${subsubcat.id}`}
                                checked={selectedIndustries.includes(
                                  subsubcat.id
                                )}
                                onCheckedChange={() =>
                                  onIndustryChange(subsubcat.id)
                                }
                              />
                              <label
                                htmlFor={`${idPrefix}-${subsubcat.id}`}
                                className="text-sm"
                              >
                                {subsubcat.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

/**
 * RoleAdditionForm component for adding business roles to companies.
 * Reuses registration components for consistency and follows the same patterns.
 *
 * Features:
 * - Conditional field display based on role (AG vs AN)
 * - Pre-fills form with existing company data
 * - Reuses SpecializationSelector and IndustrySelector from registration
 * - File upload support for verification documents
 * - Form validation with Zod schema
 * - Responsive design with proper accessibility
 */
export const RoleAdditionForm: React.FC<RoleAdditionFormProps> = ({
  role,
  company,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const t = useTranslations("Dashboard.companyProfile.roleManagement");
  const currentLocale = useLocale();

  // State for specialization and industry selection
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);
  const [expandedSpecializations, setExpandedSpecializations] = useState<
    string[]
  >([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // State for file uploads (following registration pattern)
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [certificatesFile, setCertificatesFile] = useState<File | null>(null);

  // State for file validation errors
  const [verificationFileError, setVerificationFileError] = useState<
    string | null
  >(null);
  const [certificatesFileError, setCertificatesFileError] = useState<
    string | null
  >(null);

  // Initialize form with pre-filled data from existing company
  const form = useForm<AddBusinessRoleData>({
    resolver: zodResolver(AddBusinessRoleSchema),
    defaultValues: {
      role,
      specializations: company?.specializations || [],
      industries: company?.industries || [],
      orderCategories: company?.orderCategories || [],
      workRadiusKm: company?.workRadiusKm || undefined,
      description: company?.description || "",
      certifications: company?.certifications || [],
      contactPersonName: company?.contactPersonName || "",
      contactPersonEmail: company?.contactEmail || "",
      contactPersonPhone: company?.contactPhone || "",
      employeeCount: company?.employeeCount || undefined,
      businessHours: company?.businessHours || "",
      verificationDocumentUrl: "",
      certificatesDocumentUrl: "",
      _verificationFile: undefined,
      _certificatesFile: undefined,
    },
  });

  // Pre-fill specializations and industries from company data
  useEffect(() => {
    if (company?.specializations) {
      setSelectedSpecializations(company.specializations);
    }
    if (company?.industries) {
      setSelectedIndustries(company.industries);
    }
  }, [company]);

  // Update form when selections change
  useEffect(() => {
    form.setValue("specializations", selectedSpecializations);
  }, [selectedSpecializations, form]);

  useEffect(() => {
    form.setValue("industries", selectedIndustries);
  }, [selectedIndustries, form]);

  // Update form when file selections change
  useEffect(() => {
    form.setValue("_verificationFile", verificationFile || undefined);
  }, [verificationFile, form]);

  useEffect(() => {
    form.setValue("_certificatesFile", certificatesFile || undefined);
  }, [certificatesFile, form]);

  // Handle specialization selection
  const handleSpecializationChange = (specializationId: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specializationId)
        ? prev.filter((id) => id !== specializationId)
        : [...prev, specializationId]
    );
  };

  // Handle specialization expansion
  const handleToggleSpecialization = (specializationId: string) => {
    setExpandedSpecializations((prev) =>
      prev.includes(specializationId)
        ? prev.filter((id) => id !== specializationId)
        : [...prev, specializationId]
    );
  };

  // Handle industry selection
  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industryId)
        ? prev.filter((id) => id !== industryId)
        : [...prev, industryId]
    );
  };

  // Handle industry category expansion
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle form submission with enhanced validation
  const handleSubmit = async (data: AddBusinessRoleData) => {
    console.log("Form submission started with data:", data);

    // Prevent submission during loading
    if (isLoading) {
      console.log("Form submission prevented - already loading");
      return;
    }

    // Clear any existing form errors
    form.clearErrors();

    try {
      // Perform additional client-side validation
      const validationErrors = validateFormData(data);
      if (validationErrors.length > 0) {
        // Set field-specific errors
        validationErrors.forEach(({ field, message }) => {
          form.setError(field as keyof AddBusinessRoleData, {
            type: "manual",
            message,
          });
        });
        return;
      }

      // Include file objects in the submission data
      const submissionData: AddBusinessRoleData = {
        ...data,
        _verificationFile: verificationFile || undefined,
        _certificatesFile: certificatesFile || undefined,
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error submitting role addition form:", error);

      // Handle API validation errors
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Try to parse field-specific errors from API response
        try {
          const parsedError = JSON.parse(errorMessage);
          if (parsedError.fieldErrors) {
            Object.entries(parsedError.fieldErrors).forEach(
              ([field, message]) => {
                form.setError(field as keyof AddBusinessRoleData, {
                  type: "server",
                  message: message as string,
                });
              }
            );
          } else {
            // Set general form error
            form.setError("root", {
              type: "server",
              message: parsedError.message || errorMessage,
            });
          }
        } catch {
          // Set general form error if parsing fails
          form.setError("root", {
            type: "server",
            message: errorMessage,
          });
        }
      }
    }
  };

  // Enhanced client-side validation function
  const validateFormData = (
    data: AddBusinessRoleData
  ): Array<{ field: string; message: string }> => {
    const errors: Array<{ field: string; message: string }> = [];

    console.log("Validating form data:", data);

    // Role-specific validation for Auftragnehmer
    if (data.role === BusinessRole.AUFTRAGNEHMER) {
      // Specializations validation
      if (!data.specializations || data.specializations.length === 0) {
        errors.push({
          field: "specializations",
          message:
            currentLocale === "en"
              ? "At least one specialization is required for the Service Provider role."
              : "Mindestens eine Spezialisierung ist für die Auftragnehmer-Rolle erforderlich.",
        });
      }

      // Industries validation
      if (!data.industries || data.industries.length === 0) {
        errors.push({
          field: "industries",
          message:
            currentLocale === "en"
              ? "At least one industry is required for the Service Provider role."
              : "Mindestens eine Branche ist für die Auftragnehmer-Rolle erforderlich.",
        });
      }

      // Work radius validation
      if (
        !data.workRadiusKm ||
        data.workRadiusKm < 1 ||
        data.workRadiusKm > 1000
      ) {
        errors.push({
          field: "workRadiusKm",
          message:
            currentLocale === "en"
              ? "Work radius must be between 1 and 1000 km."
              : "Arbeitsradius muss zwischen 1 und 1000 km liegen.",
        });
      }

      // Description validation
      if (!data.description || data.description.trim().length < 10) {
        errors.push({
          field: "description",
          message:
            currentLocale === "en"
              ? "Company description must be at least 10 characters long."
              : "Unternehmensbeschreibung muss mindestens 10 Zeichen lang sein.",
        });
      }

      if (data.description && data.description.length > 600) {
        errors.push({
          field: "description",
          message:
            currentLocale === "en"
              ? "Company description cannot exceed 600 characters."
              : "Unternehmensbeschreibung darf maximal 600 Zeichen lang sein.",
        });
      }

      // Contact person name validation
      if (!data.contactPersonName || data.contactPersonName.trim().length < 2) {
        errors.push({
          field: "contactPersonName",
          message:
            currentLocale === "en"
              ? "Contact person name must be at least 2 characters long."
              : "Name des Ansprechpartners muss mindestens 2 Zeichen lang sein.",
        });
      }

      if (data.contactPersonName && data.contactPersonName.length > 200) {
        errors.push({
          field: "contactPersonName",
          message:
            currentLocale === "en"
              ? "Contact person name cannot exceed 200 characters."
              : "Name des Ansprechpartners darf maximal 200 Zeichen lang sein.",
        });
      }

      // Contact person email validation
      if (!data.contactPersonEmail || !isValidEmail(data.contactPersonEmail)) {
        errors.push({
          field: "contactPersonEmail",
          message:
            currentLocale === "en"
              ? "A valid contact person email is required."
              : "Eine gültige E-Mail-Adresse des Ansprechpartners ist erforderlich.",
        });
      }

      if (data.contactPersonEmail && data.contactPersonEmail.length > 255) {
        errors.push({
          field: "contactPersonEmail",
          message:
            currentLocale === "en"
              ? "Contact person email cannot exceed 255 characters."
              : "E-Mail des Ansprechpartners darf maximal 255 Zeichen lang sein.",
        });
      }

      // Employee count validation
      if (
        !data.employeeCount ||
        data.employeeCount < 1 ||
        data.employeeCount > 100000
      ) {
        errors.push({
          field: "employeeCount",
          message:
            currentLocale === "en"
              ? "Employee count must be between 1 and 100,000."
              : "Mitarbeiteranzahl muss zwischen 1 und 100.000 liegen.",
        });
      }

      // Contact phone validation (optional but if provided, must be valid)
      if (
        data.contactPersonPhone &&
        (data.contactPersonPhone.length < 5 ||
          data.contactPersonPhone.length > 20)
      ) {
        errors.push({
          field: "contactPersonPhone",
          message:
            currentLocale === "en"
              ? "Contact phone number must be between 5 and 20 characters."
              : "Kontakt-Telefonnummer muss zwischen 5 und 20 Zeichen lang sein.",
        });
      }

      // Business hours validation (optional but if provided, must not exceed limit)
      if (data.businessHours && data.businessHours.length > 500) {
        errors.push({
          field: "businessHours",
          message:
            currentLocale === "en"
              ? "Business hours cannot exceed 500 characters."
              : "Öffnungszeiten dürfen maximal 500 Zeichen lang sein.",
        });
      }

      // File validation for Auftragnehmer role
      if (!verificationFile && !data.verificationDocumentUrl) {
        errors.push({
          field: "_verificationFile",
          message:
            currentLocale === "en"
              ? "Verification document is required for the Service Provider role."
              : "Verifizierungsdokument ist für die Auftragnehmer-Rolle erforderlich.",
        });
      }
    }

    return errors;
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Get role display name
  const roleDisplayName = BusinessRoleUtils.getDisplayName(role);
  const getLocalizedRoleDisplayName = (role: BusinessRole): string => {
    if (currentLocale === "en") {
      return role === BusinessRole.AUFTRAGGEBER ? "Client" : "Service Provider";
    }
    return roleDisplayName;
  };

  // Check if role requires specialization data (AN role)
  const requiresSpecializationData =
    BusinessRoleUtils.requiresSpecializationData(role);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Auftraggeber Role - No additional fields required */}
          {role === BusinessRole.AUFTRAGGEBER && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {currentLocale === "en"
                    ? "Client Role"
                    : "Auftraggeber-Rolle"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    {currentLocale === "en"
                      ? "No additional information is required for the Client role. You can add this role immediately."
                      : "Für die Auftraggeber-Rolle sind keine zusätzlichen Informationen erforderlich. Sie können diese Rolle sofort hinzufügen."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auftragnehmer Role - Requires additional information */}
          {role === BusinessRole.AUFTRAGNEHMER && (
            <>
              {/* Specializations Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {currentLocale === "en"
                      ? "Specializations"
                      : "Spezialisierungen"}
                    <Badge variant="destructive" className="text-xs">
                      {currentLocale === "en" ? "Required" : "Erforderlich"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="specializations"
                    render={({ field }) => (
                      <FormItem>
                        <FormDescription>
                          {currentLocale === "en"
                            ? "Select the specializations that best describe your company's expertise."
                            : "Wählen Sie die Spezialisierungen aus, die die Expertise Ihres Unternehmens am besten beschreiben."}
                        </FormDescription>
                        <FormControl>
                          <SpecializationSelector
                            specializations={actual_specializations}
                            selectedSpecializations={selectedSpecializations}
                            expandedSpecializations={expandedSpecializations}
                            onSpecializationChange={handleSpecializationChange}
                            onToggleSpecialization={handleToggleSpecialization}
                            idPrefix="role-spec"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Industries Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {currentLocale === "en" ? "Industries" : "Branchen"}
                    <Badge variant="destructive" className="text-xs">
                      {currentLocale === "en" ? "Required" : "Erforderlich"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="industries"
                    render={({ field }) => (
                      <FormItem>
                        <FormDescription>
                          {currentLocale === "en"
                            ? "Select the industries your company operates in."
                            : "Wählen Sie die Branchen aus, in denen Ihr Unternehmen tätig ist."}
                        </FormDescription>
                        <FormControl>
                          <IndustrySelector
                            industryCategories={industryCategories}
                            selectedIndustries={selectedIndustries}
                            expandedCategories={expandedCategories}
                            onIndustryChange={handleIndustryChange}
                            onToggleCategory={handleToggleCategory}
                            idPrefix="role-industry"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Company Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {currentLocale === "en"
                      ? "Company Details"
                      : "Unternehmensdetails"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workRadiusKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Work Radius (km)"
                              : "Arbeitsradius (km)"}
                            <Badge variant="destructive" className="text-xs">
                              {currentLocale === "en"
                                ? "Required"
                                : "Erforderlich"}
                            </Badge>
                            {field.value &&
                              field.value >= 1 &&
                              field.value <= 1000 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="1000"
                              placeholder={
                                currentLocale === "en" ? "e.g., 50" : "z.B. 50"
                              }
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {currentLocale === "en"
                              ? "Maximum distance you're willing to travel for projects"
                              : "Maximale Entfernung, die Sie für Projekte zu reisen bereit sind"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Employee Count"
                              : "Anzahl Mitarbeiter"}
                            <Badge variant="destructive" className="text-xs">
                              {currentLocale === "en"
                                ? "Required"
                                : "Erforderlich"}
                            </Badge>
                            {field.value &&
                              field.value >= 1 &&
                              field.value <= 100000 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder={
                                currentLocale === "en" ? "e.g., 10" : "z.B. 10"
                              }
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {currentLocale === "en"
                            ? "Company Description"
                            : "Unternehmensbeschreibung"}
                          <Badge variant="destructive" className="text-xs">
                            {currentLocale === "en"
                              ? "Required"
                              : "Erforderlich"}
                          </Badge>
                          {field.value &&
                            field.value.trim().length >= 10 &&
                            field.value.length <= 600 && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              currentLocale === "en"
                                ? "Describe your company's services, expertise, and what makes you unique..."
                                : "Beschreiben Sie die Dienstleistungen, Expertise und Besonderheiten Ihres Unternehmens..."
                            }
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between">
                          <span>
                            {currentLocale === "en"
                              ? "Minimum 10 characters. This will be visible to potential clients."
                              : "Mindestens 10 Zeichen. Dies wird für potenzielle Kunden sichtbar sein."}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              field.value && field.value.length > 600
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            {field.value ? field.value.length : 0}/600
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {currentLocale === "en"
                      ? "Contact Information"
                      : "Kontaktinformationen"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Contact Person Name"
                              : "Name des Ansprechpartners"}
                            <Badge variant="destructive" className="text-xs">
                              {currentLocale === "en"
                                ? "Required"
                                : "Erforderlich"}
                            </Badge>
                            {field.value &&
                              field.value.trim().length >= 2 &&
                              field.value.length <= 200 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                currentLocale === "en"
                                  ? "Full name"
                                  : "Vollständiger Name"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPersonPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Contact Phone"
                              : "Kontakt-Telefon"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder={
                                currentLocale === "en"
                                  ? "+49 123 456789"
                                  : "+49 123 456789"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Contact Email"
                              : "Kontakt-E-Mail"}
                            <Badge variant="destructive" className="text-xs">
                              {currentLocale === "en"
                                ? "Required"
                                : "Erforderlich"}
                            </Badge>
                            {field.value &&
                              isValidEmail(field.value) &&
                              field.value.length <= 255 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={
                                currentLocale === "en"
                                  ? "contact@company.com"
                                  : "kontakt@unternehmen.de"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {currentLocale === "en"
                              ? "Business Hours"
                              : "Geschäftszeiten"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                currentLocale === "en"
                                  ? "Mon-Fri 9:00-17:00"
                                  : "Mo-Fr 9:00-17:00"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Section - Only for Auftragnehmer role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {currentLocale === "en"
                      ? "Document Upload"
                      : "Dokument-Upload"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {currentLocale === "en"
                      ? "Upload verification documents to complete your contractor role addition. These documents help verify your company's credentials and capabilities."
                      : "Laden Sie Verifizierungsdokumente hoch, um die Hinzufügung Ihrer Auftragnehmer-Rolle abzuschließen. Diese Dokumente helfen bei der Überprüfung der Referenzen und Fähigkeiten Ihres Unternehmens."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Verification Document Upload */}
                    <FormField
                      control={form.control}
                      name="_verificationFile"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <FileUploadField
                              id="companyVerification"
                              name="companyVerification"
                              label={
                                currentLocale === "en"
                                  ? "Company Verification"
                                  : "Unternehmensverifizierung"
                              }
                              placeholder={
                                currentLocale === "en"
                                  ? "Select verification document..."
                                  : "Verifizierungsdokument auswählen..."
                              }
                              file={verificationFile}
                              onFileChange={(file) => {
                                setVerificationFile(file);
                                field.onChange(file || undefined);
                                // Clear validation error when file is successfully selected
                                if (file) {
                                  setVerificationFileError(null);
                                  form.clearErrors("_verificationFile");
                                }
                              }}
                              onValidationError={(error) => {
                                setVerificationFileError(error);
                                if (error) {
                                  form.setError("_verificationFile", {
                                    type: "validation",
                                    message: error,
                                  });
                                }
                              }}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              error={
                                fieldState.error?.message ||
                                verificationFileError ||
                                undefined
                              }
                              helpText={
                                currentLocale === "en"
                                  ? "Upload business registration, tax certificate, or similar official documents (PDF, DOC, DOCX, JPG, PNG)"
                                  : "Laden Sie Gewerbeanmeldung, Steuerbescheinigung oder ähnliche offizielle Dokumente hoch (PDF, DOC, DOCX, JPG, PNG)"
                              }
                              disabled={isLoading}
                              required={role === BusinessRole.AUFTRAGNEHMER}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Certificates Document Upload */}
                    <FormField
                      control={form.control}
                      name="_certificatesFile"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <FileUploadField
                              id="companyCertificates"
                              name="companyCertificates"
                              label={
                                currentLocale === "en"
                                  ? "Certificates & Qualifications"
                                  : "Zertifikate & Qualifikationen"
                              }
                              placeholder={
                                currentLocale === "en"
                                  ? "Select certificates document..."
                                  : "Zertifikatsdokument auswählen..."
                              }
                              file={certificatesFile}
                              onFileChange={(file) => {
                                setCertificatesFile(file);
                                field.onChange(file || undefined);
                                // Clear validation error when file is successfully selected
                                if (file) {
                                  setCertificatesFileError(null);
                                  form.clearErrors("_certificatesFile");
                                }
                              }}
                              onValidationError={(error) => {
                                setCertificatesFileError(error);
                                if (error) {
                                  form.setError("_certificatesFile", {
                                    type: "validation",
                                    message: error,
                                  });
                                }
                              }}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              error={
                                fieldState.error?.message ||
                                certificatesFileError ||
                                undefined
                              }
                              helpText={
                                currentLocale === "en"
                                  ? "Upload professional certifications, licenses, or qualification documents (Optional)"
                                  : "Laden Sie berufliche Zertifizierungen, Lizenzen oder Qualifikationsdokumente hoch (Optional)"
                              }
                              disabled={isLoading}
                              required={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* File Upload Guidelines */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">
                          {currentLocale === "en"
                            ? "File Upload Guidelines"
                            : "Richtlinien für Datei-Upload"}
                        </p>
                        <ul className="text-blue-700 space-y-1">
                          <li>
                            {currentLocale === "en"
                              ? "• Maximum file size: 10MB per file"
                              : "• Maximale Dateigröße: 10MB pro Datei"}
                          </li>
                          <li>
                            {currentLocale === "en"
                              ? "• Supported formats: PDF, DOC, DOCX, JPG, PNG"
                              : "• Unterstützte Formate: PDF, DOC, DOCX, JPG, PNG"}
                          </li>
                          <li>
                            {currentLocale === "en"
                              ? "• Documents will be reviewed for verification"
                              : "• Dokumente werden zur Verifizierung überprüft"}
                          </li>
                          <li>
                            {currentLocale === "en"
                              ? "• Clear, readable documents are preferred"
                              : "• Klare, lesbare Dokumente werden bevorzugt"}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Form-level Error Display */}
          {form.formState.errors.root && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={isLoading || form.formState.isSubmitting}
            >
              {isLoading || form.formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {currentLocale === "en"
                    ? "Adding Role..."
                    : "Rolle wird hinzugefügt..."}
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 mr-2" />
                  {currentLocale === "en" ? "Add Role" : "Rolle hinzufügen"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RoleAdditionForm;
