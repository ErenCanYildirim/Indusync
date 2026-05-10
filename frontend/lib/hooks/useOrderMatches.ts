"use client";

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import type { PaginationParams, CompanyMatchResponse, ApiResponse } from '@/lib/api/types';

export function useOrderMatches(orderId: string, params: PaginationParams = {}) {
    return useQuery<ApiResponse<CompanyMatchResponse[]>>({
        queryKey: ['orders', 'matches', orderId, params],
        queryFn: () => ordersApi.getOrderMatches(orderId, params),
        enabled: !!orderId,
        placeholderData: (previousData) => previousData,
        staleTime: 2 * 60 * 1000,
    });
} 