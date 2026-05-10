package com.indusync.indusync_backend.dashboard.application.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.indusync.indusync_backend.review.application.dto.CompanyRole;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

/**
 * DTO representing dashboard statistics for a company.
 * <p>
 * Contains key performance metrics including active orders, open applications,
 * completed orders, and average response time. All metrics are calculated
 * based on the company's role as client, provider, or both.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DashboardStatistics(
        /**
         * Number of currently active orders for the company.
         * <p>
         * For clients: Orders with status PUBLISHED, MATCHED, or ASSIGNED.
         * For providers: Orders assigned to the company with status ASSIGNED.
         * For dual-role companies: Sum of both client and provider active orders.
         * </p>
         */
        @NotNull @Min(0) Integer activeOrders,

        /**
         * Number of open applications related to the company's orders.
         * <p>
         * For clients: Applications received on published orders with status
         * INTERESTED.
         * For providers: Applications sent to other companies with status INTERESTED.
         * For dual-role companies: Sum of both received and sent applications.
         * </p>
         */
        @NotNull @Min(0) Integer openApplications,

        /**
         * Number of completed orders for the company.
         * <p>
         * For clients: Orders created by the company with status COMPLETED.
         * For providers: Orders completed by the company as provider.
         * For dual-role companies: Sum of both client and provider completed orders.
         * </p>
         */
        @NotNull @Min(0) Integer completedOrders,

        /**
         * Average response time in days for order interactions.
         * <p>
         * For clients: Average time from order publication to first application
         * received.
         * For providers: Average time from order publication to application submission.
         * For dual-role companies: Weighted average based on role-specific
         * interactions.
         * </p>
         * <p>
         * Precision: Up to 1 decimal place (e.g., 1.2 days).
         * Null if no response time data is available.
         * </p>
         */
        @Min(0) Double averageResponseTimeDays,

        /**
         * Human-readable display format of the average response time.
         * <p>
         * Examples:
         * - "1.2 Tage" for 1.2 days
         * - "0.5 Tage" for 0.5 days
         * - "Keine Daten" when averageResponseTimeDays is null
         * </p>
         */
        @NotNull String averageResponseTimeDisplay,

        /**
         * Set of roles this company has in the system.
         * <p>
         * Determines how statistics are calculated and displayed:
         * - CLIENT only: Company creates orders and receives applications
         * - PROVIDER only: Company applies to orders and fulfills them
         * - Both CLIENT and PROVIDER: Company does both activities
         * </p>
         */
        @NotNull Set<CompanyRole> companyRoles,

        /**
         * Role-specific context information for metric descriptions.
         * <p>
         * Provides context-aware descriptions based on the company's roles:
         * - For CLIENT: "Aufträge, die Sie erstellt haben"
         * - For PROVIDER: "Aufträge, die Ihnen zugewiesen wurden"
         * - For DUAL: "Aufträge als Auftraggeber und Dienstleister"
         * </p>
         */
        @NotNull DashboardRoleContext roleContext) {

    /**
     * Creates a DashboardStatistics instance with calculated display format and
     * role context.
     *
     * @param activeOrders            number of active orders
     * @param openApplications        number of open applications
     * @param completedOrders         number of completed orders
     * @param averageResponseTimeDays average response time in days
     * @param companyRoles            set of roles the company has
     * @return DashboardStatistics with formatted display string and role context
     */
    public static DashboardStatistics of(Integer activeOrders, Integer openApplications,
            Integer completedOrders, Double averageResponseTimeDays, Set<CompanyRole> companyRoles) {
        String displayFormat = formatResponseTime(averageResponseTimeDays);
        DashboardRoleContext roleContext = DashboardRoleContext.forRoles(companyRoles);
        return new DashboardStatistics(activeOrders, openApplications, completedOrders,
                averageResponseTimeDays, displayFormat, companyRoles, roleContext);
    }

    /**
     * Creates an empty DashboardStatistics instance for companies with no data.
     *
     * @return DashboardStatistics with zero values and "Keine Daten" display
     */
    public static DashboardStatistics empty() {
        return new DashboardStatistics(0, 0, 0, null, "Keine Daten",
                Set.of(), DashboardRoleContext.empty());
    }

    /**
     * Formats the response time for display.
     *
     * @param responseTimeDays the response time in days
     * @return formatted string for display
     */
    private static String formatResponseTime(Double responseTimeDays) {
        if (responseTimeDays == null) {
            return "Keine Daten";
        }

        if (responseTimeDays == 0.0) {
            return "0 Tage";
        }

        // Format to 1 decimal place if needed
        if (responseTimeDays % 1 == 0) {
            return String.format("%.0f Tage", responseTimeDays);
        } else {
            return String.format("%.1f Tage", responseTimeDays);
        }
    }

    /**
     * Checks if the company has any activity.
     *
     * @return true if any metric is greater than 0
     */
    public boolean hasActivity() {
        return activeOrders > 0 || openApplications > 0 || completedOrders > 0;
    }

    /**
     * Checks if response time data is available.
     *
     * @return true if averageResponseTimeDays is not null
     */
    public boolean hasResponseTimeData() {
        return averageResponseTimeDays != null;
    }

    /**
     * Gets the total number of orders (active + completed).
     *
     * @return sum of active and completed orders
     */
    @JsonIgnore
    public Integer getTotalOrders() {
        return activeOrders + completedOrders;
    }
}