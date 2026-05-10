/**
 * Dashboard API Service Usage Examples
 * 
 * This file demonstrates how to use the dashboard API service
 * in various scenarios and provides integration examples.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { dashboardApi, dashboardQueryKeys, DashboardApiError } from './dashboard'
import type { DashboardStatistics, OrderActivityData } from './dashboard'

// =============================================================================
// BASIC USAGE EXAMPLES
// =============================================================================

/**
 * Example: Fetch dashboard statistics
 */
export async function fetchDashboardStatisticsExample(): Promise<void> {
    try {
        console.log('Fetching dashboard statistics...')

        const statistics = await dashboardApi.getDashboardStatistics()

        console.log('Dashboard Statistics:')
        console.log(`- Active Orders: ${statistics.activeOrders}`)
        console.log(`- Open Applications: ${statistics.openApplications}`)
        console.log(`- Completed Orders: ${statistics.completedOrders}`)
        console.log(`- Average Response Time: ${statistics.averageResponseTimeDisplay}`)

        // Check if company has any activity
        const hasActivity = statistics.activeOrders > 0 ||
            statistics.openApplications > 0 ||
            statistics.completedOrders > 0

        if (hasActivity) {
            console.log(' Company has active business')
        } else {
            console.log('ℹ No current business activity')
        }

    } catch (error) {
        if (error instanceof DashboardApiError) {
            console.error(`Dashboard API Error: ${error.message}`)
            if (error.statusCode) {
                console.error(`Status Code: ${error.statusCode}`)
            }
            if (error.errors && error.errors.length > 0) {
                console.error(`Details: ${error.errors.join(', ')}`)
            }
        } else {
            console.error('Unexpected error:', error)
        }
    }
}

/**
 * Example: Fetch order activity chart data
 */
export async function fetchActivityChartExample(): Promise<void> {
    try {
        console.log('Fetching order activity chart data...')

        // Fetch last 30 days of activity
        const activityData = await dashboardApi.getOrderActivityChart(30)

        console.log(`Activity Chart Data (${activityData.length} days):`)

        // Calculate totals
        let totalAuftraege = 0
        let totalAnfragen = 0
        let activeDays = 0

        activityData.forEach(day => {
            totalAuftraege += day.auftraege
            totalAnfragen += day.anfragen

            if (day.auftraege > 0 || day.anfragen > 0) {
                activeDays++
                console.log(`${day.dateDisplay}: ${day.auftraege} Aufträge, ${day.anfragen} Anfragen`)
            }
        })

        console.log('\nSummary:')
        console.log(`- Total Aufträge: ${totalAuftraege}`)
        console.log(`- Total Anfragen: ${totalAnfragen}`)
        console.log(`- Active Days: ${activeDays}/${activityData.length}`)
        console.log(`- Average Daily Activity: ${((totalAuftraege + totalAnfragen) / activityData.length).toFixed(1)}`)

    } catch (error) {
        if (error instanceof DashboardApiError) {
            console.error(`Activity Chart Error: ${error.message}`)
        } else {
            console.error('Unexpected error:', error)
        }
    }
}

/**
 * Example: Fetch complete dashboard data efficiently
 */
export async function fetchCompleteDashboardExample(): Promise<void> {
    try {
        console.log('Fetching complete dashboard data...')

        // Fetch both statistics and chart data in parallel
        const { statistics, activityChart } = await dashboardApi.getDashboardData(30)

        console.log('=== DASHBOARD OVERVIEW ===')
        console.log('\n Statistics:')
        console.log(`Active Orders: ${statistics.activeOrders}`)
        console.log(`Open Applications: ${statistics.openApplications}`)
        console.log(`Completed Orders: ${statistics.completedOrders}`)
        console.log(`Response Time: ${statistics.averageResponseTimeDisplay}`)

        console.log('\n Activity Summary:')
        const totalActivity = activityChart.reduce((sum, day) => sum + day.auftraege + day.anfragen, 0)
        const activeDays = activityChart.filter(day => day.auftraege > 0 || day.anfragen > 0).length

        console.log(`Total Activity: ${totalActivity}`)
        console.log(`Active Days: ${activeDays}/${activityChart.length}`)

        // Find most active day
        const mostActiveDay = activityChart.reduce((max, day) => {
            const dayTotal = day.auftraege + day.anfragen
            const maxTotal = max.auftraege + max.anfragen
            return dayTotal > maxTotal ? day : max
        }, activityChart[0])

        if (mostActiveDay && (mostActiveDay.auftraege > 0 || mostActiveDay.anfragen > 0)) {
            console.log(`Most Active Day: ${mostActiveDay.dateDisplay} (${mostActiveDay.auftraege + mostActiveDay.anfragen} activities)`)
        }

    } catch (error) {
        if (error instanceof DashboardApiError) {
            console.error(`Dashboard Data Error: ${error.message}`)
        } else {
            console.error('Unexpected error:', error)
        }
    }
}

