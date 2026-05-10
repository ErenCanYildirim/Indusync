/**
 * Central export file for all TypeScript types
 */

// Company profile types
export * from './company-profile';

// Company ratings and reviews types - explicit exports to avoid CompanyRole conflict
export type {
    ReviewCategory,
    QualityLevel,
    CategoryRating,
    ProjectReviewSummary,
    RatingDetail,
    DetailedReview,
    OrderReviewDetails,
    CompanyRatingsSummary,
    PaginatedProjectReviews,
    RatingsApiError,
    RatingsLoadingState,
    RatingsErrorState
} from './company-ratings';
export type { CompanyRole as RatingsCompanyRole } from './company-ratings';

// Company ratings API service
export { companyRatingsApiService, CompanyRatingsApiService, CompanyRatingsErrorCodes } from '../api/company-ratings';

// Dashboard types - explicit exports to avoid CompanyRole conflict
export type {
    DashboardStatistics,
    OrderActivityData,
    DashboardRoleContext,
    DashboardLoadingState,
    DashboardErrorState,
    DashboardProject,
    DashboardDeadline,
    OrderStatus,
    UseDashboardProjectsReturn,
    UseDashboardDeadlinesReturn
} from './dashboard';
export type { CompanyRole as DashboardCompanyRole } from './dashboard';

// Dashboard utility functions
export {
    STATUS_DISPLAY_MAP,
    URGENCY_COLOR_MAP,
    calculateUrgencyLevel,
    formatTimeRemaining,
    getStatusDisplay,
    getUrgencyColorClasses
} from './dashboard';

// Company registration and management types  
export * from './company';
export * from './company-role-management';
// export * from './company-registration';

// Terms & Conditions types
export * from './terms-conditions';

// Terms & Conditions utilities
export * from '../utils/terms-conditions';
export * from '../api/terms-conditions-error-handler';

// Other types
export * from './matching';
export * from './profile';

// Re-export commonly used types from API types
export type {
    AuthResponse,
    ApiError,
    PaginatedResponse,
    UserProfile,
    CompanyMembership,
    AddressDto
} from '../api/types';