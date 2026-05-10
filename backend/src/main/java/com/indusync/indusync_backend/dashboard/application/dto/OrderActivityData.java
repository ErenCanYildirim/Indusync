package com.indusync.indusync_backend.dashboard.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * DTO representing daily order activity data for dashboard charts.
 * <p>
 * Contains daily counts of orders and applications with proper German formatting
 * for chart display. Distinguishes between "Aufträge" (orders) and "Anfragen" 
 * (applications) based on the company's role context.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record OrderActivityData(
        /**
         * The date for this activity data point.
         * <p>
         * Represents a single day in the activity chart timeline.
         * Used for sorting and grouping chart data.
         * </p>
         */
        @NotNull
        LocalDate date,

        /**
         * Human-readable display format of the date for chart labels.
         * <p>
         * Format: "dd.MM" (e.g., "01.05" for May 1st)
         * Used as x-axis labels in the dashboard chart.
         * </p>
         */
        @NotNull
        String dateDisplay,

        /**
         * Number of "Aufträge" (orders) for this date.
         * <p>
         * For clients: Orders created/published on this date.
         * For providers: Orders assigned to the company on this date.
         * For dual-role companies: Sum of both client and provider orders.
         * </p>
         */
        @NotNull
        @Min(0)
        Integer auftraege,

        /**
         * Number of "Anfragen" (applications/inquiries) for this date.
         * <p>
         * For clients: Applications received on published orders on this date.
         * For providers: Applications sent to other companies on this date.
         * For dual-role companies: Sum of both received and sent applications.
         * </p>
         */
        @NotNull
        @Min(0)
        Integer anfragen) {

    /**
     * Date formatter for German chart display format.
     */
    private static final DateTimeFormatter CHART_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM");

    /**
     * Creates an OrderActivityData instance with formatted date display.
     *
     * @param date      the activity date
     * @param auftraege number of orders
     * @param anfragen  number of applications
     * @return OrderActivityData with formatted date display
     */
    public static OrderActivityData of(LocalDate date, Integer auftraege, Integer anfragen) {
        String dateDisplay = date.format(CHART_DATE_FORMATTER);
        return new OrderActivityData(date, dateDisplay, auftraege, anfragen);
    }

    /**
     * Creates an empty OrderActivityData instance for dates with no activity.
     *
     * @param date the activity date
     * @return OrderActivityData with zero values
     */
    public static OrderActivityData empty(LocalDate date) {
        return of(date, 0, 0);
    }

    /**
     * Checks if there is any activity on this date.
     *
     * @return true if auftraege or anfragen is greater than 0
     */
    public boolean hasActivity() {
        return auftraege > 0 || anfragen > 0;
    }

    /**
     * Gets the total activity count for this date.
     *
     * @return sum of auftraege and anfragen
     */
    public Integer getTotalActivity() {
        return auftraege + anfragen;
    }

    /**
     * Gets the activity ratio (auftraege to total activity).
     * <p>
     * Useful for calculating chart proportions and percentages.
     * </p>
     *
     * @return ratio of auftraege to total activity, 0.0 if no activity
     */
    public Double getAuftraegeRatio() {
        Integer total = getTotalActivity();
        return total > 0 ? (double) auftraege / total : 0.0;
    }

    /**
     * Gets the activity ratio (anfragen to total activity).
     * <p>
     * Useful for calculating chart proportions and percentages.
     * </p>
     *
     * @return ratio of anfragen to total activity, 0.0 if no activity
     */
    public Double getAnfragenRatio() {
        Integer total = getTotalActivity();
        return total > 0 ? (double) anfragen / total : 0.0;
    }

    /**
     * Gets a formatted summary string for this activity data.
     * <p>
     * Example: "01.05: 3 Aufträge, 5 Anfragen"
     * </p>
     *
     * @return formatted activity summary
     */
    public String getActivitySummary() {
        return String.format("%s: %d Aufträge, %d Anfragen", dateDisplay, auftraege, anfragen);
    }

    /**
     * Compares this activity data with another by date.
     *
     * @param other the other OrderActivityData to compare with
     * @return negative if this date is before other, positive if after, 0 if equal
     */
    public int compareTo(OrderActivityData other) {
        return this.date.compareTo(other.date);
    }
}