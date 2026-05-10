/**
 * Dynamic Content Translation Utilities
 * 
 * Utilities for translating dynamic content from the backend, including
 * role-specific metric descriptions and tooltips that may come from the server
 * in a specific language and need to be translated to the user's selected language.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Internationalization Implementation
 */

import { useTranslations } from 'next-intl';

/**
 * Interface for dynamic content that may need translation
 */
export interface DynamicContent {
    description?: string;
    tooltip?: string;
}

/**
 * Interface for role context dynamic content
 */
export interface RoleContextDynamicContent {
    activeOrdersDescription?: string;
    openApplicationsDescription?: string;
    completedOrdersDescription?: string;
    responseTimeDescription?: string;
    activeOrdersTooltip?: string;
    openApplicationsTooltip?: string;
    completedOrdersTooltip?: string;
    responseTimeTooltip?: string;
}

/**
 * Translation keys for dynamic content fallbacks
 */
export const DYNAMIC_CONTENT_TRANSLATION_KEYS = {
    // Active Orders
    activeOrders: {
        description: {
            client: 'dynamicContent.activeOrders.description.client',
            provider: 'dynamicContent.activeOrders.description.provider',
            dual: 'dynamicContent.activeOrders.description.dual',
            default: 'metrics.activeOrders.description'
        },
        tooltip: {
            client: 'dynamicContent.activeOrders.tooltip.client',
            provider: 'dynamicContent.activeOrders.tooltip.provider',
            dual: 'dynamicContent.activeOrders.tooltip.dual',
            default: 'metrics.activeOrders.tooltip'
        }
    },
    // Open Applications
    openApplications: {
        description: {
            client: 'dynamicContent.openApplications.description.client',
            provider: 'dynamicContent.openApplications.description.provider',
            dual: 'dynamicContent.openApplications.description.dual',
            default: 'metrics.openApplications.description'
        },
        tooltip: {
            client: 'dynamicContent.openApplications.tooltip.client',
            provider: 'dynamicContent.openApplications.tooltip.provider',
            dual: 'dynamicContent.openApplications.tooltip.dual',
            default: 'metrics.openApplications.tooltip'
        }
    },
    // Completed Orders
    completedOrders: {
        description: {
            client: 'dynamicContent.completedOrders.description.client',
            provider: 'dynamicContent.completedOrders.description.provider',
            dual: 'dynamicContent.completedOrders.description.dual',
            default: 'metrics.completedOrders.description'
        },
        tooltip: {
            client: 'dynamicContent.completedOrders.tooltip.client',
            provider: 'dynamicContent.completedOrders.tooltip.provider',
            dual: 'dynamicContent.completedOrders.tooltip.dual',
            default: 'metrics.completedOrders.tooltip'
        }
    },
    // Response Time
    responseTime: {
        description: {
            client: 'dynamicContent.responseTime.description.client',
            provider: 'dynamicContent.responseTime.description.provider',
            dual: 'dynamicContent.responseTime.description.dual',
            default: 'metrics.averageResponseTime.description'
        },
        tooltip: {
            client: 'dynamicContent.responseTime.tooltip.client',
            provider: 'dynamicContent.responseTime.tooltip.provider',
            dual: 'dynamicContent.responseTime.tooltip.dual',
            default: 'metrics.averageResponseTime.tooltip'
        }
    }
} as const;

/**
 * Hook for translating dynamic content based on role context
 * 
 * This hook provides utilities for translating dynamic content that comes from
 * the backend, with fallback to static translation keys based on user roles.
 */
