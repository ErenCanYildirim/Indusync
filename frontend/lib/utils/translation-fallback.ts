/**
 * Translation Fallback Utilities
 * 
 * Provides graceful fallback mechanisms for missing translation keys,
 * ensuring the dashboard continues to function even when translations fail.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Internationalization Implementation
 */

import { useTranslations, useLocale } from 'next-intl';
import { useCallback } from 'react';

/**
 * Translation fallback configuration
 */
export interface TranslationFallbackConfig {
    /** Primary translation namespace */
    namespace: string;
    /** Fallback to German when translation is missing */
    fallbackToGerman: boolean;
    /** Log missing translation keys in development */
    logMissingKeys: boolean;
    /** Default fallback text when all translations fail */
    ultimateFallback?: string;
}

/**
 * Default configuration for dashboard translations
 */
export const DEFAULT_DASHBOARD_FALLBACK_CONFIG: TranslationFallbackConfig = {
    namespace: 'Dashboard',
    fallbackToGerman: true,
    logMissingKeys: process.env.NODE_ENV === 'development',
    ultimateFallback: undefined
};

/**
 * Hardcoded fallback translations for critical dashboard elements
 * Used when the translation system completely fails
 */
export const CRITICAL_DASHBOARD_FALLBACKS = {
    de: {
        'title': 'Dashboard',
        'welcome': 'Willkommen zurück! Hier finden Sie eine Übersicht Ihrer Aktivitäten.',
        'states.loading': 'Laden...',
        'states.error': 'Fehler aufgetreten',
        'states.noData': 'Keine Daten',
        'actions.retry': 'Wiederholen',
        'actions.viewAll': 'Alle anzeigen',
        'metrics.activeOrders.title': 'Aktive Aufträge',
        'metrics.openApplications.title': 'Offene Bewerbungen',
        'metrics.completedOrders.title': 'Abgeschlossene Aufträge',
        'metrics.averageResponseTime.title': 'Durchschn. Antwortzeit',
        'sections.currentProjects.title': 'Aktuelle Projekte',
        'sections.upcomingDeadlines.title': 'Anstehende Termine',
        'sections.orderActivity.title': 'Auftragsaktivität',
        'roleContext.title': 'Ihre Unternehmensrolle',
        'roleContext.determining': 'Rolle wird ermittelt...',
        'periods.currentStatus': 'aktueller Stand',
        'periods.total': 'gesamt',
        'periods.average': 'durchschnittlich',
        'trends.fast': 'Schnell',
        'trends.normal': 'Normal',
        'trends.slow': 'Langsam'
    },
    en: {
        'title': 'Dashboard',
        'welcome': 'Welcome back! Here you\'ll find an overview of your activities.',
        'states.loading': 'Loading...',
        'states.error': 'Error occurred',
        'states.noData': 'No Data',
        'actions.retry': 'Retry',
        'actions.viewAll': 'View All',
        'metrics.activeOrders.title': 'Active Orders',
        'metrics.openApplications.title': 'Open Applications',
        'metrics.completedOrders.title': 'Completed Orders',
        'metrics.averageResponseTime.title': 'Avg. Response Time',
        'sections.currentProjects.title': 'Current Projects',
        'sections.upcomingDeadlines.title': 'Upcoming Deadlines',
        'sections.orderActivity.title': 'Order Activity',
        'roleContext.title': 'Your Company Role',
        'roleContext.determining': 'Role is being determined...',
        'periods.currentStatus': 'current status',
        'periods.total': 'total',
        'periods.average': 'average',
        'trends.fast': 'Fast',
        'trends.normal': 'Normal',
        'trends.slow': 'Slow'
    }
} as const;

/**
 * Hook for safe translation with comprehensive fallback mechanisms
 * 
 * This hook provides a translation function that gracefully handles:
 * - Missing translation keys
 * - Translation system failures
 * - Language switching during component lifecycle
 * - Fallback to German when English translations are missing
 * - Ultimate fallback to hardcoded strings
 */
