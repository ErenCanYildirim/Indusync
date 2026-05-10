/**
 * Dashboard Statistics Hook Tests
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
    useDashboardStatistics,
    useSimpleDashboardStatistics,
    useDashboardStatisticsWithInterval,
    useManualDashboardStatistics
} from '../useDashboardStatistics'
import { dashboardApi, DashboardApiError } from '@/lib/api/dashboard'
import type { DashboardStatistics } from '@/lib/types/dashboard'

// Mock the dashboard API
vi.mock('@/lib/api/dashboard', () => ({
    dashboardApi: {
        getDashboardStatistics: vi.fn()
    },
    dashboardQueryKeys: {
        statistics: () => ['dashboard', 'statistics']
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
const mockStatistics: DashboardStatistics = {
    activeOrders: 5,
    openApplications: 12,
    completedOrders: 8,
    averageResponseTimeDays: 1.5,
    averageResponseTimeDisplay: '1.5 Tage'
}

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

describe('useDashboardStatistics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    describe('Basic functionality', () => {
        it('should fetch dashboard statistics successfully', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.statistics).toBeNull()

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.statistics).toEqual(mockStatistics)
            expect(result.current.error).toBeNull()
            expect(result.current.lastUpdated).toBeInstanceOf(Date)
        })

        it('should handle API errors correctly', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(apiError)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.statistics).toBeNull()
            expect(result.current.error).toBe('Server error')
        })

        it('should provide manual refresh functionality', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Clear the mock to test refresh
            vi.mocked(dashboardApi.getDashboardStatistics).mockClear()
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
                ...mockStatistics,
                activeOrders: 10
            })

            await act(async () => {
                await result.current.refresh()
            })

            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
            expect(result.current.statistics?.activeOrders).toBe(10)
        })
    })

    describe('Configuration options', () => {
        it('should respect enabled option', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            const { result } = renderHook(
                () => useDashboardStatistics({ enabled: false }),
                { wrapper: createWrapper() }
            )

            // Wait a bit to ensure no API call is made
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
            })

            expect(dashboardApi.getDashboardStatistics).not.toHaveBeenCalled()
            expect(result.current.statistics).toBeNull()
        })

        it('should show error toasts when enabled', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(apiError)

            renderHook(
                () => useDashboardStatistics({ showErrorToasts: true }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalled()
            })
        })

        it('should not show error toasts when disabled', async () => {
            const apiError = new DashboardApiError('Server error', 500)
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(apiError)

            renderHook(
                () => useDashboardStatistics({ showErrorToasts: false }),
                { wrapper: createWrapper() }
            )

            const { result } = renderHook(
                () => useDashboardStatistics({ showErrorToasts: false }),
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
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(apiError)

            renderHook(
                () => useDashboardStatistics({ onError, showErrorToasts: false }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith(apiError)
            })
        })

        it('should call custom success handler', async () => {
            const onSuccess = vi.fn()
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            renderHook(
                () => useDashboardStatistics({ onSuccess }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(mockStatistics)
            })
        })
    })

    describe('Auto-refresh functionality', () => {
        it('should auto-refresh at specified intervals', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            const { result } = renderHook(
                () => useDashboardStatistics({
                    enableAutoRefresh: true,
                    refreshIntervalMs: 1000
                }),
                { wrapper: createWrapper() }
            )

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)

            // Fast-forward time to trigger refresh
            act(() => {
                vi.advanceTimersByTime(1000)
            })

            await waitFor(() => {
                expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(2)
            })
        })

        it('should not auto-refresh when disabled', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            renderHook(
                () => useDashboardStatistics({
                    enableAutoRefresh: false,
                    refreshIntervalMs: 1000
                }),
                { wrapper: createWrapper() }
            )

            // Wait for initial load
            await waitFor(() => {
                expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
            })

            // Fast-forward time
            act(() => {
                vi.advanceTimersByTime(2000)
            })

            // Should not have made additional calls
            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
        })
    })

    describe('Stale data detection', () => {
        it('should detect stale data correctly', async () => {
            vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

            const { result } = renderHook(
                () => useDashboardStatistics({ staleTimeMs: 1000 }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isStale).toBe(false)

            // Fast-forward time to make data stale
            act(() => {
                vi.advanceTimersByTime(1500)
            })

            expect(result.current.isStale).toBe(true)
        })
    })

    describe('Error message handling', () => {
        it('should handle authentication errors', async () => {
            const authError = new DashboardApiError('Unauthorized', 401)
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(authError)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toContain('Authentifizierung erforderlich')
            })
        })

        it('should handle permission errors', async () => {
            const permissionError = new DashboardApiError('Forbidden', 403)
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(permissionError)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toContain('Keine Berechtigung')
            })
        })

        it('should handle network errors', async () => {
            const networkError = new Error('Network Error')
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(networkError)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toContain('Netzwerkfehler')
            })
        })

        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Request timeout')
            vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(timeoutError)

            const { result } = renderHook(() => useDashboardStatistics(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toContain('Zeitüberschreitung')
            })
        })
    })
})

describe('useSimpleDashboardStatistics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should provide simplified interface', async () => {
        vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

        const { result } = renderHook(() => useSimpleDashboardStatistics(), {
            wrapper: createWrapper()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.statistics).toEqual(mockStatistics)
        expect(result.current.hasData).toBe(true)
        expect(result.current.hasError).toBe(false)
        expect(typeof result.current.refresh).toBe('function')
    })

    it('should handle errors in simplified interface', async () => {
        const apiError = new DashboardApiError('Server error', 500)
        vi.mocked(dashboardApi.getDashboardStatistics).mockRejectedValue(apiError)

        const { result } = renderHook(() => useSimpleDashboardStatistics(), {
            wrapper: createWrapper()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasData).toBe(false)
        expect(result.current.hasError).toBe(true)
        expect(result.current.error).toBeTruthy()
    })
})

describe('useDashboardStatisticsWithInterval', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should use custom refresh interval', async () => {
        vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

        renderHook(() => useDashboardStatisticsWithInterval(500), {
            wrapper: createWrapper()
        })

        // Wait for initial load
        await waitFor(() => {
            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
        })

        // Fast-forward by custom interval
        act(() => {
            vi.advanceTimersByTime(500)
        })

        await waitFor(() => {
            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(2)
        })
    })
})

describe('useManualDashboardStatistics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should not auto-refresh', async () => {
        vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(mockStatistics)

        renderHook(() => useManualDashboardStatistics(), {
            wrapper: createWrapper()
        })

        // Wait for initial load
        await waitFor(() => {
            expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
        })

        // Fast-forward time
        act(() => {
            vi.advanceTimersByTime(10000)
        })

        // Should not have made additional calls
        expect(dashboardApi.getDashboardStatistics).toHaveBeenCalledTimes(1)
    })
})