// =============================================================================
// REACT QUERY INTEGRATION EXAMPLES
// =============================================================================

/**
 * Example: TanStack Query configuration for dashboard statistics
 */
export const dashboardStatisticsQueryConfig = {
    queryKey: dashboardQueryKeys.statistics(),
    queryFn: dashboardApi.getDashboardStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: Error) => {
        console.error('Dashboard statistics query failed:', error)
    }
}

/**
 * Example: TanStack Query configuration for activity chart
 */
export const createActivityChartQueryConfig = (days: number = 30) => ({
    queryKey: dashboardQueryKeys.activityChart(days),
    queryFn: () => dashboardApi.getOrderActivityChart(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    enabled: days >= 1 && days <= 365, // Only run query if days is valid
    onError: (error: Error) => {
        console.error(`Activity chart query failed for ${days} days:`, error)
    }
})

// =============================================================================
// ERROR HANDLING EXAMPLES
// =============================================================================

/**
 * Example: Comprehensive error handling
 */
export async function handleDashboardErrorsExample(): Promise<void> {
    try {
        const statistics = await dashboardApi.getDashboardStatistics()
        console.log('Statistics loaded successfully:', statistics)

    } catch (error) {
        if (error instanceof DashboardApiError) {
            // Handle specific dashboard API errors
            switch (error.statusCode) {
                case 401:
                    console.error('Authentication required - redirecting to login')
                    // Redirect to login page
                    break

                case 403:
                    console.error('Access denied - user lacks dashboard permissions')
                    // Show permission error message
                    break

                case 404:
                    console.error('Dashboard data not found - company may not exist')
                    // Show not found message
                    break

                case 500:
                    console.error('Server error - trying again later')
                    // Show retry option
                    break

                default:
                    console.error('Dashboard API error:', error.message)
                // Show generic error message
            }
        } else {
            // Handle unexpected errors
            console.error('Unexpected error loading dashboard:', error)
        }
    }
}

/**
 * Example: Retry logic with exponential backoff
 */
export async function retryDashboardRequestExample(): Promise<DashboardStatistics | null> {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
        try {
            return await dashboardApi.getDashboardStatistics()

        } catch (error) {
            retryCount++

            if (error instanceof DashboardApiError && error.statusCode === 500 && retryCount < maxRetries) {
                // Retry on server errors with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000)
                console.log(`Retry ${retryCount}/${maxRetries} after ${delay}ms...`)

                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }

            // Don't retry on client errors or after max retries
            console.error('Final error after retries:', error)
            throw error
        }
    }

    return null
}

// =============================================================================
// VALIDATION EXAMPLES
// =============================================================================

/**
 * Example: Validate API response data
 */
export function validateDashboardDataExample(data: any): boolean {
    try {
        // Validate statistics data
        if (data.statistics) {
            const { validateDashboardStatistics } = require('./dashboard')
            const { isValid, errors } = validateDashboardStatistics(data.statistics)

            if (!isValid) {
                console.error('Invalid statistics data:', errors)
                return false
            }
        }

        // Validate activity chart data
        if (data.activityChart) {
            const { validateOrderActivityData } = require('./dashboard')
            const { isValid, errors } = validateOrderActivityData(data.activityChart)

            if (!isValid) {
                console.error('Invalid activity chart data:', errors)
                return false
            }
        }

        console.log(' Dashboard data validation passed')
        return true

    } catch (error) {
        console.error('Validation error:', error)
        return false
    }
}

