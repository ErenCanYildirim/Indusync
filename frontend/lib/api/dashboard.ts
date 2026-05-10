/**
 * Dashboard API Service - Complete Implementation
 * Handles all dashboard-related HTTP requests to the IndusSync Backend
 * Provides real-time statistics and order activity chart data
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { apiClient } from './client'
import { AxiosError } from 'axios'

// =============================================================================
// DASHBOARD STATISTICS TYPES
// =============================================================================

/**
 * Company role enumeration matching backend CompanyRole
 */
export enum CompanyRole {
    CLIENT = 'CLIENT',
    PROVIDER = 'PROVIDER'
}

/**
 * Role-specific context information for dashboard metrics
 */
export interface DashboardRoleContext {
    /**
     * Context-aware description for active orders metric
     */
    activeOrdersDescription: string

    /**
     * Context-aware description for open applications metric
     */
    openApplicationsDescription: string

    /**
     * Context-aware description for completed orders metric
     */
    completedOrdersDescription: string

    /**
     * Context-aware description for average response time metric
     */
    responseTimeDescription: string

    /**
     * Tooltip text explaining how active orders are calculated
     */
    activeOrdersTooltip: string

    /**
     * Tooltip text explaining how open applications are calculated
     */
    openApplicationsTooltip: string

    /**
     * Tooltip text explaining how completed orders are calculated
     */
    completedOrdersTooltip: string

    /**
     * Tooltip text explaining how response time is calculated
     */
    responseTimeTooltip: string

    /**
     * Indicates if the company has dual roles (both CLIENT and PROVIDER)
     */
    isDualRole: boolean

    /**
     * Indicates if the company acts as a client
     */
    isClient: boolean

    /**
     * Indicates if the company acts as a provider
     */
    isProvider: boolean
}

/**
 * Dashboard statistics response from backend
 * Contains key performance metrics for a company with role-aware context
 */
export interface DashboardStatistics {
    /**
     * Number of currently active orders for the company.
     * For clients: Orders with status PUBLISHED, MATCHED, or ASSIGNED.
     * For providers: Orders assigned to the company with status ASSIGNED.
     * For dual-role companies: Sum of both client and provider active orders.
     */
    activeOrders: number

    /**
     * Number of open applications related to the company's orders.
     * For clients: Applications received on published orders with status INTERESTED.
     * For providers: Applications sent to other companies with status INTERESTED.
     * For dual-role companies: Sum of both received and sent applications.
     */
    openApplications: number

    /**
     * Number of completed orders for the company.
     * For clients: Orders created by the company with status COMPLETED.
     * For providers: Orders completed by the company as provider.
     * For dual-role companies: Sum of both client and provider completed orders.
     */
    completedOrders: number

    /**
     * Average response time in days for order interactions.
     * For clients: Average time from order publication to first application received.
     * For providers: Average time from order publication to application submission.
     * For dual-role companies: Weighted average based on role-specific interactions.
     * Null if no response time data is available.
     */
    averageResponseTimeDays: number | null

    /**
     * Human-readable display format of the average response time.
     * Examples: "1.2 Tage", "0.5 Tage", "Keine Daten"
     */
    averageResponseTimeDisplay: string

    /**
     * Set of roles this company has in the system.
     * Determines how statistics are calculated and displayed.
     */
    companyRoles: CompanyRole[]

    /**
     * Role-specific context information for metric descriptions and tooltips.
     * Provides context-aware descriptions based on the company's roles.
     */
    roleContext: DashboardRoleContext
}

/**
 * Daily order activity data for dashboard charts
 * Contains daily counts of orders and applications with German formatting
 */
export interface OrderActivityData {
    /**
     * The date for this activity data point (ISO date string)
     */
    date: string

    /**
     * Human-readable display format of the date for chart labels.
     * Format: "dd.MM" (e.g., "01.05" for May 1st)
     */
    dateDisplay: string

    /**
     * Number of "Aufträge" (orders) for this date.
     * For clients: Orders created/published on this date.
     * For providers: Orders assigned to the company on this date.
     * For dual-role companies: Sum of both client and provider orders.
     */
    auftraege: number

    /**
     * Number of "Anfragen" (applications/inquiries) for this date.
     * For clients: Applications received on published orders on this date.
     * For providers: Applications sent to other companies on this date.
     * For dual-role companies: Sum of both received and sent applications.
     */
    anfragen: number

    /**
     * Ratio of anfragen to total activity (optional, from backend)
     */
    anfragenRatio?: number

