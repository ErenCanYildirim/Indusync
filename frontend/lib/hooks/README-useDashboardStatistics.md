# useDashboardStatistics Hook

A comprehensive React hook for fetching and managing dashboard statistics with automatic refresh, loading states, error handling, and user-friendly error messages.

## Features

- **Automatic Data Refresh**: Configurable intervals with smart refresh logic
- **Loading States**: Comprehensive loading state management
- **Error Handling**: User-friendly German error messages with retry mechanisms
- **Stale Data Detection**: Automatic detection of outdated data
- **Manual Refresh**: Programmatic refresh control
- **TypeScript Support**: Full TypeScript integration with type safety
- **Caching**: Efficient caching with TanStack Query
- **Toast Notifications**: Optional success/error toast notifications
- **Custom Error Handlers**: Configurable error and success callbacks
- **Conditional Loading**: Enable/disable data fetching based on conditions

## Installation

The hook is already integrated into the IndusSync frontend project. No additional installation required.

## Basic Usage

```tsx
import { useDashboardStatistics } from "@/lib/hooks/useDashboardStatistics";

function DashboardComponent() {
  const { statistics, isLoading, error, refresh, lastUpdated, isStale } =
    useDashboardStatistics();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statistics) return <div>No data available</div>;

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      <p>Active Orders: {statistics.activeOrders}</p>
      <p>Open Applications: {statistics.openApplications}</p>
      <p>Completed Orders: {statistics.completedOrders}</p>
      <p>Response Time: {statistics.averageResponseTimeDisplay}</p>

      {isStale && <p>Data may be outdated</p>}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Hook Variants

### 1. `useDashboardStatistics` (Main Hook)

The primary hook with full configuration options.

```tsx
const { statistics, isLoading, error, refresh, lastUpdated, isStale } =
  useDashboardStatistics({
    enableAutoRefresh: true,
    refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
    staleTimeMs: 2 * 60 * 1000, // 2 minutes
    showErrorToasts: true,
    onError: (error) => console.error(error),
    onSuccess: (data) => console.log("Data loaded", data),
  });
```

### 2. `useSimpleDashboardStatistics`

Simplified interface for basic use cases.

```tsx
const { statistics, isLoading, error, refresh, hasData, hasError } =
  useSimpleDashboardStatistics();
```

### 3. `useDashboardStatisticsWithInterval`

Hook with custom refresh interval.

```tsx
const dashboardData = useDashboardStatisticsWithInterval(2 * 60 * 1000); // 2 minutes
```

### 4. `useManualDashboardStatistics`

Hook without automatic refresh for manual control.

```tsx
const { statistics, isLoading, error, refresh } =
  useManualDashboardStatistics();
```

## Configuration Options

| Option              | Type       | Default     | Description                                       |
| ------------------- | ---------- | ----------- | ------------------------------------------------- |
| `enableAutoRefresh` | `boolean`  | `true`      | Enable automatic data refresh                     |
| `refreshIntervalMs` | `number`   | `300000`    | Refresh interval in milliseconds (5 min)          |
| `staleTimeMs`       | `number`   | `120000`    | Time after which data is considered stale (2 min) |
| `cacheTimeMs`       | `number`   | `600000`    | Cache retention time (10 min)                     |
| `showErrorToasts`   | `boolean`  | `true`      | Show error toast notifications                    |
| `showSuccessToasts` | `boolean`  | `false`     | Show success toast notifications                  |
| `onError`           | `function` | `undefined` | Custom error handler                              |
| `onSuccess`         | `function` | `undefined` | Custom success handler                            |
| `enabled`           | `boolean`  | `true`      | Enable/disable the query                          |

## Return Values

### Main Hook Return Type

```tsx
interface UseDashboardStatisticsReturn {
  // Data
  statistics: DashboardStatistics | null;

  // Loading states
  isLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;