export const useDynamicContentTranslation = () => {
    const t = useTranslations('Dashboard');

    /**
     * Translates dynamic content with role-aware fallbacks
     * 
     * @param content - The dynamic content from backend (may be in German)
     * @param metricType - The type of metric (activeOrders, openApplications, etc.)
     * @param contentType - The type of content (description or tooltip)
     * @param roleContext - The role context for determining appropriate fallback
     * @returns Translated content string
     */
    const translateDynamicContent = (
        content: string | undefined,
        metricType: keyof typeof DYNAMIC_CONTENT_TRANSLATION_KEYS,
        contentType: 'description' | 'tooltip',
        roleContext?: {
            isDualRole?: boolean;
            isClient?: boolean;
            isProvider?: boolean;
        }
    ): string => {
        // If backend provides localized content and it's not in German, use it directly
        // This handles cases where backend might provide content in user's language in the future
        if (content && !isGermanContent(content)) {
            return content;
        }

        // Determine role-specific translation key
        const translationKeys = DYNAMIC_CONTENT_TRANSLATION_KEYS[metricType][contentType];
        let translationKey: string;

        if (roleContext?.isDualRole) {
            translationKey = translationKeys.dual;
        } else if (roleContext?.isClient) {
            translationKey = translationKeys.client;
        } else if (roleContext?.isProvider) {
            translationKey = translationKeys.provider;
        } else {
            translationKey = translationKeys.default;
        }

        // Try to get the role-specific translation
        try {
            const translatedContent = t(translationKey as any);
            // If translation exists and is not the key itself, use it
            if (translatedContent && translatedContent !== translationKey) {
                return translatedContent;
            }
        } catch (error) {
            // Translation key doesn't exist, fall back to default
        }

        // Fall back to default translation
        try {
            const defaultTranslation = t(translationKeys.default as any);
            if (defaultTranslation && defaultTranslation !== translationKeys.default) {
                return defaultTranslation;
            }
        } catch (error) {
            // Default translation doesn't exist either
        }

        // Ultimate fallback: use backend content or empty string
        return content || '';
    };

    /**
     * Translates all dynamic content for a role context
     * 
     * @param roleContextContent - Dynamic content from backend role context
     * @param roleContext - Role context information
     * @returns Object with all translated dynamic content
     */
    const translateRoleContextContent = (
        roleContextContent: RoleContextDynamicContent,
        roleContext?: {
            isDualRole?: boolean;
            isClient?: boolean;
            isProvider?: boolean;
        }
    ) => {
        return {
            activeOrdersDescription: translateDynamicContent(
                roleContextContent.activeOrdersDescription,
                'activeOrders',
                'description',
                roleContext
            ),
            openApplicationsDescription: translateDynamicContent(
                roleContextContent.openApplicationsDescription,
                'openApplications',
                'description',
                roleContext
            ),
            completedOrdersDescription: translateDynamicContent(
                roleContextContent.completedOrdersDescription,
                'completedOrders',
                'description',
                roleContext
            ),
            responseTimeDescription: translateDynamicContent(
                roleContextContent.responseTimeDescription,
                'responseTime',
                'description',
                roleContext
            ),
            activeOrdersTooltip: translateDynamicContent(
                roleContextContent.activeOrdersTooltip,
                'activeOrders',
                'tooltip',
                roleContext
            ),
            openApplicationsTooltip: translateDynamicContent(
                roleContextContent.openApplicationsTooltip,
                'openApplications',
                'tooltip',
                roleContext
            ),
            completedOrdersTooltip: translateDynamicContent(
                roleContextContent.completedOrdersTooltip,
                'completedOrders',
                'tooltip',
                roleContext
            ),
            responseTimeTooltip: translateDynamicContent(
                roleContextContent.responseTimeTooltip,
                'responseTime',
                'tooltip',
                roleContext
            ),
        };
    };

    return {
        translateDynamicContent,
        translateRoleContextContent,
    };
};

/**
 * Utility function to detect if content is in German
 * 
 * This is a simple heuristic to detect German content. In a production
 * environment, you might want to use a more sophisticated language detection
 * library or rely on backend language indicators.
 * 
 * @param content - Content to check
 * @returns True if content appears to be in German
 */
function isGermanContent(content: string): boolean {
    // Simple heuristic: check for common German words/patterns
    const germanIndicators = [
        'Übersicht',
        'Aufträge',
        'Bewerbungen',
        'abgeschlossen',
        'durchschnittlich',
        'Antwortzeit',
        'laufend',
        'eingegangen',
        'erfolgreich',
        'Reaktionszeit',
        'derzeit',
        'Anzahl',
        'Zeit bis zur',
        'ersten Antwort'
    ];

    const lowerContent = content.toLowerCase();
    return germanIndicators.some(indicator =>
        lowerContent.includes(indicator.toLowerCase())
    );
}

/**
 * Type guard to check if content needs translation
 * 
 * @param content - Content to check
 * @returns True if content needs translation
 */
export function needsTranslation(content: string | undefined): content is string {
    return !!content && isGermanContent(content);
}

/**
 * Default export for convenience
 */
export default useDynamicContentTranslation;