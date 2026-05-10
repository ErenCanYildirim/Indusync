/**
 * Orders-Project Service
 * Integrates backend Order API with existing Project-based UI components
 * 
 * @author IndusSync Frontend Team
 * @since Sprint 2 Integration
 */

import { ordersApi } from '@/lib/api/orders'
import {
    LegacyProject,
    mapOrdersToProjects,
    mapOrderToProject,
    mapProjectStatusToOrderStatus
} from '@/lib/types/order-mappings'

export type ProjectStatus = "Aktiv" | "Entwurf" | "Auftrag vergeben" | "In Verzug" | "Abgeschlossen"
export type SortKey = keyof LegacyProject | '';
export type SortDirection = "ascending" | "descending";

export interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

export interface ProjectFilters {
    searchTerm?: string;
    status?: ProjectStatus | "all";
    dateFilter?: "all" | "current" | "upcoming" | "past";
}

/**
 * Get all projects (mapped from backend orders)
 */
export const getAllProjects = async (): Promise<LegacyProject[]> => {
    try {
        const response = await ordersApi.getMyOrders({
            page: 0,
            size: 100, // Get all orders for now
            sortBy: 'createdAt',
            sortDirection: 'DESC'
        });

        return mapOrdersToProjects(response.content);
    } catch (error) {
        console.error('Failed to fetch projects from orders API:', error);
        // Fallback to empty array instead of throwing
        return [];
    }
};

/**
 * Get a project by ID (mapped from backend order)
 */
export const getProjectById = async (id: number): Promise<LegacyProject | null> => {
    try {
        const order = await ordersApi.getOrder(id.toString());
        return mapOrderToProject(order);
    } catch (error) {
        console.error(`Failed to fetch project ${id} from orders API:`, error);
        return null;
    }
};

/**
 * Helper function to parse DD.MM.YYYY to Date object
 */
export const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

/**
 * Filter and sort projects
 */
export const filterAndSortProjects = (
    projects: LegacyProject[],
    filters: ProjectFilters,
    sortConfig?: SortConfig
): LegacyProject[] => {
    let filtered = [...projects];

    // Apply search filter
    if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(project =>
            project.title.toLowerCase().includes(searchTerm) ||
            project.location.toLowerCase().includes(searchTerm) ||
            (project.description && project.description.toLowerCase().includes(searchTerm))
        );
    }

    // Apply status filter
    if (filters.status && filters.status !== "all") {
        filtered = filtered.filter(project => project.status === filters.status);
    }

    // Apply date filter
    if (filters.dateFilter && filters.dateFilter !== "all") {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        filtered = filtered.filter(project => {
            if (!project.startDate || !project.endDate) return false;

            const startDate = parseDate(project.startDate);
            const endDate = parseDate(project.endDate);

            switch (filters.dateFilter) {
                case "current":
                    return startDate <= today && endDate >= today;
                case "upcoming":
                    return startDate > today;
                case "past":
                    return endDate < today;
                default:
                    return true;
            }
        });
    }

    // Apply sorting
    if (sortConfig && sortConfig.key) {
        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof LegacyProject];
            const bValue = b[sortConfig.key as keyof LegacyProject];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            let comparison = 0;

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                // For date strings, convert to Date objects for proper sorting
                if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
                    const aDate = parseDate(aValue);
                    const bDate = parseDate(bValue);
                    comparison = aDate.getTime() - bDate.getTime();
                } else {
                    comparison = aValue.localeCompare(bValue);
                }
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }

    return filtered;
};

/**
 * Paginate projects
 */
export const paginateProjects = (
    projects: LegacyProject[],
    page: number,
    itemsPerPage: number
): LegacyProject[] => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return projects.slice(startIndex, endIndex);
};

// Re-export types for compatibility
export type { LegacyProject as Project }; 