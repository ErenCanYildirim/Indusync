# Company Profile API Service

This document describes the `CompanyApiService` class that handles fetching public company information for the company profile viewing feature.

## Overview

The `CompanyApiService` provides a robust, cached API service for fetching company profile data. It includes:

- **Proper error handling** for network failures and API errors
- **Request caching** to improve performance and reduce API calls
- **TypeScript types** for API responses and error states
- **Batch operations** for fetching multiple company profiles
- **Prefetching capabilities** for performance optimization

## Basic Usage

```typescript
import { companyApiService } from "@/lib/api/company-profile";

// Fetch a single company profile
try {
  const profile = await companyApiService.getPublicCompanyInfo("company-id");
  console.log("Company:", profile.name);
} catch (error) {
  console.error("Failed to fetch company profile:", error.message);
}
```

## Error Handling

The service provides detailed error information through the `CompanyProfileApiError` interface:

```typescript
import { CompanyProfileErrorCodes } from "@/lib/types/company-profile";
import type { CompanyProfileApiError } from "@/lib/types/company-profile";

try {
  const profile = await companyApiService.getPublicCompanyInfo("company-id");
} catch (error) {
  const apiError = error as CompanyProfileApiError;

  switch (apiError.code) {
    case CompanyProfileErrorCodes.COMPANY_NOT_FOUND:
      // Handle company not found
      break;
    case CompanyProfileErrorCodes.ACCESS_DENIED:
      // Handle access denied
      break;
    case CompanyProfileErrorCodes.NETWORK_ERROR:
      // Handle network issues
      break;
    // ... other error codes
  }
}
```

## Available Error Codes

- `INVALID_COMPANY_ID` - Invalid or empty company ID provided
- `COMPANY_NOT_FOUND` - Company with the given ID doesn't exist
- `ACCESS_DENIED` - User doesn't have permission to view the company
- `AUTHENTICATION_REQUIRED` - User needs to be authenticated
- `RATE_LIMIT_EXCEEDED` - Too many requests, need to wait
- `SERVER_ERROR` - Internal server error
- `NETWORK_ERROR` - Network connectivity issues
- `REQUEST_TIMEOUT` - Request took too long to complete
- `NO_DATA_RECEIVED` - Server returned empty response
- `INVALID_PROFILE_DATA` - Server returned malformed data
- `UNKNOWN_ERROR` - Unexpected error occurred

## Caching

The service automatically caches successful responses for 5 minutes to improve performance:

```typescript
// Clear all cached data
companyApiService.clearCache();

// Clear cache for specific company
companyApiService.clearCache("company-id");

// Get cache statistics
const stats = companyApiService.getCacheStats();
console.log(`Cache contains ${stats.size} entries`);
```

## Batch Operations

Fetch multiple company profiles efficiently:

```typescript
const companyIds = ["company-1", "company-2", "company-3"];
const profiles = await companyApiService.getMultipleCompanyProfiles(companyIds);

// Note: This method returns only successful results
// Failed requests are logged but don't throw errors
console.log(`Fetched ${profiles.length} out of ${companyIds.length} profiles`);
```

## Prefetching

Improve performance by prefetching company data:

```typescript
// Prefetch company profile (doesn't throw on errors)
await companyApiService.prefetchCompanyProfile("company-id");

// The data will be cached and available for immediate use
const profile = await companyApiService.getPublicCompanyInfo("company-id"); // Fast!
```

## Custom Service Instance

Create a custom service instance if needed:

```typescript
import { CompanyApiService } from "@/lib/api/company-profile";

const customService = new CompanyApiService();
// Use customService instead of the default instance
```

## Integration with React Hooks

The service is designed to work well with React hooks and state management:

```typescript
// Example React hook usage
const [profile, setProfile] = useState<CompanyProfile | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchProfile = async (companyId: string) => {
  setLoading(true);
  setError(null);

  try {
    const result = await companyApiService.getPublicCompanyInfo(companyId);
    setProfile(result);
  } catch (err) {
    const apiError = err as CompanyProfileApiError;
    setError(apiError.message);
  } finally {
    setLoading(false);
  }
};
```

## Performance Considerations

1. **Caching**: Responses are cached for 5 minutes by default
2. **Batch Operations**: Use `getMultipleCompanyProfiles` for multiple companies
3. **Prefetching**: Use `prefetchCompanyProfile` for anticipated data needs
4. **Cache Management**: Monitor cache size and clear when appropriate

## Type Safety

The service provides full TypeScript support:

```typescript
import type {
  CompanyProfile,
  CompanyProfileApiError,
  CompanyProfileCacheStats,
} from "@/lib/types/company-profile";

// All methods return properly typed data
const profile: CompanyProfile = await companyApiService.getPublicCompanyInfo(
  "id"
);
const stats: CompanyProfileCacheStats = companyApiService.getCacheStats();
```

## API Endpoint

The service calls the following backend endpoint:

- `GET /api/v1/companies/{id}/public` - Get public company information

This endpoint should return a `CompanyProfile` object with all the required fields as defined in the TypeScript interface.

## Testing

The service includes comprehensive test coverage. See `__tests__/company-profile.test.ts` for examples of:

- Successful API calls
- Error handling scenarios
- Caching behavior
- Batch operations
- Input validation

## Requirements Fulfilled

This implementation fulfills the following task requirements:

 **Implement CompanyApiService class with getPublicCompanyInfo method**

- Complete `CompanyApiService` class with comprehensive API functionality

 **Add proper error handling for network failures and API errors**

- Detailed error handling with specific error codes and messages
- Network error detection and handling
- Timeout handling
- HTTP status code specific error handling

 **Implement request caching to improve performance**

- 5-minute TTL cache with LRU eviction
- Cache statistics and management methods
- Configurable cache size (100 entries by default)

 **Add TypeScript types for API responses and error states**

- Complete TypeScript interfaces for all data structures
- Proper error typing with `CompanyProfileApiError`
- Type-safe error codes with `CompanyProfileErrorCodes`
- Full type coverage for all methods and return values