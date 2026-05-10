# Dashboard Statistics Caching Implementation

## Overview

This document describes the caching implementation for dashboard statistics to improve performance and reduce database load.

## Cache Configuration

The caching system uses **Caffeine** as the cache provider with the following configurations:

### Cache Types

1. **dashboard-statistics**

   - **Purpose**: Caches company dashboard statistics (active orders, applications, etc.)
   - **TTL**: 5 minutes
   - **Max Size**: 1000 entries
   - **Key Format**: `companyId` (UUID)

2. **order-activity**
   - **Purpose**: Caches order activity chart data
   - **TTL**: 10 minutes
   - **Max Size**: 500 entries
   - **Key Format**: `companyId-days` (e.g., "uuid-30")

## Cached Methods

### DashboardStatisticsService

1. **getCompanyDashboardStatistics(UUID companyId)**

   - Cache: `dashboard-statistics`
   - Key: `companyId`
   - TTL: 5 minutes

2. **getOrderActivityChart(UUID companyId, int days)**
   - Cache: `order-activity`
   - Key: `companyId + '-' + days`
   - TTL: 10 minutes

## Cache Eviction

### Automatic Eviction

- **TTL-based**: Entries expire automatically after the configured time
- **Size-based**: LRU eviction when cache reaches maximum size

### Manual Eviction Methods

```java
// Evict dashboard statistics for a specific company
dashboardStatisticsService.evictDashboardStatisticsCache(companyId);

// Evict order activity chart for a specific company
dashboardStatisticsService.evictOrderActivityCache(companyId);

// Evict all dashboard caches for a specific company
dashboardStatisticsService.evictAllDashboardCaches(companyId);

// Evict all dashboard caches (use sparingly)
dashboardStatisticsService.evictAllDashboardCaches();
```

### When to Evict Cache

Cache should be evicted when underlying data changes:

1. **Order Status Changes**: When orders change status (PUBLISHED → MATCHED → IN_PROGRESS → COMPLETED)
2. **New Orders**: When new orders are created
3. **New Applications**: When applications are submitted or status changes
4. **Data Updates**: After bulk data operations or migrations

## Usage Examples

### Service Integration

```java
@Service
public class OrderService {

    @Autowired
    private DashboardStatisticsService dashboardStatisticsService;

    public void updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        // Update order status in database
        orderRepository.updateStatus(orderId, newStatus);

        // Evict cache for affected companies
        Order order = orderRepository.findById(orderId);
        dashboardStatisticsService.evictAllDashboardCaches(order.getCompanyId());
        if (order.getProviderId() != null) {
            dashboardStatisticsService.evictAllDashboardCaches(order.getProviderId());
        }
    }
}
```

### Event-Driven Cache Eviction

```java
@EventListener
public void handleOrderStatusChanged(OrderStatusChangedEvent event) {
    // Evict cache for both client and provider companies
    dashboardStatisticsService.evictAllDashboardCaches(event.getClientCompanyId());
    if (event.getProviderCompanyId() != null) {
        dashboardStatisticsService.evictAllDashboardCaches(event.getProviderCompanyId());
    }
}
```

## Performance Benefits

1. **Reduced Database Load**: Expensive statistical queries are cached
2. **Faster Response Times**: Dashboard loads faster with cached data
3. **Better Scalability**: System can handle more concurrent users
4. **Optimized Resource Usage**: Less CPU and memory usage for repeated calculations

## Monitoring

Cache statistics are enabled and can be monitored through:

1. **Spring Boot Actuator**: `/actuator/caches` endpoint
2. **Metrics**: Cache hit/miss ratios, eviction counts
3. **Logs**: Cache operations are logged at DEBUG level

## Security Considerations

1. **Data Isolation**: Cache keys include company ID to prevent cross-company data leakage
2. **TTL Limits**: Short TTL values ensure data freshness
3. **Memory Limits**: Maximum cache sizes prevent memory exhaustion
4. **Access Control**: Cache eviction methods respect existing security boundaries

## Testing

Cache behavior is tested through:

1. **Unit Tests**: Verify cache annotations and key generation
2. **Integration Tests**: Test cache manager configuration
3. **Performance Tests**: Measure cache effectiveness

## Configuration

Cache configuration is managed in:

- `CacheConfig.java`: Programmatic cache setup
- `application.yml`: Environment-specific settings (if needed)

## Troubleshooting

### Common Issues

1. **Cache Not Working**: Verify `@EnableCaching` is present and methods are public
2. **Wrong Cache Keys**: Check key generation logic in `@Cacheable` annotations
3. **Memory Issues**: Monitor cache sizes and adjust limits if needed
4. **Stale Data**: Ensure proper cache eviction on data changes

### Debug Tips

1. Enable cache logging: `logging.level.org.springframework.cache=DEBUG`
2. Check cache statistics via actuator endpoints
3. Verify cache annotations are processed correctly
4. Test cache eviction methods manually