package com.indusync.indusync_backend.dashboard.application.dto;

import com.indusync.indusync_backend.review.application.dto.CompanyRole;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

/**
 * DTO containing role-specific context information for dashboard metrics.
 * <p>
 * Provides context-aware descriptions and explanations based on the company's
 * roles in the system. This helps users understand what each metric represents
 * in their specific business context.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since Dashboard Statistics Implementation - Role-Aware Display
 */
public record DashboardRoleContext(
        /**
         * Context-aware description for active orders metric.
         * <p>
         * Examples:
         * - CLIENT only: "Aufträge, die Sie erstellt haben und noch bearbeitet werden"
         * - PROVIDER only: "Aufträge, die Ihnen zugewiesen wurden und noch bearbeitet
         * werden"
         * - DUAL role: "Aufträge als Auftraggeber und zugewiesene Aufträge als
         * Dienstleister"
         * </p>
         */
        @NotNull String activeOrdersDescription,

        /**
         * Context-aware description for open applications metric.
         * <p>
         * Examples:
         * - CLIENT only: "Bewerbungen, die Sie auf Ihre Aufträge erhalten haben"
         * - PROVIDER only: "Bewerbungen, die Sie auf andere Aufträge gesendet haben"
         * - DUAL role: "Erhaltene und gesendete Bewerbungen"
         * </p>
         */
        @NotNull String openApplicationsDescription,

        /**
         * Context-aware description for completed orders metric.
         * <p>
         * Examples:
         * - CLIENT only: "Aufträge, die Sie erfolgreich abgeschlossen haben"
         * - PROVIDER only: "Aufträge, die Sie als Dienstleister erfüllt haben"
         * - DUAL role: "Abgeschlossene Aufträge als Auftraggeber und Dienstleister"
         * </p>
         */
        @NotNull String completedOrdersDescription,

        /**
         * Context-aware description for average response time metric.
         * <p>
         * Examples:
         * - CLIENT only: "Durchschnittliche Zeit bis zur ersten Bewerbung auf Ihre
         * Aufträge"
         * - PROVIDER only: "Durchschnittliche Zeit bis zu Ihrer Bewerbung auf Aufträge"
         * - DUAL role: "Durchschnittliche Antwortzeit in beiden Rollen"
         * </p>
         */
        @NotNull String responseTimeDescription,

        /**
         * Tooltip text explaining how active orders are calculated.
         */
        @NotNull String activeOrdersTooltip,

        /**
         * Tooltip text explaining how open applications are calculated.
         */
        @NotNull String openApplicationsTooltip,

        /**
         * Tooltip text explaining how completed orders are calculated.
         */
        @NotNull String completedOrdersTooltip,

        /**
         * Tooltip text explaining how response time is calculated.
         */
        @NotNull String responseTimeTooltip,

        /**
         * Indicates if the company has dual roles (both CLIENT and PROVIDER).
         */
        boolean isDualRole,

        /**
         * Indicates if the company acts as a client.
         */
        boolean isClient,

        /**
         * Indicates if the company acts as a provider.
         */
        boolean isProvider) {

    /**
     * Creates a DashboardRoleContext based on the company's roles.
     *
     * @param companyRoles the set of roles the company has
     * @return DashboardRoleContext with appropriate descriptions and tooltips
     */
    public static DashboardRoleContext forRoles(Set<CompanyRole> companyRoles) {
        boolean isClient = companyRoles.contains(CompanyRole.CLIENT);
        boolean isProvider = companyRoles.contains(CompanyRole.PROVIDER);
        boolean isDualRole = isClient && isProvider;

        return new DashboardRoleContext(
                createActiveOrdersDescription(isClient, isProvider, isDualRole),
                createOpenApplicationsDescription(isClient, isProvider, isDualRole),
                createCompletedOrdersDescription(isClient, isProvider, isDualRole),
                createResponseTimeDescription(isClient, isProvider, isDualRole),
                createActiveOrdersTooltip(isClient, isProvider, isDualRole),
                createOpenApplicationsTooltip(isClient, isProvider, isDualRole),
                createCompletedOrdersTooltip(isClient, isProvider, isDualRole),
                createResponseTimeTooltip(isClient, isProvider, isDualRole),
                isDualRole,
                isClient,
                isProvider);
    }

    /**
     * Creates an empty context for companies with no determined roles.
     */
    public static DashboardRoleContext empty() {
        return new DashboardRoleContext(
                "Keine aktiven Aufträge",
                "Keine offenen Bewerbungen",
                "Keine abgeschlossenen Aufträge",
                "Keine Antwortzeit-Daten",
                "Noch keine Auftragsaktivität vorhanden",
                "Noch keine Bewerbungsaktivität vorhanden",
                "Noch keine abgeschlossenen Aufträge vorhanden",
                "Noch keine Antwortzeit-Daten vorhanden",
                false,
                false,
                false);
    }

    // Helper methods for creating role-specific descriptions

    private static String createActiveOrdersDescription(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Aufträge als Auftraggeber und zugewiesene Aufträge als Dienstleister";
        } else if (isClient) {
            return "Aufträge, die Sie erstellt haben und noch bearbeitet werden";
        } else if (isProvider) {
            return "Aufträge, die Ihnen zugewiesen wurden und noch bearbeitet werden";
        } else {
            return "Aktive Aufträge";
        }
    }

    private static String createOpenApplicationsDescription(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Erhaltene und gesendete Bewerbungen";
        } else if (isClient) {
            return "Bewerbungen, die Sie auf Ihre Aufträge erhalten haben";
        } else if (isProvider) {
            return "Bewerbungen, die Sie auf andere Aufträge gesendet haben";
        } else {
            return "Offene Bewerbungen";
        }
    }

    private static String createCompletedOrdersDescription(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Abgeschlossene Aufträge als Auftraggeber und Dienstleister";
        } else if (isClient) {
            return "Aufträge, die Sie erfolgreich abgeschlossen haben";
        } else if (isProvider) {
            return "Aufträge, die Sie als Dienstleister erfüllt haben";
        } else {
            return "Abgeschlossene Aufträge";
        }
    }

    private static String createResponseTimeDescription(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Durchschnittliche Antwortzeit in beiden Rollen";
        } else if (isClient) {
            return "Durchschnittliche Zeit bis zur ersten Bewerbung auf Ihre Aufträge";
        } else if (isProvider) {
            return "Durchschnittliche Zeit bis zu Ihrer Bewerbung auf Aufträge";
        } else {
            return "Durchschnittliche Antwortzeit";
        }
    }

    private static String createActiveOrdersTooltip(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Zählt sowohl Aufträge, die Sie als Auftraggeber erstellt haben (Status: VERÖFFENTLICHT, ZUGEORDNET, IN_BEARBEITUNG), "
                    +
                    "als auch Aufträge, die Ihnen als Dienstleister zugewiesen wurden (Status: IN_BEARBEITUNG).";
        } else if (isClient) {
            return "Zählt Aufträge, die Sie erstellt haben und die noch nicht abgeschlossen sind " +
                    "(Status: VERÖFFENTLICHT, ZUGEORDNET, IN_BEARBEITUNG).";
        } else if (isProvider) {
            return "Zählt Aufträge, die Ihnen zugewiesen wurden und die noch bearbeitet werden " +
                    "(Status: IN_BEARBEITUNG).";
        } else {
            return "Anzahl der derzeit aktiven Aufträge.";
        }
    }

    private static String createOpenApplicationsTooltip(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Zählt sowohl Bewerbungen, die Sie auf Ihre veröffentlichten Aufträge erhalten haben, " +
                    "als auch Bewerbungen, die Sie auf andere Aufträge gesendet haben (Status: INTERESSIERT).";
        } else if (isClient) {
            return "Zählt Bewerbungen, die Sie auf Ihre veröffentlichten Aufträge erhalten haben " +
                    "und die noch nicht bearbeitet wurden (Status: INTERESSIERT).";
        } else if (isProvider) {
            return "Zählt Bewerbungen, die Sie auf andere Aufträge gesendet haben " +
                    "und die noch nicht bearbeitet wurden (Status: INTERESSIERT).";
        } else {
            return "Anzahl der offenen Bewerbungen.";
        }
    }

    private static String createCompletedOrdersTooltip(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Zählt sowohl Aufträge, die Sie als Auftraggeber erfolgreich abgeschlossen haben, " +
                    "als auch Aufträge, die Sie als Dienstleister erfüllt haben (Status: ABGESCHLOSSEN).";
        } else if (isClient) {
            return "Zählt Aufträge, die Sie erstellt haben und die erfolgreich abgeschlossen wurden " +
                    "(Status: ABGESCHLOSSEN).";
        } else if (isProvider) {
            return "Zählt Aufträge, die Sie als Dienstleister erfüllt haben " +
                    "(Status: ABGESCHLOSSEN).";
        } else {
            return "Anzahl der abgeschlossenen Aufträge.";
        }
    }

    private static String createResponseTimeTooltip(boolean isClient, boolean isProvider, boolean isDualRole) {
        if (isDualRole) {
            return "Berechnet die durchschnittliche Antwortzeit sowohl als Auftraggeber " +
                    "(Zeit bis zur ersten Bewerbung) als auch als Dienstleister (Zeit bis zur eigenen Bewerbung).";
        } else if (isClient) {
            return "Berechnet die durchschnittliche Zeit von der Veröffentlichung Ihrer Aufträge " +
                    "bis zum Erhalt der ersten Bewerbung.";
        } else if (isProvider) {
            return "Berechnet die durchschnittliche Zeit von der Veröffentlichung eines Auftrags " +
                    "bis zu Ihrer Bewerbung darauf.";
        } else {
            return "Durchschnittliche Antwortzeit für Auftragsinteraktionen.";
        }
    }
}