    /**
     * Ratio of auftraege to total activity (optional, from backend)
     */
    auftraegeRatio?: number

    /**
     * Total activity count (optional, from backend)
     */
    totalActivity?: number

    /**
     * Activity summary text (optional, from backend)
     */
    activitySummary?: string
}

// =============================================================================
// API SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Dashboard API service with comprehensive error handling and retry logic
 */
export const dashboardApi = {
    /**
     * Retrieves comprehensive dashboard statistics for the authenticated company.
     * 
     * Returns key performance metrics including active orders, open applications,
     * completed orders, and average response time. All metrics are calculated
     * based on the company's role as client, provider, or both.
     * 
     * @returns Promise<DashboardStatistics> Dashboard statistics for the authenticated company
     * @throws DashboardApiError When the request fails
     */
    async getDashboardStatistics(): Promise<DashboardStatistics> {
        try {
            const response = await apiClient.get<DashboardStatistics>('/dashboard/statistics')
            return response.data
        } catch (error) {
            throw handleDashboardApiError(error, 'Failed to fetch dashboard statistics')
        }
    },

    /**
     * Retrieves order activity chart data for the authenticated company.
     * 
     * Returns daily activity data showing "Aufträge" (orders) and "Anfragen"
     * (applications) over the specified time period. The data is role-aware
     * and properly categorized based on the company's business context.
     * 
     * @param days Number of days to include in the chart (default: 30, max: 365)
     * @returns Promise<OrderActivityData[]> List of daily order activity data for chart display
     * @throws DashboardApiError When the request fails
     */
    async getOrderActivityChart(days: number = 30): Promise<OrderActivityData[]> {
        try {
            // Validate days parameter
            if (days < 1 || days > 365) {
                throw new DashboardApiError(
                    'Days parameter must be between 1 and 365',
                    400,
                    ['Invalid days parameter']
                )
            }

            const response = await apiClient.get<OrderActivityData[]>(
                `/dashboard/activity-chart?days=${days}`
            )
            return response.data
        } catch (error) {
            throw handleDashboardApiError(error, 'Failed to fetch order activity chart data')
        }
    },

    /**
     * Retrieves both dashboard statistics and activity chart data in a single call.
     * Useful for loading complete dashboard data efficiently.
     * 
     * @param days Number of days for activity chart (default: 30)
     * @returns Promise with both statistics and chart data
     * @throws DashboardApiError When any request fails
     */
    async getDashboardData(days: number = 30): Promise<{
        statistics: DashboardStatistics
        activityChart: OrderActivityData[]
    }> {
        try {
            const [statistics, activityChart] = await Promise.all([
                dashboardApi.getDashboardStatistics(),
                dashboardApi.getOrderActivityChart(days)
            ])

            return { statistics, activityChart }
        } catch (error) {
            throw handleDashboardApiError(error, 'Failed to fetch complete dashboard data')
        }
    }
}

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Query key factories for TanStack Query integration
 */
export const dashboardQueryKeys = {
    all: ['dashboard'] as const,
    statistics: () => [...dashboardQueryKeys.all, 'statistics'] as const,
    activityChart: (days: number) => [...dashboardQueryKeys.all, 'activity-chart', days] as const,
    dashboardData: (days: number) => [...dashboardQueryKeys.all, 'dashboard-data', days] as const,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Custom error class for dashboard API operations
 */
export class DashboardApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public errors?: string[]
    ) {
        super(message)
        this.name = 'DashboardApiError'
    }
}

/**
 * Handles and transforms API errors into DashboardApiError instances
 * 
 * @param error The original error from the API call
 * @param defaultMessage Default message to use if no specific error message is available
 * @returns DashboardApiError instance with appropriate error details
 */
