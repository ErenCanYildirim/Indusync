/**
 * Dashboard Statistics Hook Usage Examples
 *
 * This file demonstrates various ways to use the useDashboardStatistics hook
 * in different scenarios and components.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import React from "react";
import {
  useDashboardStatistics,
  useSimpleDashboardStatistics,
  useDashboardStatisticsWithInterval,
  useManualDashboardStatistics,
} from "../useDashboardStatistics";

// =============================================================================
// BASIC USAGE EXAMPLE
// =============================================================================

/**
 * Basic dashboard statistics component with default configuration
 */
export const BasicDashboardStats: React.FC = () => {
  const { statistics, isLoading, error, refresh, lastUpdated, isStale } =
    useDashboardStatistics();

  if (isLoading) {
    return <div>Loading dashboard statistics...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading statistics: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!statistics) {
    return <div>No statistics available</div>;
  }

  return (
    <div className="dashboard-stats">
      <h2>Dashboard Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Orders</h3>
          <p className="stat-value">{statistics.activeOrders}</p>
        </div>

        <div className="stat-card">
          <h3>Open Applications</h3>
          <p className="stat-value">{statistics.openApplications}</p>
        </div>

        <div className="stat-card">
          <h3>Completed Orders</h3>
          <p className="stat-value">{statistics.completedOrders}</p>
        </div>

        <div className="stat-card">
          <h3>Average Response Time</h3>
          <p className="stat-value">{statistics.averageResponseTimeDisplay}</p>
        </div>
      </div>

      <div className="stats-meta">
        {lastUpdated && <p>Last updated: {lastUpdated.toLocaleString()}</p>}
        {isStale && <p className="warning">Data may be outdated</p>}
        <button onClick={refresh}>Refresh</button>
      </div>
    </div>
  );
};

// =============================================================================
// SIMPLIFIED USAGE EXAMPLE
// =============================================================================

/**
 * Simplified dashboard statistics component for basic use cases
 */
