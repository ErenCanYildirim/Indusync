/**
 * Order Activity Chart Hook Tests
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
    useOrderActivityChart,
    useSimpleOrderActivityChart,
    useOrderActivityChartWithInterval,
    useManualOrderActivityChart,
    useOrderActivityChartWithSkeleton
} from '../use-order-activity-chart'
import { dashboardApi, DashboardApiError } from '@/lib/api/dashboard'
import type { OrderActivityData } from '@/lib/types/dashboard'

// Mock the dashboard API
vi.mock('@/lib/api/dashboard', () => ({
    dashboardApi: {
        getOrderActivityChart: vi.fn()
    },
    dashboardQueryKeys: {
        activityChart: (days: number) => ['dashboard', 'activity-chart', days]
    },
    DashboardApiError: class extends Error {
        constructor(message: string, public statusCode?: number) {
            super(message)
            this.name = 'DashboardApiError'
        }
    }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

import { toast } from 'sonner'

// Test data
const mockActivityData: OrderActivityData[] = [
    {
        date: '2024-01-01',
        dateDisplay: '01.01',
        auftraege: 5,
        anfragen: 3
    },
    {
        date: '2024-01-02',
        dateDisplay: '02.01',
        auftraege: 7,
        anfragen: 4
    },
    {
        date: '2024-01-03',
        dateDisplay: '03.01',
        auftraege: 3,
        anfragen: 6
    }
]

// Test wrapper component
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0
            }
        }
    })

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
    )
}

describe('useOrderActivityChart', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    describe('Basic functionality', () => {
        it('should fetch order activity chart data successfully', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(() => useOrderActivityChart(), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.activityChart).toBeNull()

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.activityChart).toHaveLength(3)
            expect(result.current.activityChart?.[0]).toMatchObject({
                name: '01.01', // Transformed for chart compatibility
                date: '2024-01-01',
                dateDisplay: '01.01',
                auftraege: 5,
                anfragen: 3
            })
            expect(result.current.error).toBeNull()
            expect(result.current.lastUpdated).toBeInstanceOf(Date)
            expect(result.current.days).toBe(30) // Default value
        })

        it('should handle API errors correctly', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getOrderActivityChart).mockRejectedValue(apiError)

            const { result } = renderHook(() => useOrderActivityChart(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.activityChart).toBeNull()
            expect(result.current.error).toBe('Server error')
        })

        it('should provide manual refresh functionality', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(() => useOrderActivityChart(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Clear the mock to test refresh
            vi.mocked(dashboardApi.getOrderActivityChart).mockClear()
            const updatedData = [...mockActivityData, {
                date: '2024-01-04',
                dateDisplay: '04.01',
                auftraege: 2,
                anfragen: 1
            }]
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(updatedData)

            await act(async () => {
                await result.current.refresh()
            })

            expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(1)
            expect(result.current.activityChart).toHaveLength(4)
        })

        it('should handle days parameter changes', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(() => useOrderActivityChart({ initialDays: 7 }), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.days).toBe(7)
            expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledWith(7)

            // Change days parameter
            act(() => {
                result.current.setDays(14)
            })

            expect(result.current.days).toBe(14)
        })

        it('should validate days parameter bounds', async () => {
            const { result } = renderHook(() => useOrderActivityChart({ initialDays: 500 }), {
                wrapper: createWrapper()
            })

            expect(result.current.days).toBe(365) // Max value

            act(() => {
                result.current.setDays(-5)
            })

            expect(result.current.days).toBe(1) // Min value
        })
    })

    describe('Configuration options', () => {
        it('should respect enabled option', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(
                () => useOrderActivityChart({ enabled: false }),
                { wrapper: createWrapper() }
            )

            // Wait a bit to ensure no API call is made
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
            })

            expect(dashboardApi.getOrderActivityChart).not.toHaveBeenCalled()
            expect(result.current.activityChart).toBeNull()
        })

        it('should show error toasts when enabled', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getOrderActivityChart).mockRejectedValue(apiError)

            renderHook(
                () => useOrderActivityChart({ showErrorToasts: true }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Aktivitätsdiagramm'))
            })
        })

        it('should not show error toasts when disabled', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getOrderActivityChart).mockRejectedValue(apiError)

            const { result } = renderHook(
                () => useOrderActivityChart({ showErrorToasts: false }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(toast.error).not.toHaveBeenCalled()
        })

        it('should call custom error handler', async () => {
            const onError = vi.fn()
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getOrderActivityChart).mockRejectedValue(apiError)

            renderHook(
                () => useOrderActivityChart({ onError, showErrorToasts: false }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith(apiError)
            })
        })

        it('should call custom success handler', async () => {
            const onSuccess = vi.fn()
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            renderHook(
                () => useOrderActivityChart({ onSuccess }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(mockActivityData)
            })
        })

        it('should disable retry when enableRetry is false', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getOrderActivityChart).mockRejectedValue(apiError)

            renderHook(
                () => useOrderActivityChart({ enableRetry: false, showErrorToasts: false }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('Auto-refresh functionality', () => {
        it('should auto-refresh at specified intervals', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(
                () => useOrderActivityChart({
                    enableAutoRefresh: true,
                    refreshIntervalMs: 1000
                }),
                { wrapper: createWrapper() }
            )

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(1)

            // Fast-forward time to trigger refresh
            act(() => {
                vi.advanceTimersByTime(1000)
            })

            await waitFor(() => {
                expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(2)
            })
        })

        it('should not auto-refresh when disabled', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            renderHook(
                () => useOrderActivityChart({
                    enableAutoRefresh: false,
                    refreshIntervalMs: 1000
                }),
                { wrapper: createWrapper() }
            )

            // Wait for initial load
            await waitFor(() => {
                expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(1)
            })

            // Fast-forward time
            act(() => {
                vi.advanceTimersByTime(2000)
            })

            // Should not have made additional calls
            expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledTimes(1)
        })
    })

    describe('Data transformation', () => {
        it('should transform data for chart component compatibility', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

            const { result } = renderHook(() => useOrderActivityChart(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const transformedData = result.current.activityChart
            expect(transformedData).toHaveLength(3)
            expect(transformedData?.[0]).toHaveProperty('name', '01.01')
            expect(transformedData?.[0]).toHaveProperty('date', '2024-01-01')
            expect(transformedData?.[0]).toHaveProperty('dateDisplay', '01.01')
            expect(transformedData?.[0]).toHaveProperty('auftraege', 5)
            expect(transformedData?.[0]).toHaveProperty('anfragen', 3)
        })

        it('should handle empty data gracefully', async () => {
            vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue([])

            const { result } = renderHook(() => useOrderActivityChart(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.activityChart).toEqual([])
        })
    })
})

describe('useSimpleOrderActivityChart', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should provide simplified interface', async () => {
        vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue(mockActivityData)

        const { result } = renderHook(() => useSimpleOrderActivityChart(7), {
            wrapper: createWrapper()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.activityChart).toHaveLength(3)
        expect(result.current.hasData).toBe(true)
        expect(result.current.hasError).toBe(false)
        expect(typeof result.current.refresh).toBe('function')
        expect(dashboardApi.getOrderActivityChart).toHaveBeenCalledWith(7)
    })

    it('should handle empty data correctly', async () => {
        vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue([])

        const { result } = renderHook(() => useSimpleOrderActivityChart(), {
            wrapper: createWrapper()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasData).toBe(false)
        expect(result.current.hasError).toBe(false)
        expect(result.current.activityChart).toEqual([])
    })
})

describe('useOrderActivityChartWithSkeleton', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should provide skeleton-specific loading states', async () => {
        vi.mocked(dashboardApi.getOrderActivityChart).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockActivityData), 100))
        )

        const { result } = renderHook(() => useOrderActivityChartWithSkeleton(), {
            wrapper: createWrapper()
        })

        // Initial loading state
        expect(result.current.showSkeleton).toBe(true)
        expect(result.current.showRefreshIndicator).toBe(false)
        expect(result.current.isEmpty).toBe(false)
        expect(result.current.hasPartialData).toBe(false)

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // After data loads
        expect(result.current.showSkeleton).toBe(false)
        expect(result.current.showRefreshIndicator).toBe(false)
        expect(result.current.isEmpty).toBe(false)
        expect(result.current.hasPartialData).toBe(true)
    })

    it('should handle empty data state', async () => {
        vi.mocked(dashboardApi.getOrderActivityChart).mockResolvedValue([])

        const { result } = renderHook(() => useOrderActivityChartWithSkeleton(), {
            wrapper: createWrapper()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.showSkeleton).toBe(false)
        expect(result.current.isEmpty).toBe(true)
        expect(result.current.hasPartialData).toBe(false)
    })
})