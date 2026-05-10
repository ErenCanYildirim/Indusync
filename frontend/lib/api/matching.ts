import { apiClient } from './client';
import type {
    MatchingPreviewRequest,
    MatchingPreviewResponse,
    MatchingQueryHistory,
    MatchingQueryDetails
} from '@/lib/types/matching';

export const matchingApi = {
    /**
     * Run a matching preview without creating an order
     */
    async runPreview(request: MatchingPreviewRequest): Promise<MatchingPreviewResponse> {
        console.log('Making matching preview request:', request);
        const response = await apiClient.post('/matching/preview', request);
        console.log('Matching preview response:', response.data);
        return response.data;
    },

    /**
     * Get matching history for the current company (last 3 queries)
     */
    async getHistory(): Promise<MatchingQueryHistory[]> {
        const response = await apiClient.get('/matching/history');
        return response.data;
    },

    /**
     * Get details for a specific matching query
     */
    async getQueryDetails(queryId: string): Promise<MatchingQueryDetails> {
        const response = await apiClient.get(`/matching/history/${queryId}`);
        return response.data;
    },
};

// Helper function to convert form data to matching request
export const convertFormDataToMatchingRequest = (formData: any, companyId: string): MatchingPreviewRequest => {
    return {
        companyId,
        primaryCategory: formData.orderCategories?.[0], // Use first category as primary
        targetIndustries: formData.selectedIndustries || [],
        placementTypes: formData.placementTypes || [],
        requiredSpecializations: formData.selectedSpecializations || [],
        requiredCertifications: formData.certifications || [],
        requiredVerifications: formData.verifications || [],
        latitude: formData.latitude,
        longitude: formData.longitude,
        searchRadiusKm: formData.isUnlimitedRadius ? undefined : formData.radius,
        urgency: convertUrgencyFromResponseTime(formData.responseTime),
        startDate: formData.startDate,
        deadline: formData.endDate,
        budget: formData.budget,
    };
};

// Helper function to convert response time to urgency
const convertUrgencyFromResponseTime = (responseTime: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' => {
    switch (responseTime) {
        case '3':
            return 'URGENT';
        case '7':
            return 'HIGH';
        case '14':
            return 'MEDIUM';
        default:
            return 'LOW';
    }
}; 