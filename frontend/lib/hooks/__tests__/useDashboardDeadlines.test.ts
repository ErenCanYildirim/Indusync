/**
 * Tests for useDashboardDeadlines hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardDeadlines } from '../useDashboardDeadlines'
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

describe('useDashboardDeadlines', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return empty deadlines when no data is available', async () => {
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

        const { result } = renderHook(() => useDashboardDeadlines(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.deadlines).toEqual([])
        expect(result.current.error).toBeUndefined()
    })

    it('should calculate deadlines from client orders correctly', async () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7) // 7 days from now

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
                    deadline: futureDate.toISOString(),
                    publishedAt: '2024-01-01T00:00:00Z'
                }
            ],
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true
        })

        const { result } = renderHook(() => useDashboardDeadlines(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.deadlines.length).toBeGreaterThan(0)
        expect(result.current.deadlines[0]).toMatchObject({
            orderId: '1',
            orderTitle: 'Test Order',
            deadlineType: expect.any(String),
            urgencyLevel: expect.any(String)
        })
    })
})