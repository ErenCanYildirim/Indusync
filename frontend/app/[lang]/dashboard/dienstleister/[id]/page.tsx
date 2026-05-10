"use client";

import { use, useCallback } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Download,
  ArrowLeft,
  FilePlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Progress and Table imports - now using CompanyRatingsSection
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { CompanyDocumentsCard } from "@/components/CompanyDocumentsCard";
import { CompanyRatingsSection } from "@/components/company/CompanyRatingsSection";
import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";
import { TermsConditionsAccessButton } from "@/components/terms-conditions/terms-conditions-access-button";

export default function ServiceProviderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const t = useTranslations("ServiceProviderDetails");
  const router = useRouter();
  const { isProvider } = usePermissions();

  const handleBack = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const hasHistory = window.history.length > 1;
      const hasSameOriginReferrer =
        !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin;
      if (hasHistory || hasSameOriginReferrer) {
        router.back();
      } else {
        router.push("/dashboard/anfragen");
      }
    } catch {
      router.push("/dashboard/anfragen");
    }
  }, [router]);

  // Fetch real company profile data
  const {
    data: companyProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanyProfile(resolvedParams.id);

  // Mock data removed - now using real ratings data from CompanyRatingsSection

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center mb-4">
          <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 sm:h-8 w-full max-w-48" />
                    <Skeleton className="h-4 w-full max-w-32" />
                    <Skeleton className="h-4 w-full max-w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <Skeleton className="h-4 w-20 sm:w-24" />
                        <Skeleton className="h-4 w-10 sm:w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full max-w-24" />
                    <Skeleton className="h-3 w-full max-w-20" />
                    <Skeleton className="h-3 w-full max-w-32" />
                    <Skeleton className="h-3 w-full max-w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !companyProfile) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t("backToRequests")}</span>
            <span className="sm:hidden">{t("back")}</span>
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="break-words">
                {error?.message || t("errors.companyNotFound")}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button
                onClick={refetch}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Only show back to requests link for AN-only companies or companies with both roles */}
      {/* Hide for AG-only companies (as per requirement 4.1) */}
      {isProvider && (
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t("backToRequests")}</span>
            <span className="sm:hidden">{t("back")}</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left column - Provider info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card with basic info */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {companyProfile.logoUrl ? (
                    <Image
                      src={companyProfile.logoUrl}
                      alt={companyProfile.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                      {companyProfile.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold flex items-center flex-wrap gap-2">
                    <span className="break-words">{companyProfile.name}</span>
                    {companyProfile.verified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base break-words">
                    {companyProfile.city ||
                      companyProfile.formattedAddress ||
                      t("location")}
                  </p>
                  {companyProfile.description && (
                    <p className="text-sm text-muted-foreground mt-2 break-words">
                      {companyProfile.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                    {companyProfile.specializations
                      .slice(0, 3)
                      .map((spec, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs break-words max-w-full"
                        >
                          <span className="truncate">{spec}</span>
                        </Badge>
                      ))}
                    {companyProfile.specializations.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        +{companyProfile.specializations.length - 3} {t("more")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Ratings Section - Replaces mock score and past projects */}
          {companyProfile && (
            <ErrorBoundaryWrapper
              onError={(error, errorInfo) => {
                console.error("CompanyRatingsSection error:", error, errorInfo);
                // Could integrate with error reporting service here
              }}
            >
              <CompanyRatingsSection
                companyId={resolvedParams.id}
                onProjectClick={(orderId) => {
                  // Navigate to detailed review page
                  router.push(`/reviews/order/${orderId}`);
                }}
              />
            </ErrorBoundaryWrapper>
          )}

          {/* Documents section - using CompanyDocumentsCard component */}
          <CompanyDocumentsCard
            documents={companyProfile.documents || []}
            isLoading={false}
            error={undefined}
          />
        </div>

        {/* Right column - Contact info & actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("contactPersonTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${companyProfile.name}`}
                  />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {companyProfile.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base break-words">
                    {companyProfile.name}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {companyProfile.companyType}
                  </div>
                  <div className="flex flex-col mt-2 text-xs sm:text-sm space-y-1">
                    {companyProfile.contactEmail && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="break-all">
                          {companyProfile.contactEmail}
                        </span>
                      </div>
                    )}
                    {companyProfile.contactPhone && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="break-all">
                          {companyProfile.contactPhone}
                        </span>
                      </div>
                    )}
                    {companyProfile.website && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
                        <a
                          href={companyProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {companyProfile.website}
                        </a>
                      </div>
                    )}
                    {companyProfile.businessHours && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="break-words">
                          {companyProfile.businessHours}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information Card */}
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("companyInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              {companyProfile.foundedYear && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {t("founded")}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {companyProfile.foundedYear}
                  </span>
                </div>
              )}
              {companyProfile.employeeCount && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {t("employees")}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {companyProfile.employeeCount}
                  </span>
                </div>
              )}
              {companyProfile.industries.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">
                    {t("industries")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {companyProfile.industries
                      .slice(0, 3)
                      .map((industry, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs break-words max-w-full"
                        >
                          <span className="truncate">{industry}</span>
                        </Badge>
                      ))}
                    {companyProfile.industries.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        +{companyProfile.industries.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {companyProfile.insuranceCoverage !== undefined && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {t("insurance")}
                  </span>
                  <Badge
                    variant={
                      companyProfile.insuranceCoverage ? "default" : "outline"
                    }
                    className="text-xs flex-shrink-0"
                  >
                    {companyProfile.insuranceCoverage
                      ? t("covered")
                      : t("notCovered")}
                  </Badge>
                </div>
              )}

              {/* Terms & Conditions Section */}
              <div className="pt-3 border-t">
                <div className="space-y-3">
                  <span className="text-sm text-muted-foreground block">
                    {t("termsConditions")}
                  </span>
                  <div className="space-y-2">
                    <TermsConditionsAccessButton
                      companyId={companyProfile.companyId}
                      companyName={companyProfile.name}
                      variant="outline"
                      size="sm"
                      fullWidth={true}
                      showBadge={false}
                      mode="view"
                      className="text-xs h-8"
                    />
                    <TermsConditionsAccessButton
                      companyId={companyProfile.companyId}
                      companyName={companyProfile.name}
                      variant="outline"
                      size="sm"
                      fullWidth={true}
                      showBadge={false}
                      mode="download"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use it later */}

          {/* <div className="space-y-3">
            <Button className="w-full text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{t("createOrder")}</span>
            </Button>
            <Button variant="outline" className="w-full text-sm sm:text-base">
              <FilePlus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{t("sendRequest")}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm sm:text-base"
              onClick={handleBack}
            >
              <span className="truncate">{t("back")}</span>
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
