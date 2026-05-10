/**
 * Server-side formatting utilities
 * Provides locale-aware formatting for server components and API routes
 * 
 * @author IndusSync Frontend Team
 * @since Multi-language Support Implementation
 */

import { headers } from 'next/headers';
import { createServerFormatter } from './formatting';

/**
 * Get the current locale from request headers
 * Falls back to 'de' if no locale is found
 */
export async function getCurrentLocale(): Promise<string> {
    try {
        const headersList = await headers();
        const pathname = headersList.get('x-pathname') || '';

        // Extract locale from pathname (e.g., /en/dashboard -> en)
        const localeMatch = pathname.match(/^\/([a-z]{2})\//);
        return localeMatch ? localeMatch[1] : 'de';
    } catch {
        return 'de';
    }
}

/**
 * Create a server formatter with the current locale
 */
export async function createCurrentLocaleFormatter() {
    const locale = await getCurrentLocale();
    return createServerFormatter(locale);
}

/**
 * Server-side formatting functions that automatically use current locale
 */
export async function formatCurrencyServer(
    amount: number,
    currency: string = 'EUR',
    options?: Intl.NumberFormatOptions
): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatCurrency(amount, currency, options);
}

export async function formatNumberServer(
    value: number,
    options?: Intl.NumberFormatOptions
): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatNumber(value, options);
}

export async function formatDateServer(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatDate(date, options);
}

export async function formatDateShortServer(date: Date | string): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatDateShort(date);
}

export async function formatDateMediumServer(date: Date | string): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatDateMedium(date);
}

export async function formatTimeServer(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatTime(date, options);
}

export async function formatPercentageServer(
    value: number,
    options?: Intl.NumberFormatOptions
): Promise<string> {
    const formatter = await createCurrentLocaleFormatter();
    return formatter.formatPercentage(value, options);
}