  // Metadata
  lastUpdated: Date | null;
  isStale: boolean;
}
```

### Dashboard Statistics Type

```tsx
interface DashboardStatistics {
  activeOrders: number;
  openApplications: number;
  completedOrders: number;
  averageResponseTimeDays: number | null;
  averageResponseTimeDisplay: string;
}
```

## Error Handling

The hook provides comprehensive error handling with user-friendly German messages:

### Error Types

- **Authentication Errors (401)**: "Authentifizierung erforderlich. Bitte melden Sie sich erneut an."
- **Permission Errors (403)**: "Keine Berechtigung für Dashboard-Statistiken."
- **Server Errors (500)**: "Serverfehler beim Laden der Dashboard-Daten."
- **Network Errors**: "Netzwerkfehler: Dashboard-Daten konnten nicht geladen werden."
- **Timeout Errors**: "Zeitüberschreitung: Das Laden der Dashboard-Daten hat zu lange gedauert."

### Custom Error Handling

```tsx
const { statistics, error } = useDashboardStatistics({
  showErrorToasts: false, // Disable automatic toasts
  onError: (error) => {
    // Custom error handling
    console.error("Dashboard error:", error);

    if (error.statusCode === 401) {
      // Handle authentication error
      redirectToLogin();
    } else {
      // Show custom error UI
      showCustomErrorDialog(error.message);
    }
  },
});
```

## Advanced Usage Examples

### Conditional Loading

```tsx
const { statistics } = useDashboardStatistics({
  enabled: userHasPermission && isAuthenticated,
  onError: (error) => {
    if (error.statusCode === 403) {
      setShowPermissionError(true);
    }
  },
});
```

### Custom Refresh Logic

```tsx
const { statistics, refresh, isLoading } = useDashboardStatistics({
  enableAutoRefresh: false, // Disable automatic refresh
});

// Custom refresh trigger
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && !isLoading) {
      refresh();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, [refresh, isLoading]);
```

### Real-time Updates

```tsx
const { statistics, lastUpdated } = useDashboardStatisticsWithInterval(
  30 * 1000
); // 30 seconds

// Show real-time indicator
const isRealTime = lastUpdated && Date.now() - lastUpdated.getTime() < 60000; // < 1 minute
```

## Performance Considerations

### Caching Strategy

The hook uses TanStack Query for efficient caching:

- **Stale Time**: 2 minutes (data considered fresh)
- **Cache Time**: 10 minutes (data kept in memory)
- **Background Refetch**: Enabled on window focus and reconnect

### Optimization Tips

1. **Use Appropriate Refresh Intervals**: Don't refresh too frequently
2. **Conditional Loading**: Only fetch when needed
3. **Error Boundaries**: Wrap components in error boundaries
4. **Memoization**: Memoize expensive computations based on statistics

```tsx
const computedStats = useMemo(() => {
  if (!statistics) return null;

  return {
    totalOrders: statistics.activeOrders + statistics.completedOrders,
    hasActivity: statistics.activeOrders > 0 || statistics.openApplications > 0,
    responseTimeInHours: statistics.averageResponseTimeDays
      ? statistics.averageResponseTimeDays * 24
      : null,
  };
}, [statistics]);
```

## Testing

The hook includes comprehensive tests covering:

- ✅ Basic functionality and data fetching
- ✅ Error handling for different error types
- ✅ Auto-refresh functionality
- ✅ Manual refresh operations
- ✅ Configuration options
- ✅ Stale data detection
- ✅ Toast notifications
- ✅ Custom error/success handlers

### Running Tests

```bash
npm test -- lib/hooks/__tests__/useDashboardStatistics.test.ts
```

## Integration with Dashboard Components

### Dashboard Metric Cards

```tsx
function DashboardMetricCard({ title, value, isLoading, error }) {
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard error={error} />;

  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { statistics, isLoading, error } = useDashboardStatistics();

  return (
    <div className="dashboard-grid">
      <DashboardMetricCard
        title="Active Orders"
        value={statistics?.activeOrders}
        isLoading={isLoading}
        error={error}
      />
      {/* More metric cards... */}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Hook not updating**: Check if `enabled` is set to `true`
2. **Frequent re-renders**: Ensure proper memoization of callback functions
3. **Stale data**: Adjust `staleTimeMs` configuration
4. **Memory leaks**: Hook automatically cleans up intervals on unmount

### Debug Mode

Enable debug logging in development:

```tsx
const { statistics } = useDashboardStatistics({
  onSuccess: (data) => {
    if (process.env.NODE_ENV === "development") {
      console.log("Dashboard statistics loaded:", data);
    }
  },
  onError: (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard statistics error:", error);
    }
  },
});
```

## Related Documentation

- [Dashboard API Service](../api/README-dashboard.md)
- [Dashboard Types](../types/dashboard.ts)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Dashboard Components](../../components/dashboard/)

## Contributing

When modifying the hook:

1. Update tests for new functionality
2. Update TypeScript types
3. Update this documentation
4. Test with different error scenarios
5. Verify performance impact

## Changelog

### v1.0.0 (Dashboard Statistics Implementation)

- Initial implementation with full feature set
- Automatic refresh with configurable intervals
- Comprehensive error handling
- TypeScript support
- Test coverage
- Multiple hook variants for different use cases
