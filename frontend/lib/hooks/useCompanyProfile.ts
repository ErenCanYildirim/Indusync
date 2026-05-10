"use client";

/**
 * Hook for fetching and managing company profile data
 * Used to determine company role and permissions
 */

import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api/company';
import { queryKeys } from '@/lib/api/types';
import type { CompanyProfile } from '@/lib/api/types';

export function useCompanyProfile() {
    const {
        data: companyProfile,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: queryKeys.company.profile,
        queryFn: companyApi.getCompanyProfile,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    return {
        companyProfile,
        isLoading,
        error,
        refetch
    };
} 