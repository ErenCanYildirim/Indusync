/**
 * Dashboard-related TypeScript types and interfaces
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { DashboardStatistics, OrderActivityData, CompanyRole, DashboardRoleContext } from '../api/dashboard';
import { OrderStatus as ApiOrderStatus } from '../api/types';

// Re-export dashboard types from API service
export type {
    DashboardStatistics,
    OrderActivityData,
    CompanyRole,
    DashboardRoleContext
} from '../api/dashboard';

// Additional dashboard-specific types for UI components

/**
 * Dashboard loading states for UI components
 */
export interface DashboardLoadingState {
    statistics: boolean
    activityChart: boolean
    dashboardData: boolean
}

/**
 * Dashboard error states for UI components
 */
export interface DashboardErrorState {
    statistics: string | null
    activityChart: string | null
    dashboardData: string | null
}

/**
 * Dashboard metric card configuration
 */
export interface DashboardMetricConfig {
    key: keyof DashboardStatistics
    title: string
    description: string
    icon: string
    color: string
    format?: (value: any) => string
}

/**
 * Dashboard chart configuration
 */
export interface DashboardChartConfig {
    title: string
    description: string
    xAxisLabel: string
    yAxisLabel: string
    colors: {
        auftraege: string
        anfragen: string
    }
    showLegend: boolean
    showGrid: boolean
}

/**
 * Dashboard refresh configuration
 */
export interface DashboardRefreshConfig {
    enabled: boolean
    intervalMs: number
    onError?: (error: Error) => void
    onSuccess?: () => void
}

/**
 * Complete dashboard state for hooks and components
 */
export interface DashboardState {
    statistics: DashboardStatistics | null
    activityChart: OrderActivityData[] | null
    loading: DashboardLoadingState
    error: DashboardErrorState
    lastUpdated: Date | null
    refreshConfig: DashboardRefreshConfig
}

/**
 * Dashboard hook return type
 */
export interface UseDashboardReturn {
    // Data
    statistics: DashboardStatistics | null
    activityChart: OrderActivityData[] | null

    // Loading states
    isLoadingStatistics: boolean
    isLoadingActivityChart: boolean
    isLoadingAny: boolean

    // Error states
    statisticsError: string | null
    activityChartError: string | null
    hasAnyError: boolean

    // Actions
    refreshStatistics: () => Promise<void>
    refreshActivityChart: (days?: number) => Promise<void>
    refreshAll: (days?: number) => Promise<void>
    clearErrors: () => void

    // Metadata
    lastUpdated: Date | null
    isStale: boolean
}

/**
 * Dashboard statistics hook return type
 */
export interface UseDashboardStatisticsReturn {
    statistics: DashboardStatistics | null
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
    lastUpdated: Date | null
    isStale: boolean
}

/**
 * Order activity chart hook return type
 */
export interface UseOrderActivityChartReturn {
    activityChart: OrderActivityData[] | null
    isLoading: boolean
    error: string | null
    refresh: (days?: number) => Promise<void>
    lastUpdated: Date | null
    isStale: boolean
    days: number
    setDays: (days: number) => void
}

/**
 * Dashboard metric display configuration
 */
export interface DashboardMetricDisplay {
    value: number | string
    label: string
    change?: number
    changeLabel?: string
    trend?: 'up' | 'down' | 'neutral'
    isLoading: boolean
    error?: string
}

/**
 * Dashboard chart data point for visualization
 */
export interface DashboardChartDataPoint {
    date: string
    dateDisplay: string
    auftraege: number
    anfragen: number
    total: number
}

/**
 * Dashboard summary statistics
 */
export interface DashboardSummary {
    totalOrders: number
    totalApplications: number
    totalActivity: number
    activeDays: number
    averageDaily: number
    period: number
    hasActivity: boolean
    hasResponseTimeData: boolean
}

// Type guards for runtime type checking

/**
 * Type guard to check if an object is a valid DashboardStatistics
 */
export function isDashboardStatistics(obj: any): obj is DashboardStatistics {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.activeOrders === 'number' &&
        typeof obj.openApplications === 'number' &&
        typeof obj.completedOrders === 'number' &&
        (obj.averageResponseTimeDays === null || typeof obj.averageResponseTimeDays === 'number') &&
        typeof obj.averageResponseTimeDisplay === 'string' &&
        Array.isArray(obj.companyRoles) &&
        typeof obj.roleContext === 'object' &&
        obj.roleContext !== null
    )
}

/**
 * Type guard to check if an object is a valid OrderActivityData
 */
export function isOrderActivityData(obj: any): obj is OrderActivityData {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.date === 'string' &&
        typeof obj.dateDisplay === 'string' &&
        typeof obj.auftraege === 'number' &&
        typeof obj.anfragen === 'number'
    )
}

/**
 * Type guard to check if an array contains valid OrderActivityData
 */
export function isOrderActivityDataArray(arr: any): arr is OrderActivityData[] {
    return Array.isArray(arr) && arr.every(isOrderActivityData)
}

// Constants for dashboard configuration

/**
 * Default dashboard configuration values
 */
export const DASHBOARD_DEFAULTS = {
    ACTIVITY_CHART_DAYS: 30,
    REFRESH_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    STALE_TIME_MS: 2 * 60 * 1000, // 2 minutes
    CACHE_TIME_MS: 10 * 60 * 1000, // 10 minutes
    MAX_ACTIVITY_DAYS: 365,
    MIN_ACTIVITY_DAYS: 1,
} as const

