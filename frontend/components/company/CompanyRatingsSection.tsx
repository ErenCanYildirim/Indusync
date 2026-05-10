"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Star,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { companyRatingsApiService } from "@/lib/api/company-ratings";
import type {
  CompanyRatingsSummary,
  CategoryRating,
  ProjectReviewSummary,
  ReviewCategory,
  RatingsApiError,
} from "@/lib/types/company-ratings";

interface CompanyRatingsSectionProps {
  /** The unique identifier of the company */
  companyId: string;
  /** Optional callback when a project is clicked for navigation */
  onProjectClick?: (orderId: string) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * CompanyRatingsSection Component
 *
 * Displays comprehensive company ratings including overall rating, category breakdowns,
 * and recent projects list. Handles loading states, error states, and empty states.
 *
 * Requirements covered:
 * - 1.1: Display overall average rating and category averages
 * - 1.2: Show total reviews and completed orders count
 * - 1.3: Display recent projects with ratings and company role indicators
 * - 1.4: Handle loading, error, and empty states appropriately
 */
export const CompanyRatingsSection: React.FC<CompanyRatingsSectionProps> = ({
  companyId,
  onProjectClick,
  className,
}) => {
  const t = useTranslations("CompanyRatings");

  // State management
  const [ratingsData, setRatingsData] = useState<CompanyRatingsSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<RatingsApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load ratings data
  useEffect(() => {
    const loadRatingsData = async () => {
      if (!companyId) {
        setError({
          message: "Company ID is required",
          status: 400,
          code: "INVALID_COMPANY_ID",
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await companyRatingsApiService.getCompanyRatingsSummary(
          companyId
        );
        setRatingsData(data);
      } catch (err) {
        console.error("Failed to load company ratings:", err);
        setError(err as RatingsApiError);
      } finally {
        setIsLoading(false);
      }
    };

    loadRatingsData();
  }, [companyId, retryCount]);

  // Retry function for error recovery
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Handle project click - now handled internally by PastProjectsList
  const handleProjectClick = (orderId: string) => {
    if (onProjectClick) {
      onProjectClick(orderId);
    }
    // If no custom handler provided, PastProjectsList will handle navigation internally
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState error={error} onRetry={handleRetry} className={className} />
    );
  }

  // Empty state (no ratings data)
  if (!ratingsData || ratingsData.totalReviews === 0) {
    return <EmptyState companyId={companyId} className={className} />;
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("summary.description", {
              totalReviews: ratingsData.totalReviews,
              completedOrders: ratingsData.completedOrders,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Rating Display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold">
                  {ratingsData.overallRating
                    ? (ratingsData.overallRating / 20).toFixed(1)
                    : t("common.notAvailable")}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        ratingsData.overallRating &&
                        star <= Math.round(ratingsData.overallRating / 20)
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {getQualityLevelText(ratingsData.overallRating, t)}
              </p>
            </div>

            {/* Statistics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("statistics.reviews", { count: ratingsData.totalReviews })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("statistics.completedProjects", {
                    count: ratingsData.completedOrders,
                  })}
                </span>
              </div>
            </div>

            {/* Category Breakdown Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {t("categories.topCategories")}
              </h4>
              {getTopCategories(ratingsData.categoryRatings)
                .slice(0, 3)
                .map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{getCategoryDisplayName(category.category, t)}</span>
                    <span className="font-medium">
                      {category.averageScore
                        ? (category.averageScore / 20).toFixed(1)
                        : t("common.notAvailable")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Ratings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("categories.title")}</CardTitle>
          <CardDescription>{t("categories.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ratingsData.categoryRatings).map(
              ([category, rating]) => (
                <CategoryRatingItem
                  key={category}
                  category={category as ReviewCategory}
                  rating={rating}
                />
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      {ratingsData.recentProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("projects.title")}</span>
              <Button variant="ghost" size="sm" className="text-primary">
                {t("projects.showAll")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
            <CardDescription>{t("projects.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratingsData.recentProjects.map((project) => (
                <ProjectItem
                  key={project.orderId}
                  project={project}
                  onClick={() => handleProjectClick(project.orderId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Individual Category Rating Item Component
 */
interface CategoryRatingItemProps {
  category: ReviewCategory;
  rating: CategoryRating;
}

const CategoryRatingItem: React.FC<CategoryRatingItemProps> = ({
  category,
  rating,
}) => {
  const t = useTranslations("CompanyRatings");
  const progressValue = rating.averageScore
    ? (rating.averageScore / 100) * 100
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {getCategoryDisplayName(category, t)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            ({rating.reviewCount})
          </span>
          <span className="text-sm font-medium">
            {rating.averageScore
              ? (rating.averageScore / 20).toFixed(1)
              : t("common.notAvailable")}
          </span>
        </div>
      </div>
      <Progress value={progressValue} className="h-2" />
      <p className="text-xs text-muted-foreground">{rating.qualityLevel}</p>
    </div>
  );
};

/**
 * Individual Project Item Component
 */
interface ProjectItemProps {
  project: ProjectReviewSummary;
  onClick: () => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ project, onClick }) => {
  const t = useTranslations("CompanyRatings");

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{project.projectName}</h4>
          <Badge
            variant={project.companyRole === "CLIENT" ? "default" : "outline"}
          >
            {project.companyRole === "CLIENT"
              ? t("roles.client")
              : t("roles.provider")}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.completionDate).toLocaleDateString("de-DE")}
          </div>
          <span>
            {t("projects.reviewedBy", { company: project.reviewerCompanyName })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {project.overallRating ? (
            <>
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-medium">
                {(project.overallRating / 20).toFixed(1)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {t("projects.noRating")}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`space-y-6 ${className || ""}`}>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <Skeleton className="h-12 w-20 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Error State Component
 */
interface ErrorStateProps {
  error: RatingsApiError;
  onRetry: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  className,
}) => {
  const t = useTranslations("CompanyRatings");

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t("errors.loadingError")}
        </h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {getErrorMessage(error, t)}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t("errors.retry")}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  companyId: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ companyId, className }) => {
  const t = useTranslations("CompanyRatings");

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Star className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {t("empty.description")}
        </p>
      </CardContent>
    </Card>
  );
};

// Utility functions

/**
 * Get display name for review category
 */
function getCategoryDisplayName(category: ReviewCategory, t: any): string {
  const categoryKeys: Record<ReviewCategory, string> = {
    COMMUNICATION: "categories.communication",
    RESPONSE_TIME: "categories.responseTime",
    PUNCTUALITY: "categories.punctuality",
    QUALITY: "categories.quality",
    BUDGET: "categories.budget",
    FLEXIBILITY: "categories.flexibility",
    DOCUMENTATION: "categories.documentation",
    OVERALL_SATISFACTION: "categories.overallSatisfaction",
  };

  return t(categoryKeys[category]) || category;
}

/**
 * Get quality level text based on rating score
 */
function getQualityLevelText(score: number | null, t: any): string {
  if (!score) return t("qualityLevels.notRated");

  if (score >= 90) return t("qualityLevels.excellent");
  if (score >= 80) return t("qualityLevels.veryGood");
  if (score >= 70) return t("qualityLevels.good");
  if (score >= 60) return t("qualityLevels.satisfactory");
  if (score >= 50) return t("qualityLevels.sufficient");
  if (score >= 30) return t("qualityLevels.poor");
  return t("qualityLevels.inadequate");
}

/**
 * Get top performing categories sorted by average score
 */
function getTopCategories(
  categoryRatings: Record<ReviewCategory, CategoryRating>
): CategoryRating[] {
  return Object.values(categoryRatings)
    .filter((rating) => rating.averageScore !== null)
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: RatingsApiError, t: any): string {
  switch (error.code) {
    case "COMPANY_NOT_FOUND":
      return t("errors.companyNotFound");
    case "ACCESS_DENIED":
      return t("errors.accessDenied");
    case "NETWORK_ERROR":
      return t("errors.networkError");
    case "REQUEST_TIMEOUT":
      return t("errors.requestTimeout");
    case "RATE_LIMIT_EXCEEDED":
      return t("errors.rateLimitExceeded");
    default:
      return error.message || t("errors.unknownError");
  }
}

export default CompanyRatingsSection;