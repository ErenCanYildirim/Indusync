# Company Ratings API Service

This document describes the `CompanyRatingsApiService` which provides methods to fetch company ratings, reviews, and detailed review information from the backend API.

## Overview

The `CompanyRatingsApiService` is a TypeScript class that handles all API operations related to company ratings and reviews. It includes:

- **Proper error handling** for network failures and API errors
- **Request caching** to improve performance for frequently accessed ratings
- **TypeScript types** for all API responses and error states
- **Input validation** and sanitization
- **Comprehensive error codes** for different failure scenarios

## Installation & Usage

```typescript
import { companyRatingsApiService } from "@/lib/api/company-ratings";
// or
import { CompanyRatingsApiService } from "@/lib/api/company-ratings";

// Use the default instance
const summary = await companyRatingsApiService.getCompanyRatingsSummary(
  "company-id"
);

// Or create your own instance
const service = new CompanyRatingsApiService();
```

## API Methods

### 1. getCompanyRatingsSummary(companyId: string)

Fetches comprehensive company ratings summary including overall rating and category breakdowns.

```typescript
const summary = await companyRatingsApiService.getCompanyRatingsSummary(
  "company-123"
);

console.log(summary.overallRating); // 85.5
console.log(summary.totalReviews); // 25
console.log(summary.categoryRatings.COMMUNICATION.averageScore); // 90
```

**Returns:** `Promise<CompanyRatingsSummary>`

**Throws:** `RatingsApiError` with specific error codes

### 2. getCompanyProjectReviews(companyId: string, page?: number, size?: number)

Fetches paginated list of completed projects with their ratings for a company.

```typescript
const projects = await companyRatingsApiService.getCompanyProjectReviews(
  "company-123",
  0,
  10
);

console.log(projects.content.length); // Number of projects on this page
console.log(projects.totalElements); // Total number of projects
console.log(projects.totalPages); // Total number of pages
```

**Parameters:**

- `companyId`: Company identifier (required)
- `page`: Page number, 0-based (default: 0)
- `size`: Items per page, 1-100 (default: 10)

**Returns:** `Promise<PaginatedProjectReviews>`

### 3. getOrderReviewDetails(orderId: string)

Fetches detailed review information for a specific order, including all bidirectional reviews.

```typescript
const details = await companyRatingsApiService.getOrderReviewDetails(
  "order-456"
);

console.log(details.projectName); // "Website Development"
console.log(details.reviews.length); // Number of reviews for this order
console.log(details.reviews[0].ratings.QUALITY.score); // 92
```

**Returns:** `Promise<OrderReviewDetails>`

## Error Handling

The service provides comprehensive error handling with specific error codes:

```typescript
import { CompanyRatingsErrorCodes } from "@/lib/api/company-ratings";

try {
  const summary = await companyRatingsApiService.getCompanyRatingsSummary(
    "invalid-id"
  );
} catch (error) {
  const ratingsError = error as RatingsApiError;

  switch (ratingsError.code) {
    case CompanyRatingsErrorCodes.COMPANY_NOT_FOUND:
      console.log("Company does not exist");
      break;
    case CompanyRatingsErrorCodes.ACCESS_DENIED:
      console.log("No permission to view ratings");
      break;
    case CompanyRatingsErrorCodes.NETWORK_ERROR:
      console.log("Connection failed");
      break;
    default:
      console.log("Unknown error:", ratingsError.message);
  }
}
```

### Available Error Codes

- `INVALID_COMPANY_ID` - Company ID is missing or invalid
- `COMPANY_NOT_FOUND` - Company does not exist (404)
- `INVALID_ORDER_ID` - Order ID is missing or invalid
- `ORDER_NOT_FOUND` - Order does not exist (404)
- `ACCESS_DENIED` - No permission to view data (403)
- `AUTHENTICATION_REQUIRED` - User not authenticated (401)
- `NO_DATA_RECEIVED` - Empty response from server
- `INVALID_RESPONSE_DATA` - Malformed response data
- `NETWORK_ERROR` - Connection or network failure
- `REQUEST_TIMEOUT` - Request took too long
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `SERVER_ERROR` - Internal server error (500)
- `UNKNOWN_ERROR` - Unexpected error

## Caching

The service includes intelligent caching to improve performance:

```typescript
// Cache is automatically used for repeated requests
const summary1 = await companyRatingsApiService.getCompanyRatingsSummary(
  "company-123"
); // API call
const summary2 = await companyRatingsApiService.getCompanyRatingsSummary(
  "company-123"
); // From cache

// Clear cache when needed
companyRatingsApiService.clearCache(); // Clear all caches
companyRatingsApiService.clearCache("summary"); // Clear only summary cache
companyRatingsApiService.clearCache("summary", "company-123"); // Clear specific entry

// Get cache statistics
const stats = companyRatingsApiService.getCacheStats();
console.log(stats.summary.size); // Number of cached summaries
```

### Cache Configuration

- **TTL (Time To Live):** 5 minutes
- **Max Size:** 100 entries per cache type
- **LRU Eviction:** Oldest entries removed when cache is full
- **Separate Caches:** Summary, projects, and details have independent caches

## Performance Features

### Prefetching

Prefetch data for better user experience:

```typescript
// Prefetch ratings data before user navigates to profile
await companyRatingsApiService.prefetchCompanyRatings("company-123");
```

### Cache Statistics

Monitor cache performance:

```typescript
const stats = companyRatingsApiService.getCacheStats();
console.log("Cache Statistics:", {
  summary: stats.summary.size,
  projects: stats.projects.size,
  details: stats.details.size,
});
```

## TypeScript Types

All API responses and errors are fully typed:

```typescript
import type {
  CompanyRatingsSummary,
  PaginatedProjectReviews,
  OrderReviewDetails,
  RatingsApiError,
  ReviewCategory,
  CompanyRole,
  QualityLevel,
} from "@/lib/types/company-ratings";
```

### Key Types

- `CompanyRatingsSummary` - Complete company ratings overview
- `CategoryRating` - Individual category rating information
- `ProjectReviewSummary` - Project summary for list display
- `DetailedReview` - Comprehensive review with all ratings
- `RatingsApiError` - Error response with code and details

## Backend API Endpoints

The service calls these backend endpoints:

- `GET /api/companies/{id}/ratings` - Company ratings summary
- `GET /api/companies/{id}/project-reviews` - Paginated project reviews
- `GET /api/orders/{id}/reviews` - Detailed order reviews

## Example Usage

See `company-ratings-example.ts` for comprehensive usage examples including:

- Basic API calls
- Error handling patterns
- Caching demonstrations
- Performance optimization techniques

## Testing

The service includes comprehensive unit tests in `__tests__/company-ratings.test.ts` covering:

- Successful API responses
- Error scenarios
- Input validation
- Caching behavior
- Edge cases

## Requirements Fulfilled

This implementation fulfills the following requirements from the specification:

- **Requirement 3.1:** TypeScript interfaces for all API responses
- **Requirement 5.4:** Proper error handling and network failure management
- **Performance:** Request caching for frequently accessed ratings
- **Type Safety:** Complete TypeScript type coverage
- **Error Handling:** Comprehensive error codes and messages
- **Validation:** Input validation and sanitization
- **Caching:** Intelligent caching with TTL and LRU eviction