/**
 * Tests for Dynamic Content Translation Utilities
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Internationalization Implementation
 */

import { needsTranslation, DYNAMIC_CONTENT_TRANSLATION_KEYS } from '../dynamic-content-translation';

describe('Dynamic Content Translation Utilities', () => {
    describe('needsTranslation', () => {
        it('should return true for German content', () => {
            const germanContent = 'Übersicht Ihrer laufenden Aufträge';
            expect(needsTranslation(germanContent)).toBe(true);
        });

        it('should return true for content with German indicators', () => {
            const germanContent = 'Anzahl der derzeit aktiven Aufträge';
            expect(needsTranslation(germanContent)).toBe(true);
        });

        it('should return false for English content', () => {
            const englishContent = 'Overview of your running orders';
            expect(needsTranslation(englishContent)).toBe(false);
        });

        it('should return false for undefined content', () => {
            expect(needsTranslation(undefined)).toBe(false);
        });

        it('should return false for empty content', () => {
            expect(needsTranslation('')).toBe(false);
        });
    });

    describe('DYNAMIC_CONTENT_TRANSLATION_KEYS', () => {
        it('should have all required metric types', () => {
            expect(DYNAMIC_CONTENT_TRANSLATION_KEYS).toHaveProperty('activeOrders');
            expect(DYNAMIC_CONTENT_TRANSLATION_KEYS).toHaveProperty('openApplications');
            expect(DYNAMIC_CONTENT_TRANSLATION_KEYS).toHaveProperty('completedOrders');
            expect(DYNAMIC_CONTENT_TRANSLATION_KEYS).toHaveProperty('responseTime');
        });

        it('should have description and tooltip for each metric type', () => {
            Object.keys(DYNAMIC_CONTENT_TRANSLATION_KEYS).forEach(metricType => {
                const metric = DYNAMIC_CONTENT_TRANSLATION_KEYS[metricType as keyof typeof DYNAMIC_CONTENT_TRANSLATION_KEYS];
                expect(metric).toHaveProperty('description');
                expect(metric).toHaveProperty('tooltip');
            });
        });

        it('should have role-specific keys for each content type', () => {
            Object.keys(DYNAMIC_CONTENT_TRANSLATION_KEYS).forEach(metricType => {
                const metric = DYNAMIC_CONTENT_TRANSLATION_KEYS[metricType as keyof typeof DYNAMIC_CONTENT_TRANSLATION_KEYS];

                expect(metric.description).toHaveProperty('client');
                expect(metric.description).toHaveProperty('provider');
                expect(metric.description).toHaveProperty('dual');
                expect(metric.description).toHaveProperty('default');

                expect(metric.tooltip).toHaveProperty('client');
                expect(metric.tooltip).toHaveProperty('provider');
                expect(metric.tooltip).toHaveProperty('dual');
                expect(metric.tooltip).toHaveProperty('default');

                // Verify keys don't have Dashboard prefix (since useTranslations('Dashboard') provides context)
                expect(metric.description.client).not.toMatch(/^Dashboard\./);
                expect(metric.tooltip.client).not.toMatch(/^Dashboard\./);
            });
        });
    });
});