export const SimpleDashboardStats: React.FC = () => {
  const { statistics, isLoading, error, refresh, hasData, hasError } =
    useSimpleDashboardStatistics();

  return (
    <div className="simple-dashboard-stats">
      {isLoading && <div>Loading...</div>}

      {hasError && (
        <div className="error">
          <p>{error}</p>
          <button onClick={refresh}>Try Again</button>
        </div>
      )}

      {hasData && statistics && (
        <div className="stats-summary">
          <span>Active: {statistics.activeOrders}</span>
          <span>Applications: {statistics.openApplications}</span>
          <span>Completed: {statistics.completedOrders}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// CUSTOM REFRESH INTERVAL EXAMPLE
// =============================================================================

/**
 * Dashboard statistics with custom refresh interval (every 2 minutes)
 */
export const FastRefreshDashboardStats: React.FC = () => {
  const { statistics, isLoading, error, refresh } =
    useDashboardStatisticsWithInterval(2 * 60 * 1000); // 2 minutes

  return (
    <div className="fast-refresh-stats">
      <h3>Real-time Dashboard (2min refresh)</h3>

      {isLoading && <div className="loading-indicator">Updating...</div>}

      {error && (
        <div className="error-banner">
          <p>Failed to load statistics: {error}</p>
          <button onClick={refresh}>Refresh Now</button>
        </div>
      )}

      {statistics && (
        <div className="live-stats">
          <div className="stat">
            <label>Active Orders:</label>
            <span className="value">{statistics.activeOrders}</span>
          </div>
          <div className="stat">
            <label>Open Applications:</label>
            <span className="value">{statistics.openApplications}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MANUAL REFRESH EXAMPLE
// =============================================================================

/**
 * Dashboard statistics with manual refresh control
 */
export const ManualRefreshDashboardStats: React.FC = () => {
  const { statistics, isLoading, error, refresh, lastUpdated } =
    useManualDashboardStatistics();

  const handleRefresh = async () => {
    try {
      await refresh();
      console.log("Statistics refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh statistics:", error);
    }
  };

  return (
    <div className="manual-refresh-stats">
      <div className="header">
        <h3>Dashboard Statistics</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="refresh-button"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {statistics && (
        <div className="stats-content">
          <div className="metric">
            <h4>Active Orders</h4>
            <p className="metric-value">{statistics.activeOrders}</p>
          </div>

          <div className="metric">
            <h4>Open Applications</h4>
            <p className="metric-value">{statistics.openApplications}</p>
          </div>

          <div className="metric">
            <h4>Completed Orders</h4>
            <p className="metric-value">{statistics.completedOrders}</p>
          </div>

          <div className="metric">
            <h4>Response Time</h4>
            <p className="metric-value">
              {statistics.averageResponseTimeDisplay}
            </p>
          </div>
        </div>
      )}

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// ADVANCED CONFIGURATION EXAMPLE
// =============================================================================

/**
 * Dashboard statistics with advanced configuration and custom error handling
 */
export const AdvancedDashboardStats: React.FC = () => {
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [errorHistory, setErrorHistory] = React.useState<string[]>([]);

  const { statistics, isLoading, error, refresh, lastUpdated, isStale } =
    useDashboardStatistics({
      enableAutoRefresh: true,
      refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
      staleTimeMs: 2 * 60 * 1000, // 2 minutes
      showErrorToasts: false, // Handle errors manually
      showSuccessToasts: true,
      onSuccess: (data) => {
        console.log("Dashboard statistics loaded:", data);
        setRefreshCount((prev) => prev + 1);
      },
      onError: (error) => {
        console.error("Dashboard statistics error:", error);
        setErrorHistory((prev) => [...prev.slice(-4), error.message]);
      },
    });

  const handleManualRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error("Manual refresh failed:", error);
    }
  };

  return (
    <div className="advanced-dashboard-stats">
      <div className="stats-header">
        <h2>Advanced Dashboard Statistics</h2>
        <div className="stats-info">
          <span>Refreshes: {refreshCount}</span>
          {isStale && <span className="stale-indicator">Data Stale</span>}
          {lastUpdated && (
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard statistics...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h4>Current Error:</h4>
          <p>{error}</p>
          <button onClick={handleManualRefresh}>Retry</button>
        </div>
      )}

      {errorHistory.length > 0 && (
        <div className="error-history">
          <h4>Recent Errors:</h4>
          <ul>
            {errorHistory.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {statistics && (
        <div className="stats-display">
          <div className="primary-stats">
            <div className="stat-item">
              <span className="stat-label">Active Orders</span>
              <span className="stat-number">{statistics.activeOrders}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Open Applications</span>
              <span className="stat-number">{statistics.openApplications}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Completed Orders</span>
              <span className="stat-number">{statistics.completedOrders}</span>
            </div>
          </div>

          <div className="response-time-stat">
            <span className="stat-label">Average Response Time</span>
            <span className="stat-value">
              {statistics.averageResponseTimeDisplay}
            </span>
            {statistics.averageResponseTimeDays !== null && (
              <span className="stat-detail">
                ({statistics.averageResponseTimeDays.toFixed(1)} days)
              </span>
            )}
          </div>
        </div>
      )}

      <div className="stats-actions">
        <button onClick={handleManualRefresh} disabled={isLoading}>
          Manual Refresh
        </button>
        <button onClick={() => setErrorHistory([])}>Clear Error History</button>
      </div>
    </div>
  );
};

// =============================================================================
// CONDITIONAL LOADING EXAMPLE
// =============================================================================

/**
 * Dashboard statistics with conditional loading based on user permissions
 */
export const ConditionalDashboardStats: React.FC<{
  userHasPermission: boolean;
}> = ({ userHasPermission }) => {
  const { statistics, isLoading, error, refresh } = useDashboardStatistics({
    enabled: userHasPermission, // Only fetch if user has permission
    showErrorToasts: true,
  });

  if (!userHasPermission) {
    return (
      <div className="permission-denied">
        <p>You don't have permission to view dashboard statistics.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="conditional-stats">
      {statistics && (
        <div className="stats-grid">
          <div>Active: {statistics.activeOrders}</div>
          <div>Applications: {statistics.openApplications}</div>
          <div>Completed: {statistics.completedOrders}</div>
          <div>Response Time: {statistics.averageResponseTimeDisplay}</div>
        </div>
      )}
    </div>
  );
};

export default {
  BasicDashboardStats,
  SimpleDashboardStats,
  FastRefreshDashboardStats,
  ManualRefreshDashboardStats,
  AdvancedDashboardStats,
  ConditionalDashboardStats,
};
