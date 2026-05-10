/**
 * TypeScript interfaces for company ratings and reviews display
 * Matches backend DTO structure for consistent data handling
 * 
 * @author IndusSync Frontend Team
 * @since 1.0.0
 */

/**
 * Union type for the 8 rating categories used in reviews
 * Matches ReviewRating.Category enum from backend
 */
export type ReviewCategory =
    | "COMMUNICATION"
    | "RESPONSE_TIME"
    | "PUNCTUALITY"
    | "QUALITY"
    | "BUDGET"
    | "FLEXIBILITY"
    | "DOCUMENTATION"
    | "OVERALL_SATISFACTION";

/**
 * Company role in order context
 * Matches CompanyRole enum from backend
 */
export type CompanyRole = "CLIENT" | "PROVIDER";

/**
 * Quality level descriptions for ratings
 * Based on score ranges used in backend
 */
export type QualityLevel =
    | "Nicht bewertet"
    | "Ungenügend"
    | "Mangelhaft"
    | "Ausreichend"
    | "Befriedigend"
    | "Gut"
    | "Sehr gut"
    | "Exzellent";

/**
 * Individual category rating information
 * Matches CategoryRating DTO from backend
 */
export interface CategoryRating {
    /** The rating category */
    category: ReviewCategory;
    /** Average score for this category (0.0 to 100.0) */
    averageScore: number | null;
    /** Number of reviews for this category */
    reviewCount: number;
    /** Quality level description based on average score */
    qualityLevel: QualityLevel;
}

/**
 * Project review summary for display in company profile
 * Matches ProjectReviewSummary DTO from backend
 */
export interface ProjectReviewSummary {
    /** Unique identifier of the order/project */
    orderId: string;
    /** Name/title of the project */
    projectName: string;
    /** Date when the project was completed */
    completionDate: string;
    /** Overall rating for this project (0.0 to 100.0) */
    overallRating: number | null;
    /** Role of the company in this project */
    companyRole: CompanyRole;
    /** Current status of the project */
    status: string;
    /** ID of the company that provided the review */
    reviewerCompanyId: string;
    /** Name of the company that provided the review */
    reviewerCompanyName: string;
}

/**
 * Detailed rating information for a specific category within a review
 * Matches RatingDetail DTO from backend
 */
export interface RatingDetail {
    /** The rating category */
    category: ReviewCategory;
    /** The numerical score for this category (0 to 100) */
    score: number | null;
    /** Optional comment explaining the rating */
    comment: string | null;
    /** Quality level description based on the score */
    qualityLevel: QualityLevel;
}

/**
 * Comprehensive review information for detailed review display
 * Matches DetailedReview DTO from backend
 */
export interface DetailedReview {
    /** Unique identifier of the review */
    reviewId: string;
    /** ID of the company that submitted the review */
    reviewerCompanyId: string;
    /** Name of the company that submitted the review */
    reviewerCompanyName: string;
    /** ID of the company being reviewed */
    revieweeCompanyId: string;
    /** Name of the company being reviewed */
    revieweeCompanyName: string;
    /** Role of the reviewee company in the order context */
    revieweeRole: CompanyRole;
    /** Date and time when the review was submitted */
    reviewDate: string;
    /** Map of detailed ratings for each category */
    ratings: Record<ReviewCategory, RatingDetail>;
}

/**
 * Comprehensive review details for a specific order
 * Matches OrderReviewDetails DTO from backend
 */
export interface OrderReviewDetails {
    /** Unique identifier of the order */
    orderId: string;
    /** Name/title of the project/order */
    projectName: string;
    /** Date when the project was completed */
    completionDate: string;
    /** List of all reviews for this order */
    reviews: DetailedReview[];
}

/**
 * Comprehensive company ratings summary for display on company profile
 * Matches CompanyRatingsSummary DTO from backend
 */
export interface CompanyRatingsSummary {
    /** Unique identifier of the company being rated */
    companyId: string;
    /** Overall average rating across all categories and reviews (0.0 to 100.0) */
    overallRating: number | null;
    /** Total number of reviews received by this company */
    totalReviews: number;
    /** Total number of completed orders where this company participated */
    completedOrders: number;
    /** Map of category ratings showing performance in each area */
    categoryRatings: Record<ReviewCategory, CategoryRating>;
    /** List of recent completed projects with their ratings */
    recentProjects: ProjectReviewSummary[];
}

/**
 * Paginated response for project reviews
 * Used for pagination in project reviews list
 */
export interface PaginatedProjectReviews {
    /** List of project review summaries */
    content: ProjectReviewSummary[];
    /** Current page number (0-based) */
    page: number;
    /** Number of items per page */
    size: number;
    /** Total number of elements */
    totalElements: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether this is the first page */
    first: boolean;
    /** Whether this is the last page */
    last: boolean;
}

/**
 * API error response for ratings-related requests
 */
export interface RatingsApiError {
    /** Error message */
    message: string;
    /** HTTP status code */
    status: number;
    /** Error code for specific error types */
    code?: string;
    /** Additional error details */
    details?: Record<string, any>;
}

/**
 * Loading states for ratings components
 */
export interface RatingsLoadingState {
    /** Whether ratings summary is loading */
    summary: boolean;
    /** Whether project reviews are loading */
    projects: boolean;
    /** Whether detailed reviews are loading */
    details: boolean;
}

/**
 * Error states for ratings components
 */
export interface RatingsErrorState {
    /** Error for ratings summary */
    summary: RatingsApiError | null;
    /** Error for project reviews */
    projects: RatingsApiError | null;
    /** Error for detailed reviews */
    details: RatingsApiError | null;
}