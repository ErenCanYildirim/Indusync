/**
 * Application utility functions and formatting helpers
 * Provides utilities for handling order applications including date formatting,
 * status management, and user permission checks
 * 
 * @author IndusSync Frontend Team
 * @since Order Applications Display Implementation
 */

import { ApplicationStatus, OrderApplicationDto, CompanyMatchResponse } from '../api/types';
import { CompanyRole } from './permissions';

// =============================================================================
// APPLICATION STATUS UTILITIES
// =============================================================================

/**
 * Status color mapping for application badges
 * Uses Tailwind CSS classes for consistent styling
 */
export const ApplicationStatusColors = {
    APPLIED: 'bg-blue-100 text-blue-800 border-blue-200',
    WITHDRAWN: 'bg-gray-100 text-gray-800 border-gray-200',
    ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200'
} as const;

/**
 * Gets the appropriate color classes for an application status badge
 * @param status - The application status
 * @returns Tailwind CSS classes for styling the status badge
 */
export function getApplicationStatusColor(status: ApplicationStatus): string {
    return ApplicationStatusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Status text mapping for localized display
 * These keys correspond to translation keys in the message files
 */
export const ApplicationStatusTranslationKeys = {
    APPLIED: 'Applications.status.applied',
    WITHDRAWN: 'Applications.status.withdrawn',
    ACCEPTED: 'Applications.status.accepted',
    REJECTED: 'Applications.status.rejected'
} as const;

/**
 * Gets the translation key for an application status
 * @param status - The application status
 * @returns Translation key for use with next-intl
 */
export function getApplicationStatusTranslationKey(status: ApplicationStatus): string {
    return ApplicationStatusTranslationKeys[status] || 'Applications.status.unknown';
}

/**
 * Fallback status text for when translations are not available
 */
export const ApplicationStatusFallbackText = {
    APPLIED: 'Applied',
    WITHDRAWN: 'Withdrawn',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected'
} as const;

/**
 * Gets fallback text for an application status
 * @param status - The application status
 * @returns Fallback text in English
 */
export function getApplicationStatusFallbackText(status: ApplicationStatus): string {
    return ApplicationStatusFallbackText[status] || status;
}

// =============================================================================
// DATE FORMATTING UTILITIES
// =============================================================================

/**
 * Formats an application timestamp for display
 * Uses the existing ServerFormatter pattern for consistency
 * @param appliedAt - ISO string timestamp
 * @param locale - Locale for formatting (default: 'de')
 * @returns Formatted date string
 */
export function formatApplicationDate(appliedAt: string, locale: string = 'de'): string {
    const date = new Date(appliedAt);
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Berlin'
    }).format(date);
}

/**
 * Formats an application timestamp with time for detailed views
 * @param appliedAt - ISO string timestamp
 * @param locale - Locale for formatting (default: 'de')
 * @returns Formatted date and time string
 */
export function formatApplicationDateTime(appliedAt: string, locale: string = 'de'): string {
    const date = new Date(appliedAt);
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin'
    }).format(date);
}

/**
 * Formats an application timestamp as relative time (e.g., "2 days ago")
 * @param appliedAt - ISO string timestamp
 * @param locale - Locale for formatting (default: 'de')
 * @returns Relative time string
 */
