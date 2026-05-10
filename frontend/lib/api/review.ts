import { apiClient } from "./client";
import { CreateReviewRequest, ReviewResponse } from "./types";

export const reviewApi = {
    createReview: async (orderId: string, request: CreateReviewRequest) => {
        const res = await apiClient.post<ReviewResponse>(`/orders/${orderId}/review`, request);
        return res.data;
    },

    getReviewsByOrder: async (orderId: string) => {
        const res = await apiClient.get<ReviewResponse[]>(`/orders/${orderId}/review`);
        return res.data;
    },
}; 