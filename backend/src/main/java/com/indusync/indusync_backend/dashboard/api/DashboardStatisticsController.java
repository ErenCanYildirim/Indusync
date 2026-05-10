package com.indusync.indusync_backend.dashboard.api;

import com.indusync.indusync_backend.dashboard.application.DashboardStatisticsService;
import com.indusync.indusync_backend.dashboard.application.dto.DashboardStatistics;
import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.AuthenticationContext;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


/**
 * REST controller for dashboard statistics endpoints.
 * <p>
 * Provides endpoints for retrieving real-time dashboard statistics and order
 * activity charts for authenticated companies. All endpoints require proper
 * authentication and company context validation.
 * </p>
 * <p>
 * The controller handles role-aware statistics that differentiate between
 * client and provider activities, ensuring companies only see data relevant
 * to their own business context.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/dashboard")
@Slf4j
@Validated
@Tag(name = "Dashboard Statistics", description = "Real-time dashboard statistics and charts")
public class DashboardStatisticsController extends BaseController {

     private final DashboardStatisticsService dashboardStatisticsService;

    public DashboardStatisticsController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            DashboardStatisticsService dashboardStatisticsService) {
        super(authHelper, responseHelper);
        this.dashboardStatisticsService = dashboardStatisticsService;
    }

    /**
     * Retrieves comprehensive dashboard statistics for the authenticated company.
     * <p>
     * Returns key performance metrics including active orders, open applications,
     * completed orders, and average response time. All metrics are calculated
     * based on the company's role as client, provider, or both.
     * </p>
     *
     * @param authentication the authentication context containing user and company
     *                       information
     * @return dashboard statistics for the authenticated company
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get dashboard statistics", description = "Retrieves comprehensive dashboard statistics including active orders, open applications, completed orders, and average response time for the authenticated company")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing authentication"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no valid company context"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<?> getDashboardStatistics(Authentication authentication) {

        String requestPath = getCurrentRequestPath();
        log.info("Getting dashboard statistics for authenticated user");

        try {
            // Validate authentication and company context
            AuthenticationContext authContext = validateAuthenticationWithCompany(authentication);
            if (authContext == null) {
                log.warn("Dashboard statistics request failed: no valid company context");
                return handleNoCompanyContext(requestPath);
            }

            UUID companyId = authContext.currentCompanyId();
            log.debug("Retrieving dashboard statistics for company: {}", companyId);

            // Get statistics from service
            DashboardStatistics statistics = dashboardStatisticsService.getCompanyDashboardStatistics(companyId);

            log.info("Dashboard statistics retrieved successfully for company: {}", companyId);
            return ResponseEntity.ok(statistics);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for dashboard statistics: {}", e.getMessage());
            return handleBadRequest(e.getMessage(), requestPath);

        } catch (Exception e) {
            log.error("Error retrieving dashboard statistics", e);
            return handleInternalServerError("Failed to retrieve dashboard statistics", requestPath);
        }
    }

    /**
     * Retrieves order activity chart data for the authenticated company.
     * <p>
     * Returns daily activity data showing "Aufträge" (orders) and "Anfragen"
     * (applications) over the specified time period. The data is role-aware
     * and properly categorized based on the company's business context.
     * </p>
     *
     * @param days           the number of days to include in the chart (default:
     *                       30, max: 365)
     * @param authentication the authentication context containing user and company
     *                       information
     * @return list of daily order activity data for chart display
     */
    @GetMapping("/activity-chart")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get order activity chart data", description = "Retrieves daily order activity data for dashboard charts, showing orders and applications over the specified time period")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order activity chart data retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request - invalid days parameter"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing authentication"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no valid company context"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<?> getOrderActivityChart(
            @Parameter(description = "Number of days to include in chart (1-365)", example = "30") @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") Integer days,
            Authentication authentication) {

        String requestPath = getCurrentRequestPath();
        log.info("Getting order activity chart data for {} days", days);

        try {
            // Validate authentication and company context
            AuthenticationContext authContext = validateAuthenticationWithCompany(authentication);
            if (authContext == null) {
                log.warn("Order activity chart request failed: no valid company context");
                return handleNoCompanyContext(requestPath);
            }

            UUID companyId = authContext.currentCompanyId();
            log.debug("Retrieving order activity chart for company: {} over {} days", companyId, days);

            // Get chart data from service
            List<OrderActivityData> activityData = dashboardStatisticsService.getOrderActivityChart(companyId, days);

            log.info("Order activity chart data retrieved successfully for company: {} ({} data points)",
                    companyId, activityData.size());
            return ResponseEntity.ok(activityData);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for order activity chart: {}", e.getMessage());
            return handleBadRequest(e.getMessage(), requestPath);

        } catch (Exception e) {
            log.error("Error retrieving order activity chart data", e);
            return handleInternalServerError("Failed to retrieve order activity chart data", requestPath);
        }
    }
}