export function formatApplicationRelativeTime(appliedAt: string, locale: string = 'de'): string {
    const date = new Date(appliedAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
}

// =============================================================================
// USER PERMISSION UTILITIES
// =============================================================================

/**
 * Determines if a user can accept an application
 * @param application - The application to check
 * @param userCompanyId - Current user's company ID
 * @param userRole - Current user's company role
 * @param orderCompanyId - The order owner's company ID
 * @returns True if user can accept the application
 */
export function canAcceptApplication(
    application: OrderApplicationDto,
    userCompanyId: string,
    userRole: CompanyRole,
    orderCompanyId: string
): boolean {
    // Only order owners (clients) can accept applications
    if (userCompanyId !== orderCompanyId) {
        return false;
    }

    // Only clients or companies with both roles can accept applications
    if (userRole !== 'CLIENT' && userRole !== 'BOTH') {
        return false;
    }

    // Can only accept applications that are currently in APPLIED status
    return application.status === 'APPLIED';
}

/**
 * Determines if a user can reject an application
 * @param application - The application to check
 * @param userCompanyId - Current user's company ID
 * @param userRole - Current user's company role
 * @param orderCompanyId - The order owner's company ID
 * @returns True if user can reject the application
 */
export function canRejectApplication(
    application: OrderApplicationDto,
    userCompanyId: string,
    userRole: CompanyRole,
    orderCompanyId: string
): boolean {
    // Only order owners (clients) can reject applications
    if (userCompanyId !== orderCompanyId) {
        return false;
    }

    // Only clients or companies with both roles can reject applications
    if (userRole !== 'CLIENT' && userRole !== 'BOTH') {
        return false;
    }

    // Can only reject applications that are currently in APPLIED status
    return application.status === 'APPLIED';
}

/**
 * Determines if a user can withdraw their own application
 * @param application - The application to check
 * @param userCompanyId - Current user's company ID
 * @param userRole - Current user's company role
 * @returns True if user can withdraw the application
 */
export function canWithdrawApplication(
    application: OrderApplicationDto,
    userCompanyId: string,
    userRole: CompanyRole
): boolean {
    // Can only withdraw own applications
    if (application.companyId !== userCompanyId) {
        return false;
    }

    // Only providers or companies with both roles can withdraw applications
    if (userRole !== 'PROVIDER' && userRole !== 'BOTH') {
        return false;
    }

    // Can only withdraw applications that are currently in APPLIED status
    return application.status === 'APPLIED';
}

/**
 * Determines if an application should be highlighted for the current user
 * @param application - The application to check
 * @param userCompanyId - Current user's company ID
 * @returns True if this is the current user's application
 */
export function isCurrentUserApplication(
    application: OrderApplicationDto,
    userCompanyId: string
): boolean {
    return application.companyId === userCompanyId || application.isCurrentUserApplication === true;
}

/**
 * Gets the appropriate actions available for an application based on user permissions
 * @param application - The application to check
 * @param userCompanyId - Current user's company ID
 * @param userRole - Current user's company role
 * @param orderCompanyId - The order owner's company ID
 * @returns Object with available actions
 */
export function getApplicationActions(
    application: OrderApplicationDto,
    userCompanyId: string,
    userRole: CompanyRole,
    orderCompanyId: string
) {
    return {
        canAccept: canAcceptApplication(application, userCompanyId, userRole, orderCompanyId),
        canReject: canRejectApplication(application, userCompanyId, userRole, orderCompanyId),
        canWithdraw: canWithdrawApplication(application, userCompanyId, userRole),
        isCurrentUser: isCurrentUserApplication(application, userCompanyId),
        canViewDetails: true // All users can view application details
    };
}

// =============================================================================
// APPLICATION SORTING AND FILTERING UTILITIES
// =============================================================================

/**
 * Sorts applications by date (newest first)
 * @param applications - Array of applications to sort
 * @returns Sorted array of applications
 */
export function sortApplicationsByDate(applications: OrderApplicationDto[]): OrderApplicationDto[] {
    return [...applications].sort((a, b) => {
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
}

/**
 * Sorts applications by status priority (APPLIED first, then others)
 * @param applications - Array of applications to sort
 * @returns Sorted array of applications
 */
export function sortApplicationsByStatus(applications: OrderApplicationDto[]): OrderApplicationDto[] {
    const statusPriority: Record<ApplicationStatus, number> = {
        APPLIED: 1,
        ACCEPTED: 2,
        REJECTED: 3,
        WITHDRAWN: 4
    };

    return [...applications].sort((a, b) => {
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If same priority, sort by date (newest first)
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
}

/**
 * Filters applications by status
 * @param applications - Array of applications to filter
 * @param status - Status to filter by
 * @returns Filtered array of applications
 */
export function filterApplicationsByStatus(
    applications: OrderApplicationDto[],
    status: ApplicationStatus
): OrderApplicationDto[] {
    return applications.filter(app => app.status === status);
}

/**
 * Gets active applications (APPLIED status only)
 * @param applications - Array of applications to filter
 * @returns Array of active applications
 */
export function getActiveApplications(applications: OrderApplicationDto[]): OrderApplicationDto[] {
    return filterApplicationsByStatus(applications, 'APPLIED');
}

/**
 * Gets the count of applications by status
 * @param applications - Array of applications to count
 * @returns Object with counts by status
 */
export function getApplicationStatusCounts(applications: OrderApplicationDto[]) {
    return applications.reduce((counts, app) => {
        counts[app.status] = (counts[app.status] || 0) + 1;
        return counts;
    }, {} as Record<ApplicationStatus, number>);
}

// =============================================================================
// DATA MAPPING UTILITIES
// =============================================================================

/**
 * Maps CompanyMatchResponse from backend to OrderApplicationDto for frontend display
 * This bridges the gap between the backend's interested providers endpoint
 * and the frontend's application display components
 * 
 * @param match - CompanyMatchResponse from backend
 * @param currentUserCompanyId - Current user's company ID for permission checks
 * @returns OrderApplicationDto for frontend consumption
 */
export function mapCompanyMatchToApplication(
    match: CompanyMatchResponse,
    currentUserCompanyId?: string
): OrderApplicationDto {
    // Determine application status based on backend data
    // If the provider has responded and is interested, they have "applied"
    // If they viewed but didn't respond or aren't interested, we could consider it "withdrawn"
    // For now, we'll use a simple mapping based on the interested flag
    let status: ApplicationStatus = 'APPLIED';

    if (match.interested === false) {
        status = 'WITHDRAWN';
    } else if (match.interested === true || match.respondedAt) {
        status = 'APPLIED';
    }

    return {
        id: `${match.providerId}-${Date.now()}`, // Generate a unique ID since backend doesn't provide one
        companyId: match.providerId,
        companyName: match.company?.companyName || 'Unknown Company',
        appliedAt: match.respondedAt || match.viewedAt || match.matchedAt, // Use the most relevant timestamp
        status: status,
        message: match.company?.message, // Optional application message from company profile
        isCurrentUserApplication: currentUserCompanyId === match.providerId
    };
}

/**
 * Maps an array of CompanyMatchResponse objects to OrderApplicationDto array
 * @param matches - Array of CompanyMatchResponse from backend
 * @param currentUserCompanyId - Current user's company ID for permission checks
 * @returns Array of OrderApplicationDto for frontend consumption
 */
export function mapCompanyMatchesToApplications(
    matches: CompanyMatchResponse[],
    currentUserCompanyId?: string
): OrderApplicationDto[] {
    return matches
        .filter(match => match.interested === true || match.respondedAt) // Only include providers who have shown interest
        .map(match => mapCompanyMatchToApplication(match, currentUserCompanyId))
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()); // Sort by date, newest first
}