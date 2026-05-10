/**
 * Hooks Index
 * 
 * Central export point for all custom React hooks
 * 
 * @author IndusSync Frontend Team
 */

// Dashboard hooks
export { default as useDashboardStatistics, useSimpleDashboardStatistics, useDashboardStatisticsWithInterval, useManualDashboardStatistics } from './useDashboardStatistics'
export { default as useOrderActivityChart } from './useOrderActivityChart'
export { default as useDashboardProjects, useSimpleDashboardProjects } from './useDashboardProjects'
export { default as useDashboardDeadlines, useSimpleDashboardDeadlines, useDashboardDeadlinesWithRange } from './useDashboardDeadlines'

// Order hooks
export * from './useOrders'
export { default as useOrderBoard } from './useOrderBoard'
export { default as useOrderMatches } from './useOrderMatches'
export { default as useCalendarOrders } from './useCalendarOrders'

// Company hooks
export { default as useCompany } from './useCompany'
export { default as useCompanyProfile } from './useCompanyProfile'

// Auth hooks
export { default as useAuth } from './useAuth'

// Other hooks
export { default as useDocuments } from './useDocuments'
export { default as useMatchingPreview } from './useMatchingPreview'
export { default as usePermissions } from './usePermissions'
export { default as useReviews } from './useReviews'