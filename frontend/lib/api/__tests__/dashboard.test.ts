/**
 * Dashboard API Service Tests
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import {
    dashboardApi,
    DashboardApiError,
    handleDashboardApiError,
    validateDashboardStatistics,
    validateOrderActivityData,
    formatDashboardStatistics,
    calculateActivitySummary,
    dashboardQueryKeys
} from '../dashboard'
import type { DashboardStatistics, OrderActivityData } from '../dashboard'

// Mock the API client
vi.mock('../client', () => ({
    apiClient: {
        get: vi.fn()
    }
}))

import { apiClient } from '../client'

describe('Dashboard API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('dashboardApi.getDashboardStatistics', () => {
        const mockStatistics: DashboardStatistics = {
            activeOrders: 5,
            openApplications: 12,
            completedOrders: 8,
            averageResponseTimeDays: 1.5,
            averageResponseTimeDisplay: '1.5 Tage'
        }

        it('should fetch dashboard statistics successfully', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ data: mockStatistics })

            const result = await dashboardApi.getDashboardStatistics()

            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/statistics')
            expect(result).toEqual(mockStatistics)
        })

        it('should handle API errors correctly', async () => {
            const mockError = new AxiosError('Network Error')
            mockError.response = {
                status: 500,
                data: { message: 'Internal Server Error' }
            } as any

            vi.mocked(apiClient.get).mockRejectedValue(mockError)

            await expect(dashboardApi.getDashboardStatistics()).rejects.toThrow(DashboardApiError)
        })

        it('should handle null response data', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ data: null })

            const result = await dashboardApi.getDashboardStatistics()

            expect(result).toBeNull()
        })
    })

    describe('dashboardApi.getOrderActivityChart', () => {
        const mockActivityData: OrderActivityData[] = [
            {
                date: '2024-01-01',
                dateDisplay: '01.01',
                auftraege: 2,
                anfragen: 5
            },
            {
                date: '2024-01-02',
                dateDisplay: '02.01',
                auftraege: 1,
                anfragen: 3
            }
        ]

        it('should fetch activity chart data successfully with default days', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ data: mockActivityData })

            const result = await dashboardApi.getOrderActivityChart()

            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/activity-chart?days=30')
            expect(result).toEqual(mockActivityData)
        })

        it('should fetch activity chart data with custom days', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ data: mockActivityData })

            const result = await dashboardApi.getOrderActivityChart(7)

            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/activity-chart?days=7')
            expect(result).toEqual(mockActivityData)
        })

        it('should validate days parameter', async () => {
            await expect(dashboardApi.getOrderActivityChart(0)).rejects.toThrow(DashboardApiError)
            await expect(dashboardApi.getOrderActivityChart(366)).rejects.toThrow(DashboardApiError)
        })

        it('should handle API errors correctly', async () => {
            const mockError = new AxiosError('Bad Request')
            mockError.response = {
                status: 400,
                data: { message: 'Invalid days parameter' }
            } as any

            vi.mocked(apiClient.get).mockRejectedValue(mockError)

            await expect(dashboardApi.getOrderActivityChart(30)).rejects.toThrow(DashboardApiError)
        })
    })

    describe('dashboardApi.getDashboardData', () => {
        const mockStatistics: DashboardStatistics = {
            activeOrders: 5,
            openApplications: 12,
            completedOrders: 8,
            averageResponseTimeDays: 1.5,
            averageResponseTimeDisplay: '1.5 Tage'
        }

        const mockActivityData: OrderActivityData[] = [
            {
                date: '2024-01-01',
                dateDisplay: '01.01',
                auftraege: 2,
                anfragen: 5
            }
        ]

        it('should fetch both statistics and activity chart data', async () => {
            vi.mocked(apiClient.get)
                .mockResolvedValueOnce({ data: mockStatistics })
                .mockResolvedValueOnce({ data: mockActivityData })

            const result = await dashboardApi.getDashboardData(7)

            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/statistics')
            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/activity-chart?days=7')
            expect(result).toEqual({
                statistics: mockStatistics,
                activityChart: mockActivityData
            })
        })

        it('should handle partial failures', async () => {
            vi.mocked(apiClient.get)
                .mockResolvedValueOnce({ data: mockStatistics })
                .mockRejectedValueOnce(new Error('Chart data failed'))

            await expect(dashboardApi.getDashboardData()).rejects.toThrow(DashboardApiError)
        })
    })

    describe('Error Handling', () => {
        describe('handleDashboardApiError', () => {
            it('should handle 400 Bad Request errors', () => {
                const axiosError = new AxiosError('Bad Request')
                axiosError.response = {
                    status: 400,
                    data: { message: 'Invalid parameter' }
                } as any

                const result = handleDashboardApiError(axiosError, 'Default message')

                expect(result).toBeInstanceOf(DashboardApiError)
                expect(result.message).toContain('Ungültige Anfrage')
                expect(result.statusCode).toBe(400)
            })

            it('should handle 401 Unauthorized errors', () => {
                const axiosError = new AxiosError('Unauthorized')
                axiosError.response = {
                    status: 401,
                    data: { message: 'Token expired' }
                } as any

                const result = handleDashboardApiError(axiosError, 'Default message')

                expect(result.message).toContain('Authentifizierung erforderlich')
                expect(result.statusCode).toBe(401)
            })

            it('should handle 403 Forbidden errors', () => {
                const axiosError = new AxiosError('Forbidden')
                axiosError.response = {
                    status: 403,
                    data: { message: 'Access denied' }
                } as any

                const result = handleDashboardApiError(axiosError, 'Default message')

                expect(result.message).toContain('Keine Berechtigung')
                expect(result.statusCode).toBe(403)
            })

            it('should handle network errors', () => {
                const axiosError = new AxiosError('Network Error')
                axiosError.code = 'NETWORK_ERROR'

                const result = handleDashboardApiError(axiosError, 'Default message')

                expect(result.message).toContain('Netzwerkfehler')
                expect(result.statusCode).toBeUndefined()
            })

            it('should handle timeout errors', () => {
                const axiosError = new AxiosError('Timeout')
                axiosError.code = 'ECONNABORTED'

                const result = handleDashboardApiError(axiosError, 'Default message')

                expect(result.message).toContain('Zeitüberschreitung')
            })

            it('should re-throw DashboardApiError instances', () => {
                const originalError = new DashboardApiError('Original error', 500)

                const result = handleDashboardApiError(originalError, 'Default message')

                expect(result).toBe(originalError)
            })

            it('should handle generic errors', () => {
                const genericError = new Error('Generic error')

                const result = handleDashboardApiError(genericError, 'Default message')

                expect(result.message).toBe('Generic error')
            })
        })
    })

    describe('Validation Functions', () => {
        describe('validateDashboardStatistics', () => {
            it('should validate correct statistics data', () => {
                const validStats: DashboardStatistics = {
                    activeOrders: 5,
                    openApplications: 12,
                    completedOrders: 8,
                    averageResponseTimeDays: 1.5,
                    averageResponseTimeDisplay: '1.5 Tage'
                }

                const result = validateDashboardStatistics(validStats)

                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it('should handle null averageResponseTimeDays', () => {
                const validStats = {
                    activeOrders: 5,
                    openApplications: 12,
                    completedOrders: 8,
                    averageResponseTimeDays: null,
                    averageResponseTimeDisplay: 'Keine Daten'
                }

                const result = validateDashboardStatistics(validStats)

                expect(result.isValid).toBe(true)
            })

            it('should reject invalid data types', () => {
                const invalidStats = {
                    activeOrders: '5', // Should be number
                    openApplications: 12,
                    completedOrders: 8,
                    averageResponseTimeDays: 1.5,
                    averageResponseTimeDisplay: '1.5 Tage'
                }

                const result = validateDashboardStatistics(invalidStats)

                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(0)
            })

            it('should reject negative numbers', () => {
                const invalidStats = {
                    activeOrders: -1,
                    openApplications: 12,
                    completedOrders: 8,
                    averageResponseTimeDays: 1.5,
                    averageResponseTimeDisplay: '1.5 Tage'
                }

                const result = validateDashboardStatistics(invalidStats)

                expect(result.isValid).toBe(false)
                expect(result.errors).toContain('activeOrders must be a non-negative number')
            })
        })

        describe('validateOrderActivityData', () => {
            it('should validate correct activity data', () => {
                const validData: OrderActivityData[] = [
                    {
                        date: '2024-01-01',
                        dateDisplay: '01.01',
                        auftraege: 2,
                        anfragen: 5
                    }
                ]

                const result = validateOrderActivityData(validData)

                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it('should reject non-array input', () => {
                const result = validateOrderActivityData('not an array')

                expect(result.isValid).toBe(false)
                expect(result.errors).toContain('Order activity data must be an array')
            })

            it('should validate individual array items', () => {
                const invalidData = [
                    {
                        date: '2024-01-01',
                        dateDisplay: '01.01',
                        auftraege: -1, // Invalid negative number
                        anfragen: 5
                    }
                ]

                const result = validateOrderActivityData(invalidData)

                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Utility Functions', () => {
        describe('formatDashboardStatistics', () => {
            it('should add computed properties', () => {
                const stats: DashboardStatistics = {
                    activeOrders: 5,
                    openApplications: 12,
                    completedOrders: 8,
                    averageResponseTimeDays: 1.5,
                    averageResponseTimeDisplay: '1.5 Tage'
                }

                const result = formatDashboardStatistics(stats)

                expect(result.hasActivity).toBe(true)
                expect(result.hasResponseTimeData).toBe(true)
                expect(result.totalOrders).toBe(13)
            })

            it('should handle zero values', () => {
                const stats: DashboardStatistics = {
                    activeOrders: 0,
                    openApplications: 0,
                    completedOrders: 0,
                    averageResponseTimeDays: null,
                    averageResponseTimeDisplay: 'Keine Daten'
                }

                const result = formatDashboardStatistics(stats)

                expect(result.hasActivity).toBe(false)
                expect(result.hasResponseTimeData).toBe(false)
                expect(result.totalOrders).toBe(0)
            })
        })

        describe('calculateActivitySummary', () => {
            it('should calculate correct summary statistics', () => {
                const activityData: OrderActivityData[] = [
                    { date: '2024-01-01', dateDisplay: '01.01', auftraege: 2, anfragen: 3 },
                    { date: '2024-01-02', dateDisplay: '02.01', auftraege: 1, anfragen: 4 },
                    { date: '2024-01-03', dateDisplay: '03.01', auftraege: 0, anfragen: 0 }
                ]

                const result = calculateActivitySummary(activityData)

                expect(result.totalAuftraege).toBe(3)
                expect(result.totalAnfragen).toBe(7)
                expect(result.totalActivity).toBe(10)
                expect(result.activeDays).toBe(2)
                expect(result.averageDaily).toBe(3.3)
                expect(result.period).toBe(3)
            })

            it('should handle empty data', () => {
                const result = calculateActivitySummary([])

                expect(result.totalAuftraege).toBe(0)
                expect(result.totalAnfragen).toBe(0)
                expect(result.totalActivity).toBe(0)
                expect(result.activeDays).toBe(0)
                expect(result.averageDaily).toBe(0)
                expect(result.period).toBe(0)
            })
        })
    })

    describe('Query Keys', () => {
        it('should generate correct query keys', () => {
            expect(dashboardQueryKeys.all).toEqual(['dashboard'])
            expect(dashboardQueryKeys.statistics()).toEqual(['dashboard', 'statistics'])
            expect(dashboardQueryKeys.activityChart(30)).toEqual(['dashboard', 'activity-chart', 30])
            expect(dashboardQueryKeys.dashboardData(7)).toEqual(['dashboard', 'dashboard-data', 7])
        })
    })
})