import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

export const locales = ["de", "en"] as const;
export type Lang = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {

    // Get the requested locale
    const requested = await requestLocale;

    // Validate that the locale is valid
    const locale = hasLocale(locales, requested) ? requested : 'de';

    try {
        const messages = (await import(`./messages/${locale}.json`)).default;
        return {
            locale,
            messages,
            timeZone: "Europe/Berlin",
            now: new Date(),
            // Configure locale-specific formatting options
            formats: {
                dateTime: {
                    short: {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    },
                    medium: {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    },
                    long: {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                    }
                },
                number: {
                    currency: {
                        style: 'currency',
                        currency: 'EUR'
                    },
                    percent: {
                        style: 'percent'
                    }
                }
            }
        };
    } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to German messages
        const fallbackMessages = (await import(`./messages/de.json`)).default;
        return {
            locale: 'de',
            messages: fallbackMessages,
            timeZone: "Europe/Berlin",
            now: new Date(),
            // Configure locale-specific formatting options for fallback
            formats: {
                dateTime: {
                    short: {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    },
                    medium: {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    },
                    long: {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                    }
                },
                number: {
                    currency: {
                        style: 'currency',
                        currency: 'EUR'
                    },
                    percent: {
                        style: 'percent'
                    }
                }
            }
        };
    }
});