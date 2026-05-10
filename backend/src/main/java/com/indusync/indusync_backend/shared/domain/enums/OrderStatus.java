package com.indusync.indusync_backend.shared.domain.enums;

import lombok.Getter;

/**
 * Enumeration of order statuses in the IndusSync system.
 * <p>
 * This enum represents the lifecycle of an order from creation to completion:
 * - DRAFT: Order is being created but not yet published
 * - PUBLISHED: Order is published and open for matching
 * - MATCHED: Order has been matched with provider(s)
 * - IN_PROGRESS: Order is being executed
 * - COMPLETED: Order has been successfully completed
 * - CANCELLED: Order was cancelled before completion
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
public enum OrderStatus {

    /**
     * Order is in draft status - being created but not yet published.
     * This is the initial status when an order is first created.
     */
    DRAFT("Entwurf", "Order is being drafted", true, false),

    /**
     * Order has been published and is open for matching with providers.
     * Orders in this status are visible to potential service providers.
     */
    PUBLISHED("Veröffentlicht", "Order is published and open for matching", true, true),

    /**
     * Order has been matched with one or more service providers.
     * Provider selection process is complete.
     */
    MATCHED("Zugeordnet", "Order has been matched with provider(s)", true, true),

    /**
     * Order is currently being executed by the matched provider(s).
     * Work is in progress.
     */
    IN_PROGRESS("In Bearbeitung", "Order is being executed", true, true),

    /**
     * Order has been successfully completed.
     * All work has been finished and accepted.
     */
    COMPLETED("Abgeschlossen", "Order has been completed", false, true),

    /**
     * Order was cancelled before completion.
     * No further action is possible on this order.
     */
    CANCELLED("Storniert", "Order was cancelled", false, true);

    /**
     * German display name for the status.
     */
    private final String displayName;

    /**
     * English description of the status.
     */
    private final String description;

    /**
     * Whether the order can be modified in this status.
     */
    private final boolean modifiable;

    /**
     * Whether the order is visible to service providers.
     */
    private final boolean visibleToProviders;

    OrderStatus(String displayName, String description, boolean modifiable, boolean visibleToProviders) {
        this.displayName = displayName;
        this.description = description;
        this.modifiable = modifiable;
        this.visibleToProviders = visibleToProviders;
    }

    /**
     * Checks if the order can be published from the current status.
     *
     * @return true if order can be published
     */
    public boolean canBePublished() {
        return this == DRAFT;
    }

    /**
     * Checks if the order can be cancelled from the current status.
     *
     * @return true if order can be cancelled
     */
    public boolean canBeCancelled() {
        return this == DRAFT || this == PUBLISHED || this == MATCHED;
    }

    /**
     * Checks if the order can be matched from the current status.
     *
     * @return true if order can be matched
     */
    public boolean canBeMatched() {
        return this == PUBLISHED;
    }

    /**
     * Checks if the order can be set to in progress from the current status.
     *
     * @return true if order can be set to in progress
     */
    public boolean canBeSetInProgress() {
        return this == MATCHED;
    }

    /**
     * Checks if the order can be completed from the current status.
     *
     * @return true if order can be completed
     */
    public boolean canBeCompleted() {
        return this == IN_PROGRESS;
    }

    /**
     * Checks if this is a final status (no further transitions possible).
     *
     * @return true if this is a final status
     */
    public boolean isFinalStatus() {
        return this == COMPLETED || this == CANCELLED;
    }

    /**
     * Checks if the order is in an active (non-final) lifecycle phase.
     * This replaces ad-hoc checks scattered in services.
     */
    public boolean isActive() {
        return !isFinalStatus();
    }

    /**
     * Gets all statuses that are visible to service providers.
     *
     * @return array of statuses visible to providers
     */
    public static OrderStatus[] getProviderVisibleStatuses() {
        return new OrderStatus[] { PUBLISHED, MATCHED, IN_PROGRESS, COMPLETED };
    }

    /**
     * Gets all active statuses (non-final).
     *
     * @return array of active statuses
     */
    public static OrderStatus[] getActiveStatuses() {
        return new OrderStatus[] { DRAFT, PUBLISHED, MATCHED, IN_PROGRESS };
    }

    /**
     * Returns the display name for UI purposes.
     *
     * @return German display name
     */
    @Override
    public String toString() {
        return displayName;
    }
}