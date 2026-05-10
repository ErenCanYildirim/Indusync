import { locales, type Lang } from "@/i18n";

/**
 * Navigation utilities for lang-aware routing
 */

/**
 * Generates a lang-prefixed URL
 * @param path - The path without lang prefix (e.g., "/dashboard", "/login")
 * @param lang - The lang to prefix with
 * @returns The lang-prefixed URL (e.g., "/de/dashboard", "/en/login")
 */
export function getLangUrl(path: string, lang: Lang): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Always add lang prefix since we're using localePrefix: "always"
    return `/${lang}/${cleanPath}`;
}

/**
 * Generates a lang-prefixed URL for the current lang
 * @param path - The path without lang prefix
 * @param currentLang - The current lang
 * @returns The lang-prefixed URL
 */
export function getCurrentLangUrl(path: string, currentLang: Lang): string {
    return getLangUrl(path, currentLang);
}

/**
 * Gets the lang from a URL path
 * @param pathname - The current pathname (e.g., "/de/dashboard", "/en/login")
 * @returns The lang or null if no lang prefix found
 */
export function getLangFromPath(pathname: string): Lang | null {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
        return null;
    }

    const firstSegment = segments[0];

    // Check if the first segment is a valid lang
    if (locales.includes(firstSegment as Lang)) {
        return firstSegment as Lang;
    }

    return null;
}

/**
 * Removes lang prefix from a pathname
 * @param pathname - The pathname with lang prefix (e.g., "/de/dashboard")
 * @returns The pathname without lang prefix (e.g., "/dashboard")
 */
export function removeLangFromPath(pathname: string): string {
    const lang = getLangFromPath(pathname);

    if (!lang) {
        return pathname;
    }

    // Remove the lang segment
    const segments = pathname.split('/').filter(Boolean);
    segments.shift(); // Remove the lang segment

    return `/${segments.join('/')}`;
}

/**
 * Switches the lang in a URL
 * @param pathname - The current pathname
 * @param newLang - The new lang to switch to
 * @returns The new pathname with the updated lang
 */
export function switchLang(pathname: string, newLang: Lang): string {
    const currentLang = getLangFromPath(pathname);
    const pathWithoutLang = removeLangFromPath(pathname);

    return getLangUrl(pathWithoutLang, newLang);
}

/**
 * Common navigation paths with lang support
 */
export const paths = {
    home: (lang: Lang) => getLangUrl('', lang),
    login: (lang: Lang) => getLangUrl('login', lang),
    register: (lang: Lang) => getLangUrl('registrieren', lang),
    dashboard: (lang: Lang) => getLangUrl('dashboard', lang),
    privacy: (lang: Lang) => getLangUrl('datenschutz', lang),
    terms: (lang: Lang) => getLangUrl('agb', lang),
    specializedAreas: (lang: Lang) => getLangUrl('fachbereiche', lang),
    createOrder: (lang: Lang) => getLangUrl('auftrag-erstellen', lang),
    verifyEmail: (lang: Lang) => getLangUrl('verify-email', lang),
    resetPassword: (lang: Lang) => getLangUrl('reset-password', lang),
    forgotPassword: (lang: Lang) => getLangUrl('passwort-vergessen', lang),
    unauthorized: (lang: Lang) => getLangUrl('unauthorized', lang),
} as const;

/**
 * Type for navigation paths
 */
export type NavigationPath = keyof typeof paths; 