export function handleDashboardApiError(error: any, defaultMessage: string): DashboardApiError {
    // Handle Axios errors
    if (error instanceof AxiosError && error.response) {
        const { status, data } = error.response
        const message = data?.message || data?.error || defaultMessage
        const errors = data?.errors || []

        // Handle specific HTTP status codes
        switch (status) {
            case 400:
                return new DashboardApiError(
                    `Ungültige Anfrage: ${message}`,
                    status,
                    errors
                )
            case 401:
                return new DashboardApiError(
                    'Authentifizierung erforderlich. Bitte melden Sie sich erneut an.',
                    status,
                    errors
                )
            case 403:
                return new DashboardApiError(
                    'Keine Berechtigung für Dashboard-Statistiken.',
                    status,
                    errors
                )
            case 404:
                return new DashboardApiError(
                    'Dashboard-Daten nicht gefunden.',
                    status,
                    errors
                )
            case 500:
                return new DashboardApiError(
                    'Serverfehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.',
                    status,
                    errors
                )
            default:
                return new DashboardApiError(message, status, errors)
        }
    }

    // Handle network errors
    if (error instanceof AxiosError && error.code === 'NETWORK_ERROR') {
        return new DashboardApiError(
            'Netzwerkfehler: Dashboard-Daten konnten nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.'
        )
    }

    // Handle timeout errors
    if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
        return new DashboardApiError(
            'Zeitüberschreitung: Das Laden der Dashboard-Daten hat zu lange gedauert. Bitte versuchen Sie es erneut.'
        )
    }

    // Handle DashboardApiError instances (re-throw)
    if (error instanceof DashboardApiError) {
        return error
    }

    // Handle generic errors
    return new DashboardApiError(
        error?.message || defaultMessage
    )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates dashboard statistics data
 * 
 * @param statistics The statistics data to validate
 * @returns Object with validation result and any errors
 */
export function validateDashboardStatistics(statistics: any): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (typeof statistics !== 'object' || statistics === null) {
        errors.push('Dashboard statistics must be an object')
        return { isValid: false, errors }
    }

    // Validate required numeric fields
    const numericFields = ['activeOrders', 'openApplications', 'completedOrders']
    for (const field of numericFields) {
        if (typeof statistics[field] !== 'number' || statistics[field] < 0) {
            errors.push(`${field} must be a non-negative number`)
        }
    }

    // Validate averageResponseTimeDays (can be null)
    if (statistics.averageResponseTimeDays !== null &&
        (typeof statistics.averageResponseTimeDays !== 'number' || statistics.averageResponseTimeDays < 0)) {
        errors.push('averageResponseTimeDays must be null or a non-negative number')
    }

    // Validate display string
    if (typeof statistics.averageResponseTimeDisplay !== 'string') {
        errors.push('averageResponseTimeDisplay must be a string')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Validates order activity chart data
 * 
 * @param activityData The activity data array to validate
 * @returns Object with validation result and any errors
 */
export function validateOrderActivityData(activityData: any): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!Array.isArray(activityData)) {
        errors.push('Order activity data must be an array')
        return { isValid: false, errors }
    }

    activityData.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) {
            errors.push(`Activity data item ${index} must be an object`)
            return
        }

        // Validate required fields
        if (typeof item.date !== 'string') {
            errors.push(`Activity data item ${index}: date must be a string`)
        }

        if (typeof item.dateDisplay !== 'string') {
            errors.push(`Activity data item ${index}: dateDisplay must be a string`)
        }

        if (typeof item.auftraege !== 'number' || item.auftraege < 0) {
            errors.push(`Activity data item ${index}: auftraege must be a non-negative number`)
        }

        if (typeof item.anfragen !== 'number' || item.anfragen < 0) {
            errors.push(`Activity data item ${index}: anfragen must be a non-negative number`)
        }
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Formats dashboard statistics for display
 * 
 * @param statistics The dashboard statistics to format
 * @returns Formatted statistics with additional computed properties
 */
export function formatDashboardStatistics(statistics: DashboardStatistics) {
    return {
        ...statistics,
        hasActivity: statistics.activeOrders > 0 || statistics.openApplications > 0 || statistics.completedOrders > 0,
        hasResponseTimeData: statistics.averageResponseTimeDays !== null,
        totalOrders: statistics.activeOrders + statistics.completedOrders,
    }
}

/**
 * Calculates summary statistics from activity chart data
 * 
 * @param activityData The activity chart data
 * @returns Summary statistics for the activity period
 */
export function calculateActivitySummary(activityData: OrderActivityData[]) {
    const totalAuftraege = activityData.reduce((sum, item) => sum + item.auftraege, 0)
    const totalAnfragen = activityData.reduce((sum, item) => sum + item.anfragen, 0)
    const totalActivity = totalAuftraege + totalAnfragen
    const activeDays = activityData.filter(item => item.auftraege > 0 || item.anfragen > 0).length
    const averageDaily = activityData.length > 0 ? totalActivity / activityData.length : 0

    return {
        totalAuftraege,
        totalAnfragen,
        totalActivity,
        activeDays,
        averageDaily: Math.round(averageDaily * 10) / 10, // Round to 1 decimal place
        period: activityData.length
    }
}