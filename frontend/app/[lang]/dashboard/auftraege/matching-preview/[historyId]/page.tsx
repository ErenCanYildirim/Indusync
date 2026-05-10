"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMatchingPreview } from "@/lib/hooks/useMatchingPreview";
import type { MatchingCompanyResponse } from "@/lib/types/matching";
import { useTranslations } from "next-intl";

// Import DataTable and matching history columns
import { DataTable } from "@/components/ui/data-table";
import { useMatchingHistoryColumns } from "@/components/tables/matching-history-columns";

export default function MatchingHistoryDetailPage() {
  const { historyId } = useParams();
  const router = useRouter();
  const { queryDetails, loading, error, fetchQueryDetails } =
    useMatchingPreview();
  const t = useTranslations("Dashboard.matchingHistory");

  useEffect(() => {
    if (historyId) {
      fetchQueryDetails(historyId as string);
    }
  }, [historyId, fetchQueryDetails]);

  const formatMatchScore = (score: number) => {
    return Math.round(score * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "outline";
    return "outline";
  };

  const getMatchQuality = (
    score: number
  ): {
    label: string;
    variant: "default" | "outline";
  } => {
    if (score >= 0.9) return { label: "Exzellent", variant: "default" };
    if (score >= 0.8) return { label: "Sehr gut", variant: "default" };
    if (score >= 0.7) return { label: "Gut", variant: "outline" };
    if (score >= 0.6) return { label: "Befriedigend", variant: "outline" };
    return { label: "Gering", variant: "outline" };
  };

  const formatScoreDetails = (match: MatchingCompanyResponse) => {
    const details = [];
    if (match.industryScore !== undefined)
      details.push(`Branche: ${Math.round(match.industryScore * 100)}%`);
    if (match.skillsScore !== undefined)
      details.push(`Skills: ${Math.round(match.skillsScore * 100)}%`);
    if (match.certificatesScore !== undefined)
      details.push(
        `Zertifikate: ${Math.round(match.certificatesScore * 100)}%`
      );
    if (match.radiusScore !== undefined)
      details.push(`Entfernung: ${Math.round(match.radiusScore * 100)}%`);
    return details.join(", ");
  };

  // Action handlers
  const handleViewProfile = (match: MatchingCompanyResponse) => {
    router.push(`/dashboard/dienstleister/${match.companyId}`);
  };

  // Create columns with action handlers
  const columns = useMatchingHistoryColumns(handleViewProfile);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !queryDetails) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {t("errors.loadError")}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || t("errors.loadErrorDescription")}
              </p>
              <Link href="/dashboard/auftraege">
                <Button variant="outline">
                  {t("navigation.backToOrders")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/auftraege">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("navigation.backToOrders")}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mt-2">{t("title")}</h1>
        </div>
      </div>

      {/* Query Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("querySummary.title", {
              date: new Date(queryDetails.query.createdAt).toLocaleDateString(
                "de-DE",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {t("querySummary.category")}
              </div>
              <div className="font-medium">
                {queryDetails.query.primaryCategory ||
                  t("querySummary.notSpecified")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("querySummary.searchRadius")}
              </div>
              <div className="font-medium">
                {queryDetails.query.searchRadiusKm
                  ? `${queryDetails.query.searchRadiusKm} km`
                  : t("querySummary.unlimited")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("querySummary.foundMatches")}
              </div>
              <div className="font-medium">
                {queryDetails.query.totalMatches}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("querySummary.averageScore")}
              </div>
              <div className="font-medium">
                {queryDetails.query.averageScore
                  ? `${formatMatchScore(queryDetails.query.averageScore)}%`
                  : "N/A"}
              </div>
            </div>
          </div>

          {/* Additional Query Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Industries */}
            {queryDetails.query.targetIndustries &&
              queryDetails.query.targetIndustries.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    {t("queryDetails.targetIndustries")}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {queryDetails.query.targetIndustries.map(
                      (industry, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {industry}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Specializations */}
            {queryDetails.query.requiredSpecializations &&
              queryDetails.query.requiredSpecializations.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    {t("queryDetails.requiredSpecializations")}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {queryDetails.query.requiredSpecializations.map(
                      (spec, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {spec}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Certifications */}
            {queryDetails.query.requiredCertifications &&
              queryDetails.query.requiredCertifications.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    {t("queryDetails.requiredCertifications")}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {queryDetails.query.requiredCertifications.map(
                      (cert, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {cert}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Verifications */}
            {queryDetails.query.requiredVerifications &&
              queryDetails.query.requiredVerifications.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    {t("queryDetails.requiredVerifications")}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {queryDetails.query.requiredVerifications.map(
                      (verification, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {verification}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* DataTable with clean design */}
      <DataTable
        // Abgeschlossen design format props
        // title={t("matchesTable.title")}
        description={t("matchesTable.description")}
        icon={<FileSearch className="h-5 w-5 text-blue-600" />}
        cardLayout={true}
        // Data and functionality
        data={queryDetails.matches}
        columns={columns}
        loading={loading}
        error={error ? t("errors.matchesLoadFailed") : null}
        emptyMessage={t("emptyState")}
        enableSorting={true}
        enableSearch={true}
        enablePagination={false} // Disable pagination for history view
        // Remove internal scrolling for professional look
        className="overflow-visible"
        tableClassName="overflow-visible"
      />
    </div>
  );
}
