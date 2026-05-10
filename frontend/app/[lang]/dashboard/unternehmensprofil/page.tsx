"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Eye, FileText, Award, Users } from "lucide-react";
import { useCompany } from "@/lib/hooks/useCompany";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  validateCompanyProfile,
  sanitizeCompanyProfile,
  formatValidationErrors,
} from "./validation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import LogoBasicsCard from "./components/logo-basics-card";
import AddressCard from "./components/address-card";
import ContactCard from "./components/contact-card";
import TaxCard from "./components/tax-card";
import MetaCard from "./components/meta-card";
import CompanyRoleManagementCard from "./components/company-role-management-card";
import EditableSpecializationsCard from "./components/editable-specializations-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessRole } from "@/lib/types/company-role-management";
import { CompanyDocumentsCard } from "@/components/CompanyDocumentsCard";
import { CompanyDocument } from "@/lib/api/types";
import { CompanyRatingsSection } from "@/components/company/CompanyRatingsSection";
import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";
import TermsConditionsCardFixed from "./components/terms-conditions-card-fixed";

// Helper type for local form state (matches backend UpdateCompanyRequest structure)
type LocalCompanyState = {
  companyId?: string;
  id?: string; // For backward compatibility
  name: string;
  logo: string;
  description?: string;
  businessHours?: string;
  workRadiusKm?: number;
  specializations?: string[];
  industries?: string[];
  orderCategories?: string[];
  isAuftraggeber?: boolean;
  isAuftragnehmer?: boolean;
  address: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  taxInfo: {
    vatNumber?: string;
    taxId?: string;
  };
};

const emptyCompanyData: LocalCompanyState = {
  name: "",
  logo: "",
  description: "",
  businessHours: "",
  workRadiusKm: undefined,
  specializations: [],
  industries: [],
  orderCategories: [],
  isAuftraggeber: false,
  isAuftragnehmer: false,
  address: {
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "",
  },
  contact: {
    phone: "",
    email: "",
    website: "",
  },
  taxInfo: { vatNumber: "", taxId: "" },
};

