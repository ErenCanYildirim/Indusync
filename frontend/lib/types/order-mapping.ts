/**
 * Order to Project Mapping Utilities
 * Bridges the gap between backend Order API and existing frontend Project UI
 * 
 * @author IndusSync Frontend Team  
 * @since Sprint 2 Integration
 */

import { OrderDetailResponse, OrderListResponse } from '@/lib/api/types'
import { createServerFormatter } from '@/lib/utils/formatting'

// Legacy Project interface for existing UI compatibility
export interface LegacyProject {
    id: number;
    title: string;
    status: "Aktiv" | "Entwurf" | "Auftrag vergeben" | "In Verzug" | "Abgeschlossen";
    location: string;
    startDate: string; // DD.MM.YYYY format
    endDate: string;   // DD.MM.YYYY format
    applications: number;
    description?: string;
    client?: string;
    budget?: string;
}

/**
 * Maps backend order status to frontend project status
 */
export function mapOrderStatusToProjectStatus(
    orderStatus: string
): LegacyProject['status'] {
    switch (orderStatus) {
        case 'DRAFT':
            return 'Entwurf';
        case 'PUBLISHED':
            return 'Aktiv';
        case 'CANCELLED':
            return 'In Verzug';
        case 'COMPLETED':
            return 'Abgeschlossen';
        default:
            return 'Entwurf';
    }
}

/**
 * Maps backend project status to order status
 */
export function mapProjectStatusToOrderStatus(
    projectStatus: LegacyProject['status']
): string {
    switch (projectStatus) {
        case 'Entwurf':
            return 'DRAFT';
        case 'Aktiv':
            return 'PUBLISHED';
        case 'Auftrag vergeben':
            return 'PUBLISHED'; // Treat as active/published
        case 'In Verzug':
            return 'CANCELLED';
        case 'Abgeschlossen':
            return 'COMPLETED';
        default:
            return 'DRAFT';
    }
}

/**
 * Formats ISO date with locale-aware formatting
 * @param isoDate - ISO date string to format
 * @param locale - Locale for formatting (defaults to 'de')
 */
export function formatDateLocalized(isoDate?: string, locale: string = 'de'): string {
    if (!isoDate) return '';

    try {
        const formatter = createServerFormatter(locale);
        return formatter.formatDateShort(isoDate);
    } catch {
        return '';
    }
}

/**
 * @deprecated Use formatDateLocalized instead
 * Formats ISO date to DD.MM.YYYY format (German)
 */
export function formatDateToGerman(isoDate?: string): string {
    return formatDateLocalized(isoDate, 'de');
}

/**
 * Maps OrderDetailResponse to legacy Project interface
 * @param order - Order detail response from backend
 * @param locale - Locale for formatting (defaults to 'de')
 */
export function mapOrderToProject(order: OrderDetailResponse, locale: string = 'de'): LegacyProject {
    const location = order.address ?
        `${order.address.city}${order.address.postalCode ? `, ${order.address.postalCode}` : ''}` :
        'Nicht angegeben';

    // Use deadline as both start and end date for now
    // TODO: Backend might need to provide separate start/end dates
    const formattedDate = formatDateLocalized(order.deadline, locale);

    const formatter = createServerFormatter(locale);

    // Use actual applications count from backend, with backward compatibility
    const applicationsCount = typeof order.applicationsCount === 'number'
        ? order.applicationsCount
        : (order.applications?.length || 0);

    return {
        id: parseInt(order.id) || 0,
        title: order.title,
        status: mapOrderStatusToProjectStatus(order.status),
        location,
        startDate: formattedDate,
        endDate: formattedDate,
        applications: applicationsCount,
        description: order.description,
        client: order.companyName,
        budget: order.budget ? formatter.formatCurrency(order.budget) : undefined,
    };
}

/**
 * Maps OrderListResponse to legacy Project interface  
 * @param order - Order list response from backend
 * @param locale - Locale for formatting (defaults to 'de')
 */
export function mapOrderListToProject(order: OrderListResponse, locale: string = 'de'): LegacyProject {
    const location = order.address ?
        `${order.address.city}${order.address.postalCode ? `, ${order.address.postalCode}` : ''}` :
        'Nicht angegeben';

    const formattedDate = formatDateLocalized(order.deadline, locale);
    const formatter = createServerFormatter(locale);

    // OrderListResponse doesn't include applications count for performance reasons
    // Use 0 as default - actual count is available in OrderDetailResponse
    const applicationsCount = 0;

    return {
        id: parseInt(order.id) || 0,
        title: order.title,
        status: mapOrderStatusToProjectStatus(order.status),
        location,
        startDate: formattedDate,
        endDate: formattedDate,
        applications: applicationsCount,
        description: order.description,
        client: order.companyName,
        budget: order.budget ? formatter.formatCurrency(order.budget) : undefined,
    };
}

/**
 * Maps array of orders to legacy projects
 * @param orders - Array of order list responses from backend
 * @param locale - Locale for formatting (defaults to 'de')
 */
export function mapOrdersToProjects(orders: OrderListResponse[], locale: string = 'de'): LegacyProject[] {
    return orders.map(order => mapOrderListToProject(order, locale));
} 