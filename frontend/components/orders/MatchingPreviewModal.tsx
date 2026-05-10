"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Users,
  MapPin,
  Star,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  Award,
  Shield,
} from "lucide-react";
import { TermsConditionsAccessButton } from "@/components/terms-conditions/terms-conditions-access-button";
import { useMatchingPreview } from "@/lib/hooks/useMatchingPreview";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  MatchingPreviewForm,
  MatchingPreviewFormData,
} from "./MatchingPreviewForm";
import type { MatchingCompanyResponse } from "@/lib/types/matching";
import { useTranslations } from "next-intl";

interface MatchingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MatchingPreviewModal({
  isOpen,
  onClose,
}: MatchingPreviewModalProps) {
  const { user } = useAuth();
  const t = useTranslations("Dashboard.orders");
  const [activeTab, setActiveTab] = useState("preview");
  const [isOpen_internal, setIsOpen] = useState(false);

  const { preview, history, loading, error, runPreview, fetchHistory } =
    useMatchingPreview();

  useEffect(() => {
    setIsOpen(isOpen);
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handlePreviewSubmit = async (formData: MatchingPreviewFormData) => {
    try {
      const matchingRequest = {
        companyId: user?.companyId || "",
        targetIndustries: formData.targetIndustries,
        placementTypes: formData.placementTypes,
        requiredSpecializations: formData.requiredSpecializations,
        requiredCertifications: formData.requiredCertifications,
        requiredVerifications: formData.requiredVerifications,
        latitude: formData.latitude,
        longitude: formData.longitude,
        searchRadiusKm: formData.isUnlimitedRadius
          ? undefined
          : formData.searchRadiusKm,
        urgency: formData.urgency,
        startDate: formData.startDate,
        deadline: formData.deadline,
        budget: formData.budget,
      };
      const result = await runPreview(matchingRequest);
      setActiveTab("results");
    } catch (error) {
      console.error("Error in matching preview:", error);
    }
  };

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

  const renderCompanyCard = (company: MatchingCompanyResponse) => (
    <Card key={company.companyId} className="mb-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg">{company.companyName}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {company.city || "Standort nicht verfügbar"}
              {company.distanceKm && (
                <span className="text-sm text-muted-foreground">
                  ({company.distanceKm.toFixed(1)} km)
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant={getScoreBadgeVariant(company.matchScore)}>
            {formatMatchScore(company.matchScore)}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
          {company.industryScore && (
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Branche
              </div>
              <div
                className={`text-sm sm:text-base font-semibold ${getScoreColor(
                  company.industryScore
                )}`}
              >
                {formatMatchScore(company.industryScore)}%
              </div>
            </div>
          )}
          {company.skillsScore && (
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Skills
              </div>
              <div
                className={`text-sm sm:text-base font-semibold ${getScoreColor(
                  company.skillsScore
                )}`}
              >
                {formatMatchScore(company.skillsScore)}%
              </div>
            </div>
          )}
          {company.certificatesScore && (
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Zertifikate
              </div>
              <div
                className={`text-sm sm:text-base font-semibold ${getScoreColor(
                  company.certificatesScore
                )}`}
              >
                {formatMatchScore(company.certificatesScore)}%
              </div>
            </div>
          )}
          {company.verificationScore !== undefined && (
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Verifiziert
              </div>
              <div
                className={`text-sm sm:text-base font-semibold ${getScoreColor(
                  company.verificationScore
                )}`}
              >
                {formatMatchScore(company.verificationScore)}%
              </div>
            </div>
          )}
        </div>

        {(company.specializations?.length ||
          company.certifications?.length ||
          company.verifications?.length) && (
          <div className="space-y-2">
            {company.specializations && company.specializations.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("specializations")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {company.certifications && company.certifications.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("certifications")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {company.verifications && company.verifications.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("verifications")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.verifications.map((verif, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {verif}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Terms & Conditions Access */}
        <div className="mt-4 pt-4 border-t">
          <TermsConditionsAccessButton
            companyId={company.companyId}
            companyName={company.companyName}
            variant="outline"
            size="sm"
            className="w-full"
            showBadge={false}
            mode="view"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderHistoryTable = () => (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noMatchingQueries")}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("date")}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("category")}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("radius")}
              </TableHead>
              <TableHead>{t("matches")}</TableHead>
              <TableHead className="w-[100px]">{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((query) => (
              <TableRow key={query.queryId}>
                <TableCell className="text-sm">
                  {new Date(query.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {query.primaryCategory || t("all")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {query.searchRadiusKm ? `${query.searchRadiusKm} km` : "∞"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{query.totalMatches}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `/dashboard/auftraege/matching-preview/${query.queryId}`,
                        "_blank"
                      );
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen_internal} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("matchingPreview")}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="text-xs sm:text-sm">
              <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t("preview")}</span>
              <span className="sm:hidden">{t("previewShort")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={!preview}
              className="text-xs sm:text-sm"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t("results")}</span>
              <span className="sm:hidden">{t("resultsShort")}</span>
              {preview && (
                <span className="ml-1 hidden sm:inline">
                  ({preview.totalMatches})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t("history")}</span>
              <span className="sm:hidden">{t("historyShort")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="min-h-[400px]">
              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <MatchingPreviewForm
                onSubmit={handlePreviewSubmit}
                isLoading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {preview && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {preview.totalMatches || 0} {t("matchesFound")}
                    </h3>
                    {preview.averageScore && (
                      <p className="text-sm text-muted-foreground">
                        {t("averageMatch")}{" "}
                        {formatMatchScore(preview.averageScore)}%
                      </p>
                    )}
                  </div>
                  {preview.bestMatchScore && (
                    <Badge variant="default" className="text-sm">
                      {t("bestMatch")}{" "}
                      {formatMatchScore(preview.bestMatchScore)}%
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {preview.topMatches && preview.topMatches.length > 0 ? (
                    preview.topMatches.map((company) =>
                      renderCompanyCard(company)
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {t("noMatchesFound")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {renderHistoryTable()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
