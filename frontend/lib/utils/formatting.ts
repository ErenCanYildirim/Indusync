/**
 * Locale-aware formatting utilities using next-intl
 * Provides consistent formatting for dates, numbers, and currencies across the application
 * 
 * @author IndusSync Frontend Team
 * @since Multi-language Support Implementation
 */

import { useFormatter, useLocale } from 'next-intl';

/**
 * Hook for locale-aware formatting utilities
 * Uses next-intl's useFormatter for consistent formatting
 */
export function useLocaleFormatting() {
    const format = useFormatter();
    const locale = useLocale();

    return {
        /**
         * Format currency amounts with proper locale support
         * @param amount - The amount to format
         * @param currency - Currency code (default: EUR)
         * @param options - Additional formatting options
         */
        formatCurrency: (
            amount: number,
            currency: string = 'EUR',
            options?: any
        ) => {
            return format.number(amount, {
                style: 'currency',
                currency,
                ...options
            } as any);
        },

        /**
         * Format numbers with locale-specific separators
         * @param value - The number to format
         * @param options - Additional formatting options
         */
        formatNumber: (
            value: number,
            options?: any
        ) => {
            return format.number(value, options);
        },

        /**
         * Format dates with locale-specific formatting
         * @param date - The date to format
         * @param options - Date formatting options
         */
        formatDate: (
            date: Date | string,
            options?: any
        ) => {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return format.dateTime(dateObj, options);
        },

        /**
         * Format date to short format (DD.MM.YYYY for German, MM/DD/YYYY for English)
         * @param date - The date to format
         */
        formatDateShort: (date: Date | string) => {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return format.dateTime(dateObj, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            } as any);
        },

        /**
         * Format date to medium format with month names
         * @param date - The date to format
         */
        formatDateMedium: (date: Date | string) => {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return format.dateTime(dateObj, {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            } as any);
        },

        /**
         * Format time with locale-specific formatting
         * @param date - The date/time to format
         * @param options - Time formatting options
         */
        formatTime: (
            date: Date | string,
            options?: any
        ) => {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return format.dateTime(dateObj, {
                hour: '2-digit',
                minute: '2-digit',
                ...options
            } as any);
        },

        /**
         * Format relative time (e.g., "2 days ago", "in 3 hours")
         * @param date - The date to compare
         * @param options - Relative time formatting options
         */
        formatRelativeTime: (
            date: Date | string,
            options?: any
        ) => {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return format.relativeTime(dateObj, options);
        },

        /**
         * Format percentage with locale-specific formatting
         * @param value - The value to format as percentage (0.1 = 10%)
         * @param options - Additional formatting options
         */
        formatPercentage: (
            value: number,
            options?: any
        ) => {
            return format.number(value, {
                style: 'percent',
                ...options
            } as any);
        },

        /**
         * Get current locale
         */
        locale,

        /**
         * Get timezone from configuration
         */
        timeZone: 'Europe/Berlin'
    };
}

/**
 * Server-side formatting utilities for use in server components
 * These functions don't use hooks and can be used in server-side contexts
 */
export class ServerFormatter {
    private locale: string;
    private timeZone: string;

    constructor(locale: string = 'de', timeZone: string = 'Europe/Berlin') {
        this.locale = locale;
        this.timeZone = timeZone;
    }

    /**
     * Format currency amounts with proper locale support
     */
    formatCurrency(
        amount: number,
        currency: string = 'EUR',
        options?: Intl.NumberFormatOptions
    ): string {
        return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency,
            ...options
        }).format(amount);
    }

    /**
     * Format numbers with locale-specific separators
     */
    formatNumber(
        value: number,
        options?: Intl.NumberFormatOptions
    ): string {
        return new Intl.NumberFormat(this.locale, options).format(value);
    }

    /**
     * Format dates with locale-specific formatting
     */
    formatDate(
        date: Date | string,
        options?: Intl.DateTimeFormatOptions
    ): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.locale, {
            timeZone: this.timeZone,
            ...options
        }).format(dateObj);
    }

    /**
     * Format date to short format
     */
    formatDateShort(date: Date | string): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: this.timeZone
        }).format(dateObj);
    }

    /**
     * Format date to medium format with month names
     */
    formatDateMedium(date: Date | string): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: this.timeZone
        }).format(dateObj);
    }

    /**
     * Format time with locale-specific formatting
     */
    formatTime(
        date: Date | string,
        options?: Intl.DateTimeFormatOptions
    ): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.locale, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: this.timeZone,
            ...options
        }).format(dateObj);
    }

    /**
     * Format percentage with locale-specific formatting
     */
    formatPercentage(
        value: number,
        options?: Intl.NumberFormatOptions
    ): string {
        return new Intl.NumberFormat(this.locale, {
            style: 'percent',
            ...options
        }).format(value);
    }
}

/**
 * Utility function to create a server formatter instance
 */
export function createServerFormatter(locale: string = 'de', timeZone: string = 'Europe/Berlin') {
    return new ServerFormatter(locale, timeZone);
}