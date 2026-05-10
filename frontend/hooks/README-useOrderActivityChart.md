# useOrderActivityChart Hook

A comprehensive React hook for fetching and managing order activity chart data with configurable days parameter, loading states, error handling, retry mechanisms, and caching.

## Features

- **Real API Integration**: Fetches data from the dashboard statistics API
- **Configurable Days Parameter**: Support for 1-365 days with validation
- **Loading States**: Comprehensive loading states with skeleton UI support
- **Error Handling**: User-friendly error messages with retry mechanisms
- **Automatic Refresh**: Configurable auto-refresh intervals
- **Caching**: Efficient caching with TanStack Query integration
- **Data Transformation**: Automatic transformation for chart component compatibility
- **TypeScript Support**: Full TypeScript support with comprehensive types
- **Multiple Variants**: Several hook variants for different use cases

## Basic Usage

```typescript
import { useOrderActivityChart } from "@/hooks/use-order-activity-chart";

function MyDashboardChart() {
  const { activityChart, isLoading, error, refresh, days, setDays } =
    useOrderActivityChart();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!activityChart) return <div>No data</div>;

  return (
    <div>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
        <option value={7}>7 Days</option>
        <option value={30}>30 Days</option>
        <option value={90}>90 Days</option>
      </select>

      {/* Your chart component */}
      <MyChart data={activityChart} />

      <button onClick={() => refresh()}>Refresh</button>
    </div>
  );
}
```

## Hook Variants

### 1. `useOrderActivityChart` (Main Hook)

The main hook with full configuration options.

```typescript
const {
  activityChart,
  isLoading,
  error,
  refresh,
  lastUpdated,
  isStale,
  days,
  setDays,
} = useOrderActivityChart({
  initialDays: 30,
  enableAutoRefresh: true,
  refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
  showErrorToasts: true,
  onError: (error) => console.error(error),
  onSuccess: (data) => console.log("Data loaded:", data.length),
});
```

### 2. `useSimpleOrderActivityChart`

Simplified interface for basic usage.

```typescript
const { activityChart, isLoading, error, refresh, hasData, hasError } =
  useSimpleOrderActivityChart(30); // 30 days
```

### 3. `useOrderActivityChartWithSkeleton`

Enhanced with skeleton UI support.

```typescript
const {
  activityChart,
  showSkeleton,
  showRefreshIndicator,
  isEmpty,
  hasPartialData,
  ...rest
} = useOrderActivityChartWithSkeleton(30);

if (showSkeleton) return <ChartSkeleton />;
if (isEmpty) return <EmptyState />;
```

### 4. `useManualOrderActivityChart`

Manual refresh control without auto-refresh.

```typescript
const { activityChart, isLoading, error, refresh } =
  useManualOrderActivityChart(7);

// Refresh manually
const handleRefresh = () => refresh();
```

### 5. `useOrderActivityChartWithInterval`

Custom refresh interval.

```typescript
const result = useOrderActivityChartWithInterval(
  30, // days
  2 * 60 * 1000 // refresh every 2 minutes
);
```

## Configuration Options

| Option              | Type       | Default     | Description                                       |
| ------------------- | ---------- | ----------- | ------------------------------------------------- |
| `initialDays`       | `number`   | `30`        | Initial number of days for chart data             |
| `enableAutoRefresh` | `boolean`  | `true`      | Enable automatic data refresh                     |
| `refreshIntervalMs` | `number`   | `300000`    | Refresh interval in milliseconds (5 min)          |
| `staleTimeMs`       | `number`   | `120000`    | Time after which data is considered stale (2 min) |
| `cacheTimeMs`       | `number`   | `600000`    | Time to keep data in cache (10 min)               |
| `showErrorToasts`   | `boolean`  | `true`      | Show toast notifications for errors               |
| `showSuccessToasts` | `boolean`  | `false`     | Show toast notifications for success              |
| `onError`           | `function` | `undefined` | Custom error handler                              |
| `onSuccess`         | `function` | `undefined` | Custom success handler                            |
| `enabled`           | `boolean`  | `true`      | Enable the query                                  |
| `enableRetry`       | `boolean`  | `true`      | Enable retry mechanisms                           |
| `maxRetries`        | `number`   | `3`         | Maximum number of retry attempts                  |

## Return Values

| Property        | Type                          | Description                              |
| --------------- | ----------------------------- | ---------------------------------------- |
| `activityChart` | `OrderActivityData[] \| null` | Chart data transformed for compatibility |
| `isLoading`     | `boolean`                     | Loading state indicator                  |
| `error`         | `string \| null`              | Error message if any error occurred      |
| `refresh`       | `function`                    | Manual refresh function                  |
| `lastUpdated`   | `Date \| null`                | Last updated timestamp                   |
| `isStale`       | `boolean`                     | Whether the data is considered stale     |
| `days`          | `number`                      | Current days parameter value             |
| `setDays`       | `function`                    | Function to update days parameter        |

