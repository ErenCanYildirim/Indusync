import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '@/lib/api/review';
import { CreateReviewRequest, ReviewResponse } from '@/lib/api/types';
import { toast } from '@/components/ui/use-toast';

export function useOrderReviews(orderId: string) {
    return useQuery({
        queryKey: ['reviews', orderId],
        queryFn: () => reviewApi.getReviewsByOrder(orderId),
        enabled: !!orderId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, request }: { orderId: string; request: CreateReviewRequest }) =>
            reviewApi.createReview(orderId, request),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', orderId] });
        },
    });
}

// hook to check review status for an order
export function useOrderReviewStatus(orderId: string, userCompanyId?: string) {
    return useQuery({
        queryKey: ['review-status', orderId, userCompanyId],
        queryFn: async () => {
            if (!userCompanyId) return null;

            const reviews = await reviewApi.getReviewsByOrder(orderId);
            const userReview = reviews.find((r: ReviewResponse) => r.reviewerCompanyId === userCompanyId);
            const otherReviews = reviews.filter((r: ReviewResponse) => r.reviewerCompanyId !== userCompanyId);

            return {
                hasUserReviewed: !!userReview,
                hasOtherReviewed: otherReviews.length > 0,
                totalReviews: reviews.length,
                userReview,
                otherReviews,
                allReviews: reviews
            };
        },
        enabled: !!orderId && !!userCompanyId,
    });
} 