export default function CompanyProfilePage() {
  const t = useTranslations("Dashboard.companyProfile");
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch company data & actions
  const {
    company,
    updateCompany,
    uploadLogo,
    isUploadingLogo,
    isLoading: isCompanyLoading,
  } = useCompany();

  const [companyData, setCompanyData] =
    useState<LocalCompanyState>(emptyCompanyData);
  const [submitting, setSubmitting] = useState(false);
  const [logo, setLogo] = useState<string | null>(companyData.logo);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Synchronise backend data into local state when fetched
  useEffect(() => {
    if (company) {
      console.log("Loading company data:", company);
      setCompanyData({
        companyId: company.id,
        id: company.id,
        name: company.name || "",
        logo: company.logoUrl || "",
        description: company.description || "",
        businessHours: company.businessHours || "",
        workRadiusKm: company.workRadiusKm,
        specializations: company.specializations || [],
        industries: company.industries || [],
        orderCategories: company.orderCategories || [],
        isAuftraggeber: company.isAuftraggeber || false,
        isAuftragnehmer: company.isAuftragnehmer || false,
        address: {
          street: company.address?.street || "",
          houseNumber: company.address?.houseNumber || "",
          postalCode: company.address?.postalCode || "",
          city: company.address?.city || "",
          country: company.address?.country || "",
        },
        contact: {
          phone: company.contactPhone || "",
          email: company.contactEmail || "",
          website: company.website || "",
        },
        taxInfo: {
          vatNumber: company.vatNumber || "",
          taxId: company.taxId || "",
        },
      });
      setLogo(company.logoUrl || null);
    }
  }, [company]);

  const isLoading = submitting;

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      uploadLogo(file);
      // Since uploadLogo returns void, we need to get the URL from the company data
      // or create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setLogo(tempUrl);
      setCompanyData((prev) => ({ ...prev, logo: tempUrl }));
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error("Failed to upload logo. Please try again.");
    }
  };

  const handleInputChange = (
    section: keyof LocalCompanyState,
    field: string,
    value: string | string[] | number
  ) => {
    setCompanyData((prev) => {
      if (
        section === "address" ||
        section === "contact" ||
        section === "taxInfo"
      ) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      } else {
        return {
          ...prev,
          [section]: value,
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate the form data
      const validationResult = validateCompanyProfile(companyData);
      if (!validationResult.isValid) {
        const errorMessage = formatValidationErrors(validationResult.errors);
        toast.error(errorMessage);
        setSubmitting(false);
        return;
      }

      // Sanitize the data
      const sanitizedData = sanitizeCompanyProfile(companyData);

      // Update the company
      updateCompany(sanitizedData);
      toast.success("Company profile updated successfully!");
    } catch (error) {
      console.error("Failed to update company profile:", error);
      toast.error("Failed to update company profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state is now handled by loading.tsx file automatically by Next.js

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
        </div>

        {/* <div className="flex items-center gap-3">
          <button className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white font-semibold py-2.5 px-4 sm:px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out text-sm sm:text-base">
            {t("premium")}
          </button>
        </div> */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <LogoBasicsCard
              companyData={companyData}
              handleInputChange={handleInputChange}
              logo={logo}
              onPickLogo={() => fileInputRef.current?.click()}
              isUploadingLogo={isUploadingLogo}
            />

            {/* Meta information (companyType, status, roles) */}
            <MetaCard company={company} />

            {/* Role Management */}
            <CompanyRoleManagementCard
              company={company}
              onRoleAdded={async (role: BusinessRole) => {
                // Refresh company data when a role is added to ensure MetaCard updates
                console.log(`Role ${role} added successfully`);

                // Invalidate and refetch company data to update MetaCard and other components
                await queryClient.invalidateQueries({
                  queryKey: ["company", "profile"],
                });

                // Show success feedback
                const roleName =
                  role === BusinessRole.AUFTRAGGEBER
                    ? "Auftraggeber"
                    : "Auftragnehmer";
                toast.success(`${roleName}-Rolle erfolgreich hinzugefügt!`, {
                  description: "Ihr Unternehmensprofil wurde aktualisiert.",
                });
              }}
            />

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />

            <AddressCard
              companyData={companyData}
              handleInputChange={handleInputChange}
            />

            <ContactCard
              companyData={companyData}
              handleInputChange={handleInputChange}
            />

            <TaxCard
              companyData={companyData}
              handleInputChange={handleInputChange}
            />

            {company && company.isAuftragnehmer && (
              <EditableSpecializationsCard
                companyData={companyData}
                handleInputChange={handleInputChange}
              />
            )}

            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? t("saving") : t("saveChanges")}
              </Button>
            </div>
          </form>

          {/* Terms & Conditions Card - Outside the form to prevent interference */}
          {company?.companyId && (
            <ErrorBoundaryWrapper
              onError={(error, errorInfo) => {
                console.error("TermsConditionsCard error:", error, errorInfo);
                // Could integrate with error reporting service here
              }}
            >
              <TermsConditionsCardFixed
                companyId={company.companyId}
                companyName={company.name || ""}
              />
            </ErrorBoundaryWrapper>
          )}
        </div>

        {/* Right Column - Additional Information */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-blue-600" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {company?.isAuftraggeber && company?.isAuftragnehmer
                      ? "2"
                      : "1"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Roles</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {company?.specializations?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Specializations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Guidelines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                File Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs sm:text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Maximum file size: 10MB per file</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Supported formats: PDF, DOC, DOCX, JPG, PNG</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Documents will be reviewed for verification</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Clear, readable documents are preferred</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Company Ratings Section */}
      {!isCompanyLoading && company?.id && (
        <ErrorBoundaryWrapper
          onError={(error, errorInfo) => {
            console.error("CompanyRatingsSection error:", error, errorInfo);
            // Could integrate with error reporting service here
          }}
        >
          <CompanyRatingsSection
            companyId={company.id}
            onProjectClick={(orderId) => {
              // Navigate to detailed review page
              router.push(`/reviews/order/${orderId}`);
            }}
            className="mt-8"
          />
        </ErrorBoundaryWrapper>
      )}

      {/* Bottom Section - Documents, Projects, References */}
      <div className="space-y-6 lg:space-y-8">
        {/* Documents Section - Real Company Documents */}
        <CompanyDocumentsSection />

        {/* Past Projects Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t("pastProjects.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("pastProjects.projectName")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("pastProjects.date")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("pastProjects.rating")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("pastProjects.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        {
                          title: t("pastProjects.factoryAutomation"),
                          date: "01.07.2023",
                          rating: "4.8",
                          status: t("pastProjects.completed"),
                        },
                        {
                          title: t("pastProjects.sensorInstallation"),
                          date: "05.12.2023",
                          rating: "4.5",
                          status: t("pastProjects.completed"),
                        },
                        {
                          title: t("pastProjects.mqttApplication"),
                          date: "29.01.2024",
                          rating: "4.6",
                          status: t("pastProjects.completed"),
                        },
                      ].map((project) => (
                        <tr key={project.title} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                            {project.title}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                            {project.date}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                            ★ {project.rating}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* References Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("references.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("references.name")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("references.company")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("references.contact")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("references.rating")}
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {t("references.details")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        {
                          name: "Max Mustermann",
                          company: "Musterfirma GmbH",
                          contact: "max.mustermann@musterfirma.de",
                          rating: "4.9",
                        },
                        {
                          name: "Anna Schmidt",
                          company: "Tech Solutions AG",
                          contact: "anna.schmidt@techsolutions.com",
                          rating: "4.7",
                        },
                        {
                          name: "Peter Müller",
                          company: "Innovatech GmbH",
                          contact: "p.mueller@innovatech.de",
                          rating: "4.8",
                        },
                      ].map((ref) => (
                        <tr key={ref.name} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                            {ref.name}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                            {ref.company}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                            {ref.contact}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                            ★ {ref.rating}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              aria-label={t("references.viewRatingDetails")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}

// Component to handle company documents using data from company profile
function CompanyDocumentsSection() {
  const { company, isLoading } = useCompany();

  const handleViewDocument = (document: CompanyDocument) => {
    // Documents already have URLs, so we can open them directly
    if (document.url) {
      window.open(document.url, "_blank");
    } else {
      toast.error("Document URL not available.");
    }
  };

  const handleDownloadDocument = (document: CompanyDocument) => {
    // Documents already have URLs, so we can download them directly
    if (document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      toast.error("Document URL not available.");
    }
  };

  return (
    <CompanyDocumentsCard
      documents={company?.documents || []}
      isLoading={isLoading}
      error={undefined}
      onViewDocument={handleViewDocument}
      onDownloadDocument={handleDownloadDocument}
    />
  );
}
