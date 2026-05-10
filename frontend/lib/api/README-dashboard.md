# Dashboard API Service

This module provides a comprehensive API service for fetching dashboard statistics and order activity chart data from the IndusSync backend.

## Features

- **Real-time Statistics**: Fetch active orders, open applications, completed orders, and average response time
- **Activity Charts**: Get daily order activity data for visualization
- **Role-aware Data**: Automatically handles client, provider, and dual-role company contexts
- **Error Handling**: Comprehensive error handling with German error messages
- **Retry Logic**: Built-in timeout and retry mechanisms through the base API client
- **Type Safety**: Full TypeScript support with detailed interfaces
- **Validation**: Runtime validation for API responses
- **Caching Support**: Query key factories for TanStack Query integration

## Usage

### Basic Usage

```typescript
import { dashboardApi } from "@/lib/api/dashboard";

// Fetch dashboard statistics
const statistics = await dashboardApi.getDashboardStatistics();
console.log(`Active orders: ${statistics.activeOrders}`);

// Fetch activity chart data (last 30 days)
const activityData = await dashboardApi.getOrderActivityChart();

// Fetch activity chart data for custom period
const weeklyData = await dashboardApi.getOrderActivityChart(7);

// Fetch both statistics and chart data together
const { statistics, activityChart } = await dashboardApi.getDashboardData(30);
```

### With TanStack Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, dashboardQueryKeys } from "@/lib/api/dashboard";

// Fetch dashboard statistics with caching
const {
  data: statistics,
  isLoading,
  error,
} = useQuery({
  queryKey: dashboardQueryKeys.statistics(),
  queryFn: dashboardApi.getDashboardStatistics,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Fetch activity chart data
const { data: activityChart } = useQuery({
  queryKey: dashboardQueryKeys.activityChart(30),
  queryFn: () => dashboardApi.getOrderActivityChart(30),
  staleTime: 5 * 60 * 1000,
});
```

## API Endpoints

### GET /api/dashboard/statistics

Retrieves comprehensive dashboard statistics for the authenticated company.

**Response:**

```typescript
interface DashboardStatistics {
  activeOrders: number;
  openApplications: number;
  completedOrders: number;
  averageResponseTimeDays: number | null;
  averageResponseTimeDisplay: string;
}
```

### GET /api/dashboard/activity-chart

Retrieves daily order activity data for dashboard charts.

**Parameters:**

- `days` (optional): Number of days to include (1-365, default: 30)

**Response:**

```typescript
interface OrderActivityData {
  date: string; // ISO date string
  dateDisplay: string; // "dd.MM" format
  auftraege: number; // Orders count
  anfragen: number; // Applications count
}
```

## Error Handling

The service provides comprehensive error handling with German error messages:

```typescript
import { DashboardApiError } from "@/lib/api/dashboard";

try {
  const statistics = await dashboardApi.getDashboardStatistics();
} catch (error) {
  if (error instanceof DashboardApiError) {
    console.error(`Dashboard error: ${error.message}`);
    console.error(`Status code: ${error.statusCode}`);
    console.error(`Details: ${error.errors}`);
  }
}
```

### Error Types

- **400 Bad Request**: Invalid parameters (e.g., days out of range)
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: No permission for dashboard statistics
- **404 Not Found**: Dashboard data not found
- **500 Internal Server Error**: Server error
- **Network Error**: Connection issues
- **Timeout Error**: Request timeout

## Validation

The service includes runtime validation for API responses:

```typescript
import {
  validateDashboardStatistics,
  validateOrderActivityData,
} from "@/lib/api/dashboard";

// Validate statistics data
const { isValid, errors } = validateDashboardStatistics(data);
if (!isValid) {
  console.error("Invalid statistics data:", errors);
}

// Validate activity chart data
const { isValid, errors } = validateOrderActivityData(chartData);
if (!isValid) {
  console.error("Invalid activity data:", errors);
}
```

## Utility Functions

### Format Dashboard Statistics

```typescript
import { formatDashboardStatistics } from "@/lib/api/dashboard";

const formatted = formatDashboardStatistics(statistics);
console.log(`Has activity: ${formatted.hasActivity}`);
console.log(`Total orders: ${formatted.totalOrders}`);
```

### Calculate Activity Summary

```typescript
import { calculateActivitySummary } from "@/lib/api/dashboard";

const summary = calculateActivitySummary(activityData);
console.log(`Total activity: ${summary.totalActivity}`);
console.log(`Active days: ${summary.activeDays}`);
console.log(`Average daily: ${summary.averageDaily}`);
```

## Query Keys

For consistent caching with TanStack Query:

```typescript
import { dashboardQueryKeys } from "@/lib/api/dashboard";

// Available query keys
dashboardQueryKeys.all; // ['dashboard']
dashboardQueryKeys.statistics(); // ['dashboard', 'statistics']
dashboardQueryKeys.activityChart(30); // ['dashboard', 'activity-chart', 30]
dashboardQueryKeys.dashboardData(7); // ['dashboard', 'dashboard-data', 7]
```

## Role-based Data

The API automatically handles different company roles:

### Client Role

- **Active Orders**: Orders with status PUBLISHED, MATCHED, or ASSIGNED
- **Open Applications**: Applications received on published orders
- **Completed Orders**: Orders created by the company with status COMPLETED
- **Response Time**: Average time from order publication to first application received

### Provider Role

- **Active Orders**: Orders assigned to the company with status ASSIGNED
- **Open Applications**: Applications sent to other companies
- **Completed Orders**: Orders completed by the company as provider
- **Response Time**: Average time from order publication to application submission

### Dual Role Companies

- All metrics are aggregated from both client and provider activities
- Chart data distinguishes between order types appropriately

## Testing

The service includes comprehensive unit tests covering:

- Successful API calls
- Error handling scenarios
- Parameter validation
- Utility functions
- Query key generation

Run tests with:

```bash
npm test -- lib/api/__tests__/dashboard.test.ts
```

## Dependencies

- `axios`: HTTP client for API requests
- `@/lib/api/client`: Base API client with authentication and error handling
- `@/lib/types/dashboard`: TypeScript type definitions

## Related Files

- `@/lib/types/dashboard.ts`: TypeScript type definitions
- `@/lib/api/client.ts`: Base API client configuration
- `@/lib/hooks/useDashboardStatistics.ts`: React hook for statistics (to be implemented)
- `@/lib/hooks/useOrderActivityChart.ts`: React hook for chart data (to be implemented)