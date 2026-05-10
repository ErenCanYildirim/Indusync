"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useOrder } from "@/lib/hooks/useOrders";
import { useOrderReviews, useCreateReview } from "@/lib/hooks/useReviews";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ReviewRatingDto } from "@/lib/api/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import type { ReviewResponse } from "@/lib/api/types";
import { useTranslations, useLocale } from "next-intl";

interface RatingCategory {
  id: string;
  label: string;
  comment: string;
  initialScore?: number;
}

export default function ReviewPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const router = useRouter();
  const { user } = useAuth();
  const { id: orderId } = React.use(params);
  const t = useTranslations("Dashboard.reviews");
  const locale = useLocale();

  // Fetch order details and reviews
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId, !!orderId);
  const { data: reviews, isLoading: reviewsLoading } = useOrderReviews(orderId);
  const { mutate: createReview, isPending: isSubmitting } = useCreateReview();

  // Determine the logged-in company ID (primary or current membership)
  const userCompanyId =
    user?.companyId || user?.currentCompanyMembership?.companyId;
  const isClient = order && userCompanyId && order.companyId === userCompanyId;
  const isProvider =
    order && userCompanyId && order.providerId === userCompanyId;

  // Determine reviewee company (the company being reviewed)
  const revieweeCompanyId = useMemo(() => {
    if (!order || !userCompanyId) return undefined;
    // If user is client, reviewee is provider
    if (isClient) return order.providerId || undefined;
    // If user is provider, reviewee is client
    if (isProvider) return order.companyId || undefined;
    return undefined;
  }, [order, userCompanyId, isClient, isProvider]);

  // Check if review already exists
  const alreadyReviewed = useMemo(() => {
    if (!reviews || !userCompanyId) return false;
    return (reviews as ReviewResponse[]).some(
      (r: ReviewResponse) => r.reviewerCompanyId === userCompanyId
    );
  }, [reviews, userCompanyId]);

  // Find the user's review if it exists
  const userReview: ReviewResponse | undefined = useMemo(() => {
    if (!reviews || !userCompanyId) return undefined;
    return (reviews as ReviewResponse[]).find(
      (r: ReviewResponse) => r.reviewerCompanyId === userCompanyId
    );
  }, [reviews, userCompanyId]);

  // Create rating categories with translations
  const ratingCategories: RatingCategory[] = useMemo(
    () => [
      {
        id: "communication",
        label: t("categories.communication"),
        comment: t("comments.communication"),
      },
      {
        id: "responseTime",
        label: t("categories.responseTime"),
        comment: t("comments.responseTime"),
      },
      {
        id: "punctuality",
        label: t("categories.punctuality"),
        comment: t("comments.punctuality"),
      },
      {
        id: "quality",
        label: t("categories.quality"),
        comment: t("comments.quality"),
      },
      {
        id: "budget",
        label: t("categories.budget"),
        comment: t("comments.budget"),
      },
      {
        id: "flexibility",
        label: t("categories.flexibility"),
        comment: t("comments.flexibility"),
      },
      {
        id: "documentation",
        label: t("categories.documentation"),
        comment: t("comments.documentation"),
      },
      {
        id: "overallSatisfaction",
        label: t("categories.overallSatisfaction"),
        comment: t("comments.overallSatisfaction"),
      },
    ],
    [t]
  );

  // Create reverse mapping from backend enum to frontend category ID
  const categoryReverseMapping: Record<string, string> = useMemo(
    () => ({
      COMMUNICATION: "communication",
      RESPONSE_TIME: "responseTime",
      PUNCTUALITY: "punctuality",
      QUALITY: "quality",
      BUDGET: "budget",
      FLEXIBILITY: "flexibility",
      DOCUMENTATION: "documentation",
      OVERALL_SATISFACTION: "overallSatisfaction",
    }),
    []
  );

  // Helper function to get translated category label from backend enum
  const getCategoryLabel = useCallback(
    (backendCategory: string) => {
      const frontendId = categoryReverseMapping[backendCategory];
      if (frontendId) {
        return (
          ratingCategories.find((cat) => cat.id === frontendId)?.label ||
          t("categories.communication")
        );
      }
      return t("categories.communication"); // fallback
    },
    [categoryReverseMapping, ratingCategories, t]
  );

  // Form state
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(
      ratingCategories.map((cat) => [cat.id, cat.initialScore ?? 0])
    )
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(ratingCategories.map((cat) => [cat.id, ""]))
  );

  // Handlers
  const handleScoreChange = (categoryId: string, score: number) => {
    setScores((prev) => ({ ...prev, [categoryId]: score }));
  };
  const handleCommentChange = (categoryId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [categoryId]: comment }));
  };

  const handleSubmit = () => {
    if (!orderId || !revieweeCompanyId) return;
    // Map frontend category IDs to backend enum values
    const categoryMapping: Record<string, string> = {
      communication: "COMMUNICATION",
      responseTime: "RESPONSE_TIME",
      punctuality: "PUNCTUALITY",
      quality: "QUALITY",
      budget: "BUDGET",
      flexibility: "FLEXIBILITY",
      documentation: "DOCUMENTATION",
      overallSatisfaction: "OVERALL_SATISFACTION",
    };

    const ratings: ReviewRatingDto[] = ratingCategories.map((cat) => ({
      category: categoryMapping[cat.id],
      score: scores[cat.id],
      comment: comments[cat.id] || undefined,
    }));
    createReview(
      {
        orderId,
        request: {
          orderId,
          revieweeCompanyId,
          ratings,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: t("submitReviewSuccess"),
            description: t("submitReviewSuccessDescription"),
          });
          router.push("/dashboard/abgeschlossen");
        },
        onError: (err: any) => {
          toast({
            title: t("submitReviewError"),
            description:
              err?.response?.data?.message || t("submitReviewErrorDescription"),
            variant: "destructive",
          });
        },
      }
    );
  };

  // UI helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };
  const getScoreLabel = (score: number) => {
    if (score >= 90) return t("scoreLabels.excellent");
    if (score >= 80) return t("scoreLabels.veryGood");
    if (score >= 70) return t("scoreLabels.good");
    if (score >= 60) return t("scoreLabels.satisfactory");
    if (score >= 50) return t("scoreLabels.sufficient");
    if (score >= 40) return t("scoreLabels.poor");
    if (score > 0) return t("scoreLabels.insufficient");
    return t("scoreLabels.notRated");
  };

  const ScoreSlider = ({
    categoryId,
    currentScore,
  }: {
    categoryId: string;
    currentScore: number;
  }) => (
    <div className="flex items-center space-x-3 w-64">
      <span className="text-xs text-gray-500">0</span>
      <div className="relative flex-1">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={currentScore}
          onChange={(e) =>
            handleScoreChange(categoryId, parseInt(e.target.value))
          }
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #16a34a 100%)`,
          }}
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
      <span className="text-xs text-gray-500">100</span>
      <div className="text-center min-w-[60px]">
        <div className={`text-lg font-semibold ${getScoreColor(currentScore)}`}>
          {currentScore}
        </div>
        <div className={`text-xs ${getScoreColor(currentScore)}`}>
          {getScoreLabel(currentScore)}
        </div>
      </div>
    </div>
  );

  // Loading and error states
  if (orderLoading || reviewsLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-1/2 mb-4" />
        {ratingCategories.map((cat) => (
          <Skeleton key={cat.id} className="h-32 w-full mb-4" />
        ))}
      </div>
    );
  }
  if (orderError || !order) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>{t("errorLoadingOrder")}</AlertTitle>
        <AlertDescription>
          {orderError?.message || t("errorLoadingOrderDescription")}
        </AlertDescription>
      </Alert>
    );
  }
  if (!isClient && !isProvider) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>{t("noPermission")}</AlertTitle>
        <AlertDescription>{t("noPermissionDescription")}</AlertDescription>
      </Alert>
    );
  }
  if (userReview) {
    // Show all reviews for the order
    const allReviews = reviews as ReviewResponse[];
    const otherReviews = allReviews.filter(
      (r) => r.reviewerCompanyId !== userCompanyId
    );

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-4"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("reviewsForOrder")}
            </h1>
            <p className="text-muted-foreground">
              {t("orderNumber")}:{" "}
              <span className="font-medium">{order.id?.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        {/* User's own review */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">{t("yourReview")}</h2>
            <span className="text-sm text-muted-foreground">
              ({t("reviewFor")}:{" "}
              {isClient ? t("reviewForProvider") : t("reviewForClient")})
            </span>
          </div>
          <div className="grid gap-4">
            {userReview.ratings.map((rating: any) => (
              <Card
                key={rating.category}
                className="overflow-hidden border-blue-200"
              >
                <CardContent className="p-6 bg-blue-50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">
                        {getCategoryLabel(rating.category)}
                      </h3>
                      <div className="text-center min-w-[60px]">
                        <div
                          className={`text-lg font-semibold ${getScoreColor(
                            rating.score
                          )}`}
                        >
                          {rating.score}
                        </div>
                        <div
                          className={`text-xs ${getScoreColor(rating.score)}`}
                        >
                          {getScoreLabel(rating.score)}
                        </div>
                      </div>
                    </div>
                    {rating.comment && (
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">{t("comment")}:</span>{" "}
                        {rating.comment}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Other reviews */}
        {otherReviews.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">{t("otherPartyReview")}</h2>
              <span className="text-sm text-muted-foreground">
                ({t("reviewFor")}:{" "}
                {isClient ? t("reviewForClient") : t("reviewForProvider")})
              </span>
            </div>
            {otherReviews.map((review) => (
              <div key={review.reviewId} className="grid gap-4">
                {review.ratings.map((rating: any) => (
                  <Card
                    key={rating.category}
                    className="overflow-hidden border-green-200"
                  >
                    <CardContent className="p-6 bg-green-50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">
                            {getCategoryLabel(rating.category)}
                          </h3>
                          <div className="text-center min-w-[60px]">
                            <div
                              className={`text-lg font-semibold ${getScoreColor(
                                rating.score
                              )}`}
                            >
                              {rating.score}
                            </div>
                            <div
                              className={`text-xs ${getScoreColor(
                                rating.score
                              )}`}
                            >
                              {getScoreLabel(rating.score)}
                            </div>
                          </div>
                        </div>
                        {rating.comment && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">{t("comment")}:</span>{" "}
                            {rating.comment}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Alert className="mt-6">
            <AlertTitle>{t("waitingForOtherParty")}</AlertTitle>
            <AlertDescription>
              {t("waitingForOtherPartyDescription")}
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mt-6">
          <AlertTitle>{t("reviewCompleted")}</AlertTitle>
          <AlertDescription>{t("reviewCompletedDescription")}</AlertDescription>
        </Alert>
      </div>
    );
  }
  if (alreadyReviewed) {
    return (
      <div className="text-center py-12 text-green-700">
        {t("alreadyReviewed")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-4"
          aria-label={t("back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("orderNumber")}:{" "}
            <span className="font-medium">{order.id?.slice(0, 8)}</span> |
            {t("reviewFor")}:{" "}
            <span className="font-medium">
              {isClient
                ? order.providerId
                : order.companyName || order.companyId}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {ratingCategories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <CardContent className="p-6 bg-slate-50">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{category.label}</h3>
                  <ScoreSlider
                    categoryId={category.id}
                    currentScore={scores[category.id]}
                  />
                </div>
                <Textarea
                  placeholder={category.comment}
                  className="bg-white"
                  value={comments[category.id]}
                  onChange={(e) =>
                    handleCommentChange(category.id, e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.values(scores).some((s) => s === 0)}
        >
          {t("submitReview")}
        </Button>
      </div>
    </div>
  );
}
