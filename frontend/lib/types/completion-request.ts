/**
 * Order Completion Request Types
 * TypeScript interfaces for the dual-confirmation completion workflow
 * Aligned with backend DTOs and API contracts
 * 
 * @author IndusSync Frontend Team
 * @since 2025-01-10
 */

// =============================================================================
// CORE COMPLETION REQUEST TYPES
// =============================================================================

/**
 * Completion request status enum
 * Matches backend OrderCompletionRequest.Status
 */
export type CompletionRequestStatus =
    | 'REQUESTED'   // Initial state - awaiting counterpart response
    | 'CONFIRMED'   // Confirmed by counterpart - order completed
    | 'REJECTED'    // Rejected by counterpart - back to requester
    | 'CANCELLED'   // Cancelled by requester - request withdrawn

/**
 * Complete completion request object
 * Matches backend CompletionRequestDto
 */
export interface CompletionRequest {
    id: string
    orderId: string
    requesterCompanyId: string
    status: CompletionRequestStatus
    completionMessage?: string
    confirmedByCompanyId?: string
    confirmedAt?: string
    rejectedByCompanyId?: string
    rejectedAt?: string
    rejectionReason?: string
    cancelledAt?: string
    createdAt: string
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request DTO for creating a completion request
 * Matches backend CreateCompletionRequestDto
 */
export interface CreateCompletionRequestDto {
    completionMessage?: string
}

/**
 * Request DTO for rejecting a completion request
 * Matches backend RejectCompletionRequestDto  
 */
export interface RejectCompletionRequestDto {
    rejectionReason?: string
}

/**
 * Authorization check results for completion actions
 * Used by frontend to show/hide action buttons
 */
export interface CompletionAuthorizationChecks {
    canRequest: boolean
    canConfirm: boolean
    canReject: boolean
    canCancel: boolean
}

// =============================================================================
// UI-SPECIFIC TYPES
// =============================================================================

/**
 * Completion request with UI-friendly computed properties
 * Extended version for frontend consumption
 */
export interface CompletionRequestUI extends CompletionRequest {
    // Status checks
    isPending: boolean
    isConfirmed: boolean
    isRejected: boolean
    isCancelled: boolean

    // Timeline helpers
    requestedAgo: string
    resolvedAgo?: string

    // User role context
    isCurrentUserRequester: boolean
    isCurrentUserCounterpart: boolean

    // Action availability
    canCurrentUserConfirm: boolean
    canCurrentUserReject: boolean
    canCurrentUserCancel: boolean
}

/**
 * Completion workflow step for progress indicators
 */
export interface CompletionWorkflowStep {
    step: 'requested' | 'responded' | 'completed'
    status: 'pending' | 'active' | 'completed' | 'rejected'
    title: string
    description: string
    timestamp?: string
    actor?: string
}

/**
 * Completion summary for order lists and cards
 */
export interface CompletionSummary {
    hasCompletionRequest: boolean
    status?: CompletionRequestStatus
    requesterName: string
    resolvedAt?: string
    canTakeAction: boolean
    actionType?: 'confirm' | 'reject' | 'cancel'
}

// =============================================================================
// HOOK RESULT TYPES
// =============================================================================

/**
 * Result type for completion request mutations
 */
export interface CompletionRequestMutationResult {
    completionRequest: CompletionRequest
    message: string
}

/**
 * Options for completion request hooks
 */
export interface UseCompletionRequestOptions {
    enabled?: boolean
    refetchInterval?: number
    onSuccess?: (data: CompletionRequest) => void
    onError?: (error: Error) => void
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if a completion request is pending
 */
export function isPendingCompletionRequest(request?: CompletionRequest): boolean {
    return request?.status === 'REQUESTED'
}

/**
 * Type guard to check if a completion request is resolved
 */
export function isResolvedCompletionRequest(request?: CompletionRequest): boolean {
    return request?.status === 'CONFIRMED' || request?.status === 'REJECTED' || request?.status === 'CANCELLED'
}

/**
 * Get display-friendly status text
 */
export function getCompletionStatusDisplayText(status: CompletionRequestStatus): string {
    switch (status) {
        case 'REQUESTED':
            return 'Abschluss beantragt'
        case 'CONFIRMED':
            return 'Abschluss bestätigt'
        case 'REJECTED':
            return 'Abschluss abgelehnt'
        case 'CANCELLED':
            return 'Antrag storniert'
        default:
            return 'Unbekannter Status'
    }
}

/**
 * Get status color for UI indicators
 */
export function getCompletionStatusColor(status: CompletionRequestStatus): string {
    switch (status) {
        case 'REQUESTED':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'CONFIRMED':
            return 'text-green-600 bg-green-50 border-green-200'
        case 'REJECTED':
            return 'text-red-600 bg-red-50 border-red-200'
        case 'CANCELLED':
            return 'text-gray-600 bg-gray-50 border-gray-200'
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200'
    }
} 