## Data Structure

The hook returns `OrderActivityData[]` with the following structure:

```typescript
interface OrderActivityData {
  date: string; // ISO date string (e.g., "2024-01-01")
  dateDisplay: string; // Display format (e.g., "01.01")
  auftraege: number; // Number of orders
  anfragen: number; // Number of applications
  name: string; // Added for chart compatibility (same as dateDisplay)
}
```

## Error Handling

The hook provides comprehensive error handling:

- **Authentication Errors (401)**: "Authentifizierung erforderlich"
- **Permission Errors (403)**: "Keine Berechtigung für Dashboard-Statistiken"
- **Validation Errors (400)**: "Ungültige Parameter für Aktivitätsdiagramm"
- **Server Errors (500)**: "Serverfehler beim Laden der Dashboard-Daten"
- **Network Errors**: "Netzwerkfehler: Dashboard-Daten konnten nicht geladen werden"
- **Timeout Errors**: "Zeitüberschreitung: Das Laden der Dashboard-Daten hat zu lange gedauert"

## Caching Strategy

The hook uses TanStack Query for efficient caching:

- **Query Key**: `['dashboard', 'activity-chart', days]`
- **Stale Time**: 2 minutes (configurable)
- **Cache Time**: 10 minutes (configurable)
- **Background Refetch**: On window focus and reconnect
- **Automatic Invalidation**: When days parameter changes

## Integration with Existing Components

### With DashboardChart Component

```typescript
import { useOrderActivityChart } from "@/hooks/use-order-activity-chart";
import { DashboardChart } from "@/components/dashboard-chart";

function EnhancedDashboardChart() {
  const { activityChart, isLoading, error } = useOrderActivityChart();

  // Transform data for existing chart component
  const chartData =
    activityChart?.map((item) => ({
      name: item.dateDisplay,
      auftraege: item.auftraege,
      anfragen: item.anfragen,
    })) || [];

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return <DashboardChart data={chartData} />;
}
```

### With Custom Chart Libraries

```typescript
import { useOrderActivityChart } from "@/hooks/use-order-activity-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CustomChart() {
  const { activityChart, isLoading, error } = useOrderActivityChart({
    initialDays: 30,
    enableAutoRefresh: true,
  });

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={activityChart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dateDisplay" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="auftraege"
          stroke="#3b82f6"
          name="Aufträge"
        />
        <Line
          type="monotone"
          dataKey="anfragen"
          stroke="#f59e0b"
          name="Anfragen"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Testing

The hook comes with comprehensive tests covering:

- Basic functionality and data fetching
- Error handling scenarios
- Configuration options
- Auto-refresh functionality
- Data transformation
- All hook variants

Run tests with:

```bash
npm test use-order-activity-chart.test.ts
```

## Performance Considerations

- **Efficient Queries**: Uses optimized database queries on the backend
- **Smart Caching**: Prevents unnecessary API calls with intelligent caching
- **Background Updates**: Refreshes data in the background without blocking UI
- **Retry Logic**: Exponential backoff for failed requests
- **Memory Management**: Automatic cleanup of intervals and subscriptions

## Migration from useChartData

If you're migrating from the existing `useChartData` hook:

```typescript
// Old way
import { useChartData } from "@/hooks/use-chart-data";
const { data, loading, error } = useChartData();

// New way
import { useSimpleOrderActivityChart } from "@/hooks/use-order-activity-chart";
const {
  activityChart: data,
  isLoading: loading,
  error,
} = useSimpleOrderActivityChart();
```

## Best Practices

1. **Use the Right Variant**: Choose the hook variant that best fits your use case
2. **Handle Loading States**: Always provide loading indicators for better UX
3. **Error Boundaries**: Wrap components in error boundaries for graceful error handling
4. **Optimize Refresh Intervals**: Don't refresh too frequently to avoid unnecessary load
5. **Cache Appropriately**: Use appropriate cache times based on data freshness requirements
6. **Test Edge Cases**: Test with empty data, errors, and network issues

## Examples

See the [examples directory](./examples/use-order-activity-chart-example.tsx) for comprehensive usage examples including:

- Basic usage with default configuration
- Simplified usage for basic components
- Skeleton UI support for better UX
- Manual refresh control
- Custom configuration with error handling
- Integration with existing chart components

## Dependencies

- `@tanstack/react-query`: For data fetching and caching
- `sonner`: For toast notifications
- `@/lib/api/dashboard`: Dashboard API service
- `@/lib/types/dashboard`: TypeScript types

## Related

- [`useDashboardStatistics`](./README-useDashboardStatistics.md): For dashboard statistics data
- [`DashboardChart`](../components/dashboard-chart.tsx): Chart component
- [Dashboard API](../lib/api/dashboard.ts): API service
