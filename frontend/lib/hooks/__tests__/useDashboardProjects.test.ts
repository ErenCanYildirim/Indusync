/**
 * Tests for useDashboardProjects hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardProjects } from '../useDashboardProjects'
import { ordersApi } from '@/lib/api/orders'
import { dashboardApi } from '@/lib/api/dashboard'

// Mock the APIs
vi.mock('@/lib/api/orders')
vi.mock('@/lib/api/dashboard')

const mockOrdersApi = vi.mocked(ordersApi)
const mockDashboardApi = vi.mocked(dashboardApi)

// Test wrapper component
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
    )
}

describe('useDashboardProjects', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return empty projects when no data is available', async () => {
        mockDashboardApi.getDashboardStatistics.mockResolvedValue({
            companyRoles: [],
            activeOrders: 0,
            openApplications: 0,
            completedOrders: 0,
            averageResponseTimeDays: null,
            averageResponseTimeDisplay: 'Keine Daten',
            roleContext: {
                activeOrdersDescription: '',
                openApplicationsDescription: '',
                completedOrdersDescription: '',
                responseTimeDescription: '',
                activeOrdersTooltip: '',
                openApplicationsTooltip: '',
                completedOrdersTooltip: '',
                responseTimeTooltip: '',
                isDualRole: false,
                isClient: false,
                isProvider: false
            }
        })

        const { result } = renderHook(() => useDashboardProjects(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.projects).toEqual([])
        expect(result.current.error).toBeUndefined()
    })

    it('should fetch and transform client orders correctly', async () => {
        mockDashboardApi.getDashboardStatistics.mockResolvedValue({
            companyRoles: ['CLIENT'],
            activeOrders: 1,
            openApplications: 0,
            completedOrders: 0,
            averageResponseTimeDays: null,
            averageResponseTimeDisplay: 'Keine Daten',
            roleContext: {
                activeOrdersDescription: '',
                openApplicationsDescription: '',
                completedOrdersDescription: '',
                responseTimeDescription: '',
                activeOrdersTooltip: '',
                openApplicationsTooltip: '',
                completedOrdersTooltip: '',
                responseTimeTooltip: '',
                isDualRole: false,
                isClient: true,
                isProvider: false
            }
        })

        mockOrdersApi.getMyOrders.mockResolvedValue({
            content: [
                {
                    id: '1',
                    title: 'Test Order',
                    description: 'Test Description',
                    status: 'PUBLISHED',
                    companyId: 'company1',
                    companyName: 'Test Company',
                    createdAt: '2024-01-01T00:00:00Z',
                    deadline: '2024-12-31T23:59:59Z'
                }
            ],
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true
        })

        const { result } = renderHook(() => useDashboardProjects(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.projects).toHaveLength(1)
        expect(result.current.projects[0]).toMatchObject({
            id: '1',
            title: 'Test Order',
            description: 'Test Description',
            status: 'PUBLISHED',
            roleContext: 'client'
        })
    })
})