export function useSafeTranslations(
    namespace: string = 'Dashboard',
    config: Partial<TranslationFallbackConfig> = {}
) {
    const fullConfig = { ...DEFAULT_DASHBOARD_FALLBACK_CONFIG, ...config, namespace };
    const locale = useLocale();

    let t: any;
    let tGerman: any;
    let translationSystemWorking = true;

    try {
        t = useTranslations(namespace);
        // Also get German translations for fallback
        if (fullConfig.fallbackToGerman && locale !== 'de') {
            // Note: This is a simplified approach. In a real implementation,
            // you might need to use a different method to get German translations
            // when the current locale is not German.
        }
    } catch (error) {
        translationSystemWorking = false;
        if (fullConfig.logMissingKeys) {
            console.warn(`Translation system failed for namespace "${namespace}":`, error);
        }
    }

    /**
     * Safe translation function with multiple fallback levels
     */
    const safeT = useCallback((
        key: string,
        fallbackText?: string,
        options?: any
    ): string => {
        // Level 1: Try primary translation
        if (translationSystemWorking && t) {
            try {
                const translated = t(key, options);
                if (translated && translated !== key && typeof translated === 'string') {
                    return translated;
                }
            } catch (error) {
                if (fullConfig.logMissingKeys) {
                    console.warn(`Translation failed for key "${key}" in namespace "${namespace}":`, error);
                }
            }
        }

        // Level 2: Try German fallback (if enabled and current locale is not German)
        if (fullConfig.fallbackToGerman && locale !== 'de') {
            const germanFallback = CRITICAL_DASHBOARD_FALLBACKS.de[key as keyof typeof CRITICAL_DASHBOARD_FALLBACKS.de];
            if (germanFallback) {
                if (fullConfig.logMissingKeys) {
                    console.warn(`Using German fallback for missing translation key: "${key}"`);
                }
                return germanFallback;
            }
        }

        // Level 3: Try hardcoded fallback for current locale
        const currentLocaleFallbacks = CRITICAL_DASHBOARD_FALLBACKS[locale as keyof typeof CRITICAL_DASHBOARD_FALLBACKS];
        if (currentLocaleFallbacks) {
            const hardcodedFallback = currentLocaleFallbacks[key as keyof typeof currentLocaleFallbacks];
            if (hardcodedFallback) {
                if (fullConfig.logMissingKeys) {
                    console.warn(`Using hardcoded ${locale} fallback for missing translation key: "${key}"`);
                }
                return hardcodedFallback;
            }
        }

        // Level 4: Try provided fallback text
        if (fallbackText) {
            if (fullConfig.logMissingKeys) {
                console.warn(`Using provided fallback text for missing translation key: "${key}"`);
            }
            return fallbackText;
        }

        // Level 5: Try ultimate fallback from config
        if (fullConfig.ultimateFallback) {
            if (fullConfig.logMissingKeys) {
                console.warn(`Using ultimate fallback for missing translation key: "${key}"`);
            }
            return fullConfig.ultimateFallback;
        }

        // Level 6: Return the key itself as last resort
        if (fullConfig.logMissingKeys) {
            console.error(`No fallback available for translation key: "${key}"`);
        }
        return key;
    }, [t, locale, translationSystemWorking, fullConfig]);

    /**
     * Check if a translation key exists
     */
    const hasTranslation = useCallback((key: string): boolean => {
        if (!translationSystemWorking || !t) return false;

        try {
            const translated = t(key);
            return translated && translated !== key && typeof translated === 'string';
        } catch {
            return false;
        }
    }, [t, translationSystemWorking]);

    /**
     * Get translation with rich fallback information
     */
    const getTranslationInfo = useCallback((key: string) => {
        const translation = safeT(key);
        const exists = hasTranslation(key);
        const isHardcodedFallback = !exists && CRITICAL_DASHBOARD_FALLBACKS[locale as keyof typeof CRITICAL_DASHBOARD_FALLBACKS]?.[key as any];

        return {
            translation,
            exists,
            isHardcodedFallback,
            isFallback: !exists,
            key
        };
    }, [safeT, hasTranslation, locale]);

    return {
        t: safeT,
        hasTranslation,
        getTranslationInfo,
        translationSystemWorking,
        locale,
        namespace
    };
}

/**
 * Utility function to validate translation completeness
 * Useful for testing and development
 */
export function validateDashboardTranslations(locale: string = 'en'): {
    missingKeys: string[];
    totalKeys: number;
    coverage: number;
} {
    const requiredKeys = Object.keys(CRITICAL_DASHBOARD_FALLBACKS.de);
    const missingKeys: string[] = [];

    // This is a simplified validation - in a real implementation,
    // you would check against the actual translation files
    requiredKeys.forEach(key => {
        const fallbacks = CRITICAL_DASHBOARD_FALLBACKS[locale as keyof typeof CRITICAL_DASHBOARD_FALLBACKS];
        if (!fallbacks || !fallbacks[key as keyof typeof fallbacks]) {
            missingKeys.push(key);
        }
    });

    const coverage = ((requiredKeys.length - missingKeys.length) / requiredKeys.length) * 100;

    return {
        missingKeys,
        totalKeys: requiredKeys.length,
        coverage
    };
}

/**
 * Development helper to log all translation attempts
 */
export function createTranslationLogger(namespace: string) {
    if (process.env.NODE_ENV !== 'development') {
        return () => { };
    }

    const translationAttempts = new Map<string, { attempts: number; lastAttempt: Date; success: boolean }>();

    return (key: string, success: boolean) => {
        const existing = translationAttempts.get(key) || { attempts: 0, lastAttempt: new Date(), success: false };
        translationAttempts.set(key, {
            attempts: existing.attempts + 1,
            lastAttempt: new Date(),
            success
        });

        if (!success) {
            console.warn(`Translation attempt failed for "${namespace}.${key}" (attempt #${existing.attempts + 1})`);
        }

        // Log summary every 50 attempts
        if (translationAttempts.size % 50 === 0) {
            const failed = Array.from(translationAttempts.entries()).filter(([, info]) => !info.success);
            console.log(`Translation Summary for ${namespace}: ${failed.length}/${translationAttempts.size} keys failed`);
        }
    };
}

export default useSafeTranslations;