// =============================================================================
// UTILITY EXAMPLES
// =============================================================================

/**
 * Example: Format dashboard data for display
 */
export function formatDashboardDataExample(statistics: DashboardStatistics): void {
    const { formatDashboardStatistics } = require('./dashboard')
    const formatted = formatDashboardStatistics(statistics)

    console.log('=== FORMATTED DASHBOARD DATA ===')
    console.log(`Has Activity: ${formatted.hasActivity ? '✅' : '❌'}`)
    console.log(`Has Response Time Data: ${formatted.hasResponseTimeData ? '✅' : '❌'}`)
    console.log(`Total Orders: ${formatted.totalOrders}`)

    // Display activity status
    if (formatted.hasActivity) {
        console.log('\n Business Activity Detected:')
        if (formatted.activeOrders > 0) {
            console.log(`- ${formatted.activeOrders} active orders in progress`)
        }
        if (formatted.openApplications > 0) {
            console.log(`- ${formatted.openApplications} open applications to review`)
        }
        if (formatted.completedOrders > 0) {
            console.log(`- ${formatted.completedOrders} orders completed successfully`)
        }
    } else {
        console.log('\n💤 No current business activity')
    }

    // Display response time insights
    if (formatted.hasResponseTimeData && formatted.averageResponseTimeDays !== null) {
        const days = formatted.averageResponseTimeDays
        if (days <= 1) {
            console.log(' Excellent response time (≤ 1 day)')
        } else if (days <= 3) {
            console.log(' Good response time (≤ 3 days)')
        } else if (days <= 7) {
            console.log(' Moderate response time (≤ 7 days)')
        } else {
            console.log(' Slow response time (> 7 days)')
        }
    }
}

/**
 * Example: Calculate and display activity insights
 */
export function analyzeActivityDataExample(activityData: OrderActivityData[]): void {
    const { calculateActivitySummary } = require('./dashboard')
    const summary = calculateActivitySummary(activityData)

    console.log('=== ACTIVITY ANALYSIS ===')
    console.log(`Period: ${summary.period} days`)
    console.log(`Total Activity: ${summary.totalActivity}`)
    console.log(`- Aufträge: ${summary.totalAuftraege}`)
    console.log(`- Anfragen: ${summary.totalAnfragen}`)
    console.log(`Active Days: ${summary.activeDays}/${summary.period} (${((summary.activeDays / summary.period) * 100).toFixed(1)}%)`)
    console.log(`Average Daily: ${summary.averageDaily}`)

    // Activity insights
    const activityRate = summary.activeDays / summary.period
    if (activityRate >= 0.8) {
        console.log(' Very high activity - business is thriving!')
    } else if (activityRate >= 0.5) {
        console.log(' Good activity level - steady business flow')
    } else if (activityRate >= 0.2) {
        console.log(' Moderate activity - room for growth')
    } else {
        console.log(' Low activity - consider marketing efforts')
    }

    // Balance insights
    const auftraegeRatio = summary.totalAuftraege / (summary.totalAuftraege + summary.totalAnfragen)
    if (auftraegeRatio > 0.7) {
        console.log(' Order-heavy activity (creating more orders than receiving applications)')
    } else if (auftraegeRatio < 0.3) {
        console.log(' Application-heavy activity (receiving/sending more applications)')
    } else {
        console.log(' Balanced activity between orders and applications')
    }
}

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

export const dashboardApiExamples = {
    // Basic usage
    fetchStatistics: fetchDashboardStatisticsExample,
    fetchActivityChart: fetchActivityChartExample,
    fetchCompleteData: fetchCompleteDashboardExample,

    // Error handling
    handleErrors: handleDashboardErrorsExample,
    retryRequest: retryDashboardRequestExample,

    // Validation
    validateData: validateDashboardDataExample,

    // Utilities
    formatData: formatDashboardDataExample,
    analyzeActivity: analyzeActivityDataExample,

    // Query configurations
    statisticsQuery: dashboardStatisticsQueryConfig,
    createActivityQuery: createActivityChartQueryConfig,
}