/**
 * Dashboard metric colors for UI theming
 */
export const DASHBOARD_COLORS = {
    ACTIVE_ORDERS: '#3b82f6', // blue-500
    OPEN_APPLICATIONS: '#f59e0b', // amber-500
    COMPLETED_ORDERS: '#10b981', // emerald-500
    RESPONSE_TIME: '#8b5cf6', // violet-500
    AUFTRAEGE: '#3b82f6', // blue-500
    ANFRAGEN: '#f59e0b', // amber-500
} as const

/**
 * Dashboard error messages
 */
export const DASHBOARD_ERROR_MESSAGES = {
    NETWORK_ERROR: 'Netzwerkfehler: Dashboard-Daten konnten nicht geladen werden.',
    TIMEOUT_ERROR: 'Zeitüberschreitung: Das Laden der Dashboard-Daten hat zu lange gedauert.',
    AUTH_ERROR: 'Authentifizierung erforderlich. Bitte melden Sie sich erneut an.',
    PERMISSION_ERROR: 'Keine Berechtigung für Dashboard-Statistiken.',
    SERVER_ERROR: 'Serverfehler beim Laden der Dashboard-Daten.',
    VALIDATION_ERROR: 'Ungültige Dashboard-Daten erhalten.',
    GENERIC_ERROR: 'Ein unbekannter Fehler ist aufgetreten.',
} as const

// =============================================================================
// DASHBOARD CONTENT SECTION TYPES (Task 1)
// =============================================================================

/**
 * Order status type for dashboard content (re-exported from API types)
 */
export type OrderStatus = ApiOrderStatus

/**
 * Dashboard project interface representing active orders
 */
export interface DashboardProject {
    id: string
    title: string
    description: string
    status: OrderStatus
    deadline?: Date
    clientCompany?: string
    providerCompany?: string
    roleContext: 'client' | 'provider'
}

/**
 * Dashboard deadline interface representing upcoming deadlines
 */
export interface DashboardDeadline {
    id: string
    orderId: string
    orderTitle: string
    deadlineDate: Date
    deadlineType: 'completion' | 'milestone' | 'application_response'
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
    actionRequired: string
    timeRemaining: string
}

/**
 * Status display mapping for dashboard projects
 */
export const STATUS_DISPLAY_MAP = {
    DRAFT: { label: 'Entwurf', color: 'gray', icon: 'FileText' },
    PUBLISHED: { label: 'Veröffentlicht', color: 'blue', icon: 'FileText' },
    MATCHED: { label: 'Zugeordnet', color: 'yellow', icon: 'Users' },
    ASSIGNED: { label: 'In Bearbeitung', color: 'green', icon: 'Play' },
    IN_PROGRESS: { label: 'In Bearbeitung', color: 'green', icon: 'Play' },
    COMPLETED: { label: 'Abgeschlossen', color: 'emerald', icon: 'CheckCircle' },
    CANCELLED: { label: 'Abgebrochen', color: 'red', icon: 'XCircle' },
} as const

/**
 * Urgency level color mapping for deadlines
 */
export const URGENCY_COLOR_MAP = {
    low: 'text-gray-600 bg-gray-100 border-gray-200',
    medium: 'text-blue-600 bg-blue-100 border-blue-200',
    high: 'text-orange-600 bg-orange-100 border-orange-200',
    critical: 'text-red-600 bg-red-100 border-red-200',
} as const

/**
 * Utility function to calculate urgency level based on time remaining
 */
export function calculateUrgencyLevel(deadlineDate: Date): DashboardDeadline['urgencyLevel'] {
    const now = new Date()
    const timeDiff = deadlineDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    if (daysRemaining <= 1) return 'critical'
    if (daysRemaining <= 3) return 'high'
    if (daysRemaining <= 7) return 'medium'
    return 'low'
}

/**
 * Utility function to format time remaining in human-readable format
 */
export function formatTimeRemaining(deadlineDate: Date): string {
    const now = new Date()
    const timeDiff = deadlineDate.getTime() - now.getTime()

    if (timeDiff <= 0) return 'Überfällig'

    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60))

    if (daysRemaining === 1) return 'Heute'
    if (daysRemaining === 2) return 'Morgen'
    if (daysRemaining <= 7) return `${daysRemaining} Tage`
    if (daysRemaining <= 30) return `${daysRemaining} Tage`

    const weeksRemaining = Math.ceil(daysRemaining / 7)
    return `${weeksRemaining} Wochen`
}

/**
 * Utility function to get status display information
 */
export function getStatusDisplay(status: OrderStatus) {
    return STATUS_DISPLAY_MAP[status] || STATUS_DISPLAY_MAP.DRAFT
}

/**
 * Utility function to get urgency color classes
 */
export function getUrgencyColorClasses(urgencyLevel: DashboardDeadline['urgencyLevel']): string {
    return URGENCY_COLOR_MAP[urgencyLevel] || URGENCY_COLOR_MAP.low
}

/**
 * Hook return types for dashboard content sections
 */
export interface UseDashboardProjectsReturn {
    projects: DashboardProject[]
    isLoading: boolean
    error?: string
    refresh: () => void
}

export interface UseDashboardDeadlinesReturn {
    deadlines: DashboardDeadline[]
    isLoading: boolean
    error?: string
    refresh: () => void
}