"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Star,
  Calendar,
  Building2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { companyRatingsApiService } from "@/lib/api/company-ratings";
import type {
  OrderReviewDetails,
  DetailedReview,
  RatingsApiError,
  ReviewCategory,
} from "@/lib/types/company-ratings";

/**
 * DetailedReviewPage Component
 *
 * Displays comprehensive review information for a specific order.
 * Shows all bidirectional reviews with clear attribution and role context,
 * individual category ratings with scores, comments, and quality levels.
 * Includes navigation breadcrumbs and back-to-profile functionality.
 *
 * Requirements covered:
 * - 3.1: Display detailed review page for specific orders
 * - 3.2: Show individual category ratings with scores, comments, and quality levels
 * - 3.3: Display bidirectional reviews with clear attribution and role context
 * - 3.4: Show reviewer information, review date, and working relationship context
 * - 3.5: Display full review text with clear attribution
 */
export default function DetailedReviewPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Dashboard.reviews");

  // Extract orderId from params and validate
  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  // Validate orderId format (should be a valid UUID)
  const isValidOrderId =
    orderId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      orderId
    );

  // State management
  const [reviewDetails, setReviewDetails] = useState<OrderReviewDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<RatingsApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load review details
  useEffect(() => {
    const loadReviewDetails = async () => {
      if (!orderId || !isValidOrderId) {
        setError({
          message: "Invalid or missing Order ID",
          status: 400,
          code: "INVALID_ORDER_ID",
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await companyRatingsApiService.getOrderReviewDetails(
          orderId
        );
        setReviewDetails(data);
      } catch (err) {
        console.error("Failed to load order review details:", err);
        setError(err as RatingsApiError);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewDetails();
  }, [orderId, isValidOrderId, retryCount]);

  // Handle back navigation
  const handleBackClick = () => {
    router.back();
  };

  // Retry function for error recovery
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={handleRetry}
        onBack={handleBackClick}
      />
    );
  }

  // No data state
  if (!reviewDetails) {
    return <EmptyState onBack={handleBackClick} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="flex items-center gap-1 hover:text-foreground p-0 h-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t("detailedReview.backToProfile")}
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t("detailedReview.projectReview")}
              </BreadcrumbPage>
            </BreadcrumbItem>
            {reviewDetails && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">
                    {reviewDetails.projectName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("detailedReview.title")}
        </h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span>{reviewDetails.projectName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {t("detailedReview.completed")}:{" "}
              {formatDate(reviewDetails.completionDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviewDetails.reviews.map((review, index) => (
          <ReviewCard key={review.reviewId} review={review} />
        ))}
      </div>

      {/* Empty Reviews State */}
      {reviewDetails.reviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("detailedReview.noReviewsAvailable")}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t("detailedReview.noReviewsDescription")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual Review Card Component
 */
interface ReviewCardProps {
  review: DetailedReview;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const tReviews = useTranslations("Dashboard.reviews");

  const getRoleDisplayName = (role: "CLIENT" | "PROVIDER") => {
    return role === "CLIENT"
      ? tReviews("detailedReview.client")
      : tReviews("detailedReview.provider");
  };

  const getRoleBadgeVariant = (role: "CLIENT" | "PROVIDER") => {
    return role === "CLIENT" ? "default" : "outline";
  };

  // Calculate overall rating from category ratings
  const calculateOverallRating = () => {
    const ratings = Object.values(review.ratings);
    if (ratings.length === 0) return null;

    // Filter out null scores and calculate average
    const validRatings = ratings.filter((rating) => rating.score !== null);
    if (validRatings.length === 0) return null;

    const sum = validRatings.reduce(
      (acc, rating) => acc + (rating.score || 0),
      0
    );
    return sum / validRatings.length;
  };

  const overallRating = calculateOverallRating();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {review.reviewerCompanyName}
            </CardTitle>
            <CardDescription>
              {tReviews("detailedReview.reviewBy")} {review.revieweeCompanyName}{" "}
              {tReviews("detailedReview.as")}{" "}
              <Badge
                variant={getRoleBadgeVariant(review.revieweeRole)}
                className="ml-1"
              >
                {getRoleDisplayName(review.revieweeRole)}
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right space-y-1">
            {overallRating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">
                  {(overallRating / 20).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({getQualityLevelText(overallRating, tReviews)})
                </span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {formatDate(review.reviewDate)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Category Ratings */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">
              {tReviews("detailedReview.reviewCategories")}
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(review.ratings).map(([category, rating]) => (
                <CategoryRatingItem
                  key={category}
                  category={category as ReviewCategory}
                  rating={rating}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Category Rating Item Component
 */
interface CategoryRatingItemProps {
  category: ReviewCategory;
  rating: {
    score: number | null;
    comment?: string | null;
    qualityLevel: string;
  };
}

const CategoryRatingItem: React.FC<CategoryRatingItemProps> = ({
  category,
  rating,
}) => {
  const tReviews = useTranslations("Dashboard.reviews");

  const getCategoryDisplayName = (category: ReviewCategory): string => {
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
    return tReviews(categoryKeys[category]) || category;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {getCategoryDisplayName(category)}
        </span>
        <div className="flex items-center gap-2">
          {rating.score !== null ? (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">
                {(rating.score! / 20).toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {tReviews("scoreLabels.notRated")}
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {rating.qualityLevel}
          </Badge>
        </div>
      </div>

      {/* Rating Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary rounded-full h-2 transition-all duration-300"
          style={{ width: `${rating.score || 0}%` }}
        />
      </div>

      {/* Comment */}
      {rating.comment && (
        <p className="text-sm text-muted-foreground italic">
          "{rating.comment}"
        </p>
      )}
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Skeleton className="h-6 w-32" />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className="h-4 w-24" />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className="h-4 w-48" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-80 mb-2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Review Cards Skeleton */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Error State Component
 */
interface ErrorStateProps {
  error: RatingsApiError;
  onRetry: () => void;
  onBack: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onBack }) => {
  const t = useTranslations("Dashboard.reviews");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t("detailedReview.errorLoading")}
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {getErrorMessage(error, t)}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("detailedReview.back")}
            </Button>
            <Button onClick={onRetry}>{t("detailedReview.retry")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  onBack: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onBack }) => {
  const t = useTranslations("Dashboard.reviews");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t("detailedReview.reviewNotFound")}
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {t("detailedReview.reviewNotFoundDescription")}
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("detailedReview.backToProfile")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility functions

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get quality level text based on rating score
 */
function getQualityLevelText(score: number | null, t: any): string {
  if (!score) return t("scoreLabels.notRated");

  if (score >= 90) return t("scoreLabels.excellent");
  if (score >= 80) return t("scoreLabels.veryGood");
  if (score >= 70) return t("scoreLabels.good");
  if (score >= 60) return t("scoreLabels.satisfactory");
  if (score >= 50) return t("scoreLabels.sufficient");
  if (score >= 30) return t("scoreLabels.poor");
  return t("scoreLabels.insufficient");
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: RatingsApiError, t: any): string {
  switch (error.code) {
    case "ORDER_NOT_FOUND":
      return t("detailedReview.errors.orderNotFound");
    case "REVIEWS_NOT_FOUND":
      return t("detailedReview.errors.reviewsNotFound");
    case "ACCESS_DENIED":
      return t("detailedReview.errors.accessDenied");
    case "NETWORK_ERROR":
      return t("detailedReview.errors.networkError");
    case "REQUEST_TIMEOUT":
      return t("detailedReview.errors.requestTimeout");
    case "RATE_LIMIT_EXCEEDED":
      return t("detailedReview.errors.rateLimitExceeded");
    default:
      return error.message || t("detailedReview.errors.unknownError");
  }
}
