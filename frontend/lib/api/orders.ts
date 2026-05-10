/**
 * Orders API Service - Complete Implementation
 * Handles all order-related HTTP requests to the IndusSync Backend
 * Aligned with backend OrderController capabilities
 * 
 * @author IndusSync Frontend Team
 * @since Backend Integration Rework
 */

import { apiClient, createFormDataClient } from './client'
import type {
    CreateOrderRequest,
    OrderDetailResponse,
    OrderListResponse,
    OrderDocumentDto,
    PaginationParams,
    ApiResponse,
    CompanyMatchResponse
} from './types'
import type { OrderCalendarResponse } from '@/lib/types/calendar'

// =============================================================================
// ORDER API ENDPOINTS
// =============================================================================

export const ordersApi = {
    /**
     * Create a new order in draft status
     * POST /v1/orders/draft
     */
    async createDraft(orderData: CreateOrderRequest): Promise<OrderDetailResponse> {
        const response = await apiClient.post<OrderDetailResponse>('/orders/draft', orderData);
        return response.data;
    },

    /**
     * Publish an order (make it visible to providers)
     * POST /v1/orders/{id}/publish
     */
    async publishOrder(orderId: string): Promise<OrderDetailResponse> {
        const response = await apiClient.post<OrderDetailResponse>(`/orders/${orderId}/publish`)
        return response.data
    },

    /**
     * Update an existing order
     * PUT /v1/orders/{id}
     */
    async updateOrder(orderId: string, orderData: Partial<CreateOrderRequest>): Promise<OrderDetailResponse> {
        const response = await apiClient.put<OrderDetailResponse>(`/orders/${orderId}`, orderData)
        return response.data
    },

    /**
     * Get order details by ID
     * GET /v1/orders/{id}
     */
    async getOrder(orderId: string): Promise<OrderDetailResponse> {
        const response = await apiClient.get<OrderDetailResponse>(`/orders/${orderId}`)
        return response.data
    },

    /**
     * Get paginated list of company's orders
     * GET /v1/orders/my
     */
    async getMyOrders(role: 'client' | 'provider' = 'client', params: PaginationParams = {}): Promise<import("@/lib/api/types").PaginatedResponse<OrderListResponse>> {
        const search = new URLSearchParams();
        search.append('role', role);
        if (params.page !== undefined) search.append('page', params.page.toString());
        if (params.size !== undefined) search.append('size', params.size.toString());
        if (params.sort) search.append('sort', params.sort);
        // Include status when provided (DRAFT, PUBLISHED, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED)
        if (params.status) search.append('status', params.status);
        const response = await apiClient.get<import("@/lib/api/types").PaginatedResponse<OrderListResponse>>(`/orders/my?${search.toString()}`);
        return response.data;
    },

    /**
     * Get paginated list of company's completed orders
     * GET /v1/orders/my/completed
     */
    async getMyCompletedOrders(role: 'client' | 'provider' = 'client', params: PaginationParams = {}): Promise<import("@/lib/api/types").PaginatedResponse<OrderListResponse>> {
        const search = new URLSearchParams();
        search.append('role', role);
        if (params.page !== undefined) search.append('page', params.page.toString());
        if (params.size !== undefined) search.append('size', params.size.toString());
        const response = await apiClient.get<import("@/lib/api/types").PaginatedResponse<OrderListResponse>>(`/orders/my/completed?${search.toString()}`);
        return response.data;
    },

    /**
     * Cancel an order
     * DELETE /v1/orders/{id}
     */
    async cancelOrder(orderId: string): Promise<void> {
        await apiClient.delete(`/orders/${orderId}`)
    },

    // =============================================================================
    // DOCUMENT MANAGEMENT
    // =============================================================================

    /**
     * Upload a document for an order
     * POST /v1/orders/{orderId}/documents
     */
    async uploadDocument(
        orderId: string,
        file: File,
        documentType?: string,
        description?: string
    ): Promise<{
        success: boolean
        message: string
        document?: OrderDocumentDto
    }> {
        const formData = new FormData()
        formData.append('file', file)
        if (documentType) formData.append('documentType', documentType)
        if (description) formData.append('description', description)

        const formDataClient = createFormDataClient()
        const response = await formDataClient.post<{
            success: boolean
            message: string
            document?: OrderDocumentDto
        }>(`/orders/${orderId}/documents`, formData)

        return response.data
    },

    /**
     * Get all documents for an order
     * GET /v1/orders/{orderId}/documents
     */
    async getOrderDocuments(orderId: string): Promise<OrderDocumentDto[]> {
        const response = await apiClient.get<OrderDocumentDto[]>(`/orders/${orderId}/documents`)
        return response.data
    },

    /**
     * Download an order document
     * GET /v1/orders/{orderId}/documents/{documentId}/download
     */
    async downloadDocument(orderId: string, documentId: string): Promise<Blob> {
        const response = await apiClient.get(`/orders/${orderId}/documents/${documentId}/download`, {
            responseType: 'blob'
        })
        return response.data
    },

    /**
     * Delete an order document
     * DELETE /v1/orders/{orderId}/documents/{documentId}
     */
    async deleteDocument(orderId: string, documentId: string): Promise<{
        success: boolean
        message: string
        documentId: string
    }> {
        const response = await apiClient.delete<{
            success: boolean
            message: string
            documentId: string
        }>(`/orders/${orderId}/documents/${documentId}`)
        return response.data
    },

    // =============================================================================
    // SEARCH AND DISCOVERY
    // =============================================================================

    /**
     * Search published orders (for providers)
     * GET /v1/orders/search
     */
    async searchOrders(searchParams: {
        query?: string
        location?: string
        radius?: number
        category?: string
        minBudget?: number
        maxBudget?: number
        page?: number
        size?: number
    }): Promise<ApiResponse<OrderListResponse[]>> {
        const params = new URLSearchParams()

        Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString())
            }
        })

        const response = await apiClient.get<ApiResponse<OrderListResponse[]>>(
            `/orders/search?${params.toString()}`
        )
        return response.data
    },

    /**
     * Get paginated provider matches for an order (client side)
     * GET /v1/orders/{orderId}/matches
     */
    async getOrderMatches(orderId: string, params: { page?: number; size?: number; sort?: string } = {}): Promise<ApiResponse<CompanyMatchResponse[]>> {
        const search = new URLSearchParams();
        if (params.page !== undefined) search.append('page', params.page.toString());
        if (params.size !== undefined) search.append('size', params.size.toString());
        if (params.sort) search.append('sort', params.sort);
        const response = await apiClient.get<ApiResponse<CompanyMatchResponse[]>>(
            `/orders/${orderId}/matches?${search.toString()}`
        );
        return response.data;
    },

    /**
     * Express interest in an order (provider side)
     * POST /v1/orders/{orderId}/express-interest
     */
    async expressInterest(orderId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/orders/${orderId}/express-interest`
        );
        return response.data;
    },

    /**
     * Client selects a provider for the order
     * POST /v1/orders/{orderId}/provider-selection
     */
    async selectProvider(orderId: string, providerId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/orders/${orderId}/provider-selection?providerId=${providerId}`
        );
        return response.data;
    },

    /**
     * Get interested providers for an order (companies that have expressed interest)
     * GET /v1/orders/{orderId}/interested-providers
     */
    async getInterestedProviders(orderId: string): Promise<{ data: CompanyMatchResponse[]; totalElements: number }> {
        const response = await apiClient.get<{ data: CompanyMatchResponse[]; totalElements: number }>(
            `/orders/${orderId}/interested-providers`
        );
        return response.data;
    },

    // =============================================================================
    // DEADLINE EXTENSION WORKFLOW
    // =============================================================================

    /**
     * Propose or confirm a deadline extension
     * PATCH /v1/orders/{id}/extend-deadline
     * Pass { proposedDeadline, confirm } in the body
     */
    async extendDeadline(orderId: string, proposedDeadline: string, confirm: boolean = false): Promise<void> {
        // Ensure proposedDeadline has milliseconds and Z suffix per backend pattern
        let normalized = proposedDeadline;
        if (!/\.\d{3}Z$/.test(proposedDeadline)) {
            try {
                const dateObj = new Date(proposedDeadline);
                normalized = dateObj.toISOString();
            } catch {
                // If parsing fails, fallback by appending .000Z when missing
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(proposedDeadline)) {
                    normalized = proposedDeadline + '.000Z';
                }
            }
        }
        await apiClient.patch(`/orders/${orderId}/extend-deadline`, {
            proposedDeadline: normalized,
            confirm,
        });
    },

    /**
     * Get current deadline extension proposal
     * GET /v1/orders/{id}/deadline-extension-proposal
     */
    async getDeadlineExtensionProposal(orderId: string): Promise<any | null> {
        try {
            const response = await apiClient.get(`/orders/${orderId}/deadline-extension-proposal`);
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (err: any) {
            if (err.response?.status === 404 || err.response?.status === 204) return null;
            return null;
        }
    },

    /**
     * Reject a deadline extension proposal
     * POST /v1/orders/{id}/deadline-extension/reject
     */
    async rejectDeadlineExtension(orderId: string, rejectionReason?: string): Promise<void> {
        await apiClient.post(`/orders/${orderId}/deadline-extension/reject`, {
            rejectionReason
        });
    },

    /**
     * Cancel a deadline extension proposal (by requester)
     * DELETE /v1/orders/{id}/deadline-extension/cancel
     */
    async cancelDeadlineExtensionProposal(orderId: string): Promise<void> {
        await apiClient.delete(`/orders/${orderId}/deadline-extension/cancel`);
    },

    // =============================================================================
    // ORDER COMPLETION WORKFLOW
    // =============================================================================

    /**
     * Request order completion
     * POST /v1/orders/{id}/completion-request
     */
    async requestCompletion(orderId: string, completionMessage?: string): Promise<import("@/lib/types/completion-request").CompletionRequest> {
        const response = await apiClient.post<import("@/lib/types/completion-request").CompletionRequest>(
            `/orders/${orderId}/completion-request`,
            { completionMessage }
        );
        return response.data;
    },

    /**
     * Confirm order completion
     * POST /v1/orders/{id}/completion-request/confirm
     */
    async confirmCompletion(orderId: string): Promise<import("@/lib/types/completion-request").CompletionRequest> {
        const response = await apiClient.post<import("@/lib/types/completion-request").CompletionRequest>(
            `/orders/${orderId}/completion-request/confirm`
        );
        return response.data;
    },

    /**
     * Reject order completion with optional reason
     * POST /v1/orders/{id}/completion-request/reject
     */
    async rejectCompletion(orderId: string, rejectionReason?: string): Promise<import("@/lib/types/completion-request").CompletionRequest> {
        const response = await apiClient.post<import("@/lib/types/completion-request").CompletionRequest>(
            `/orders/${orderId}/completion-request/reject`,
            { rejectionReason }
        );
        return response.data;
    },

    /**
     * Cancel completion request (by requester)
     * DELETE /v1/orders/{id}/completion-request
     */
    async cancelCompletion(orderId: string): Promise<import("@/lib/types/completion-request").CompletionRequest> {
        const response = await apiClient.delete<import("@/lib/types/completion-request").CompletionRequest>(
            `/orders/${orderId}/completion-request`
        );
        return response.data;
    },

    /**
     * Get current completion request for an order
     * GET /v1/orders/{id}/completion-request
     */
    async getCompletionRequest(orderId: string): Promise<import("@/lib/types/completion-request").CompletionRequest | null> {
        try {
            const response = await apiClient.get<import("@/lib/types/completion-request").CompletionRequest>(
                `/orders/${orderId}/completion-request`
            );
            // Handle both 204 No Content and 200 with empty/null data
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (err: any) {
            // Handle 204 No Content (no completion request exists) - this is expected and should not show error toast
            if (err.response?.status === 204) return null;
            // Handle 404 Not Found (order not found) - this is an actual error but return null to be safe
            if (err.response?.status === 404) return null;
            // For other errors, still return null but they might be logged elsewhere
            return null;
        }
    },

    /**
     * Get pending completion request for an order
     * GET /v1/orders/{id}/completion-request/pending
     */
    async getPendingCompletionRequest(orderId: string): Promise<import("@/lib/types/completion-request").CompletionRequest | null> {
        try {
            const response = await apiClient.get<import("@/lib/types/completion-request").CompletionRequest>(
                `/orders/${orderId}/completion-request/pending`
            );
            // Handle both 204 No Content and 200 with empty/null data
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (err: any) {
            // Handle 204 No Content (no pending completion request exists) - this is expected and should not show error toast
            if (err.response?.status === 204) return null;
            // Handle 404 Not Found (order not found) - this is an actual error but return null to be safe
            if (err.response?.status === 404) return null;
            // For other errors, still return null but they might be logged elsewhere
            return null;
        }
    },

    /**
     * Get completion request history for an order
     * GET /v1/orders/{id}/completion-request/history
     */
    async getCompletionRequestHistory(orderId: string): Promise<import("@/lib/types/completion-request").CompletionRequest[]> {
        const response = await apiClient.get<import("@/lib/types/completion-request").CompletionRequest[]>(
            `/orders/${orderId}/completion-request/history`
        );
        return response.data;
    },

    /**
     * Check if current user can request completion
     * GET /v1/orders/{id}/completion-request/can-request
     */
    async canRequestCompletion(orderId: string): Promise<boolean> {
        const response = await apiClient.get<boolean>(`/orders/${orderId}/completion-request/can-request`);
        return response.data;
    },

    /**
     * Check if current user can confirm completion
     * GET /v1/orders/{id}/completion-request/can-confirm
     */
    async canConfirmCompletion(orderId: string): Promise<boolean> {
        const response = await apiClient.get<boolean>(`/orders/${orderId}/completion-request/can-confirm`);
        return response.data;
    },

    /**
     * Check if current user can reject completion
     * GET /v1/orders/{id}/completion-request/can-reject
     */
    async canRejectCompletion(orderId: string): Promise<boolean> {
        const response = await apiClient.get<boolean>(`/orders/${orderId}/completion-request/can-reject`);
        return response.data;
    },

    /**
     * Check if current user can cancel completion request
     * GET /v1/orders/{id}/completion-request/can-cancel
     */
    async canCancelCompletion(orderId: string): Promise<boolean> {
        const response = await apiClient.get<boolean>(`/orders/${orderId}/completion-request/can-cancel`);
        return response.data;
    },

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Validate order data before submission
     */
    validateOrderData(orderData: CreateOrderRequest): {
        isValid: boolean
        errors: string[]
    } {
        const errors: string[] = []

        if (!orderData.title?.trim()) {
            errors.push('Titel ist erforderlich')
        }

        if (!orderData.description?.trim()) {
            errors.push('Beschreibung ist erforderlich')
        }

        if (!orderData.city?.trim()) {
            errors.push('Dienstleistungsort ist erforderlich')
        }

        if (!orderData.primaryCategory) {
            errors.push('Hauptkategorie ist erforderlich')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    },

    /**
     * Get calendar orders for the current user's company
     * GET /v1/orders/calendar
     */
    async getCalendarOrders(
        role: 'client' | 'provider',
        params: {
            startDate?: string, // ISO date string
            endDate?: string,   // ISO date string
        } = {}
    ): Promise<OrderCalendarResponse[]> {
        const searchParams = new URLSearchParams();
        searchParams.append('role', role);

        if (params.startDate) {
            searchParams.append('startDate', params.startDate);
        }
        if (params.endDate) {
            searchParams.append('endDate', params.endDate);
        }

        const response = await apiClient.get<OrderCalendarResponse[]>(
            `/orders/calendar?${searchParams.toString()}`
        );

        return response.data;
    },
}

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

export const orderQueryKeys = {
    all: ['orders'] as const,
    lists: () => [...orderQueryKeys.all, 'list'] as const,
    list: (filters: any) => [...orderQueryKeys.lists(), filters] as const,
    details: () => [...orderQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...orderQueryKeys.details(), id] as const,
    documents: (orderId: string) => [...orderQueryKeys.detail(orderId), 'documents'] as const,
    search: (params: any) => [...orderQueryKeys.all, 'search', params] as const,
    matches: (orderId: string) => [...orderQueryKeys.detail(orderId), 'matches'] as const,
    interestedProviders: (orderId: string) => [...orderQueryKeys.detail(orderId), 'interested-providers'] as const,
    completionRequest: (orderId: string) => [...orderQueryKeys.detail(orderId), 'completion-request'] as const,
    completionHistory: (orderId: string) => [...orderQueryKeys.detail(orderId), 'completion-history'] as const,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class OrderApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public errors?: string[]
    ) {
        super(message)
        this.name = 'OrderApiError'
    }
}

export function handleOrderApiError(error: any): OrderApiError {
    if (error.response) {
        const { status, data } = error.response
        const message = data?.message || data?.error || 'Ein unbekannter Fehler ist aufgetreten'
        const errors = data?.errors || []
        return new OrderApiError(message, status, errors)
    }

    if (error.request) {
        return new OrderApiError('Netzwerkfehler: Server nicht erreichbar')
    }

    return new OrderApiError(error.message || 'Ein unbekannter Fehler ist aufgetreten')
} 