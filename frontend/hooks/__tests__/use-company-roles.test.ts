import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCompanyRoles } from '../use-company-roles'
import { companyRoleApi } from '@/lib/api/company-role'
import { useAuth } from '@/lib/hooks/useAuth'
import { BusinessRole, BusinessRoleUtils } from '@/lib/types/company-role-management'
import type { CompanyRoles, AvailableRolesResponse, CompanyRoleAdditionResponse } from '@/lib/types/company-role-management'

// Mock dependencies
jest.mock('@/lib/api/company-role')
jest.mock('@/lib/hooks/useAuth')
jest.mock('sonner')

const mockCompanyRoleApi = companyRoleApi as jest.Mocked<typeof companyRoleApi>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockToast = toast as jest.Mocked<typeof toast>

// Test data
const mockCompanyId = 'test-company-id'
const mockCurrentRoles: CompanyRoles = {
    isAuftraggeber: true,
    isAuftragnehmer: false
}
const mockAvailableRolesResponse: AvailableRolesResponse = {
    currentRoles: mockCurrentRoles,
    availableRoles: [BusinessRole.AUFTRAGNEHMER]
}
const mockRoleAdditionResponse: CompanyRoleAdditionResponse = {
    companyId: mockCompanyId,
    companyName: 'Test Company',
    addedRole: BusinessRole.AUFTRAGNEHMER,
    isAuftraggeber: true,
    isAuftragnehmer: true,
    addedAt: new Date().toISOString(),
    message: 'Role added successfully',
    success: true
}

// Helper to create wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    })

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
    )
}

describe('useCompanyRoles', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default auth mock
        mockUseAuth.mockReturnValue({
            user: { companyId: mockCompanyId },
            companyProfile: { id: mockCompanyId }
        } as any)

        // Default API mocks
        mockCompanyRoleApi.getAvailableRoles.mockResolvedValue(mockAvailableRolesResponse)
        mockCompanyRoleApi.getCurrentRoles.mockResolvedValue(mockCurrentRoles)
        mockCompanyRoleApi.addBusinessRole.mockResolvedValue(mockRoleAdditionResponse)
        mockCompanyRoleApi.getRoleRequirements.mockResolvedValue(
            BusinessRoleUtils.getRoleRequirements(BusinessRole.AUFTRAGNEHMER)
        )
    })

    describe('initialization', () => {
        it('should initialize with loading state', () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.currentRoles).toBeNull()
            expect(result.current.availableRoles).toEqual([])
            expect(result.current.error).toBeNull()
        })

        it('should use provided companyId over auth context', () => {
            const customCompanyId = 'custom-company-id'

            renderHook(() => useCompanyRoles(customCompanyId), {
                wrapper: createWrapper()
            })

            expect(mockCompanyRoleApi.getAvailableRoles).toHaveBeenCalledWith(customCompanyId)
        })

        it('should use auth context companyId when not provided', () => {
            renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            expect(mockCompanyRoleApi.getAvailableRoles).toHaveBeenCalledWith(mockCompanyId)
        })
    })

    describe('data fetching', () => {
        it('should fetch available roles successfully', async () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.currentRoles).toEqual(mockCurrentRoles)
            expect(result.current.availableRoles).toEqual([BusinessRole.AUFTRAGNEHMER])
            expect(result.current.error).toBeNull()
        })

        it('should handle API errors gracefully', async () => {
            const errorMessage = 'API Error'
            mockCompanyRoleApi.getAvailableRoles.mockRejectedValue(new Error(errorMessage))

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toBe(errorMessage)
            })
        })

        it('should fallback to current roles query if available roles fails', async () => {
            mockCompanyRoleApi.getAvailableRoles.mockRejectedValue(new Error('API Error'))

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(mockCompanyRoleApi.getCurrentRoles).toHaveBeenCalledWith(mockCompanyId)
            })
        })
    })

    describe('addBusinessRole', () => {
        it('should add business role successfully with optimistic updates', async () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const roleData = {
                role: BusinessRole.AUFTRAGNEHMER,
                specializations: ['Software Development'],
                industries: ['Technology'],
                workRadiusKm: 50,
                description: 'Test description',
                contactPersonName: 'John Doe',
                contactPersonEmail: 'john@example.com'
            }

            // Call addBusinessRole
            const promise = result.current.addBusinessRole(BusinessRole.AUFTRAGNEHMER, roleData)

            // Check loading state
            expect(result.current.isAddingRole).toBe(true)

            // Wait for completion
            const response = await promise

            expect(response).toEqual(mockRoleAdditionResponse)
            expect(result.current.isAddingRole).toBe(false)
            expect(mockToast.success).toHaveBeenCalledWith(
                'Auftragnehmer-Rolle erfolgreich hinzugefügt!',
                expect.any(Object)
            )
        })

        it('should handle role addition errors', async () => {
            const errorMessage = 'Role addition failed'
            mockCompanyRoleApi.addBusinessRole.mockRejectedValue(new Error(errorMessage))

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const roleData = {
                role: BusinessRole.AUFTRAGNEHMER,
                specializations: ['Software Development'],
                industries: ['Technology'],
                workRadiusKm: 50,
                description: 'Test description',
                contactPersonName: 'John Doe',
                contactPersonEmail: 'john@example.com'
            }

            await expect(
                result.current.addBusinessRole(BusinessRole.AUFTRAGNEHMER, roleData)
            ).rejects.toThrow(errorMessage)

            expect(result.current.error).toBe(errorMessage)
            expect(mockToast.error).toHaveBeenCalledWith(
                'Fehler beim Hinzufügen der Auftragnehmer-Rolle',
                expect.any(Object)
            )
        })

        it('should show verification message when required', async () => {
            const responseWithVerification = {
                ...mockRoleAdditionResponse,
                requiresVerification: true
            }
            mockCompanyRoleApi.addBusinessRole.mockResolvedValue(responseWithVerification)

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const roleData = {
                role: BusinessRole.AUFTRAGNEHMER,
                specializations: ['Software Development'],
                industries: ['Technology'],
                workRadiusKm: 50,
                description: 'Test description',
                contactPersonName: 'John Doe',
                contactPersonEmail: 'john@example.com'
            }

            await result.current.addBusinessRole(BusinessRole.AUFTRAGNEHMER, roleData)

            expect(mockToast.info).toHaveBeenCalledWith(
                'Dokumente werden geprüft',
                expect.any(Object)
            )
        })
    })

    describe('utility functions', () => {
        it('should check if role can be added', async () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.canAddRole(BusinessRole.AUFTRAGNEHMER)).toBe(true)
            expect(result.current.canAddRole(BusinessRole.AUFTRAGGEBER)).toBe(false)
        })

        it('should get role requirements', async () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const requirements = await result.current.getRoleRequirements(BusinessRole.AUFTRAGNEHMER)

            expect(requirements.role).toBe(BusinessRole.AUFTRAGNEHMER)
            expect(requirements.requiredFields).toContain('specializations')
            expect(requirements.followsRegistrationFlow).toBe(true)
        })

        it('should fallback to client-side requirements if API fails', async () => {
            mockCompanyRoleApi.getRoleRequirements.mockRejectedValue(new Error('API Error'))

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const requirements = await result.current.getRoleRequirements(BusinessRole.AUFTRAGNEHMER)

            expect(requirements.role).toBe(BusinessRole.AUFTRAGNEHMER)
            expect(requirements.requiredFields).toContain('specializations')
        })

        it('should refresh roles data', async () => {
            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            await result.current.refreshRoles()

            // Should call the API again
            expect(mockCompanyRoleApi.getAvailableRoles).toHaveBeenCalledTimes(2)
        })

        it('should clear error state', async () => {
            mockCompanyRoleApi.getAvailableRoles.mockRejectedValue(new Error('API Error'))

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.error).toBeTruthy()
            })

            result.current.clearError()

            expect(result.current.error).toBeNull()
        })
    })

    describe('edge cases', () => {
        it('should handle missing company ID', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                companyProfile: null
            } as any)

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            expect(result.current.currentRoles).toBeNull()
            expect(result.current.availableRoles).toEqual([])
        })

        it('should handle addBusinessRole without company ID', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                companyProfile: null
            } as any)

            const { result } = renderHook(() => useCompanyRoles(), {
                wrapper: createWrapper()
            })

            const roleData = {
                role: BusinessRole.AUFTRAGNEHMER,
                specializations: ['Software Development'],
                industries: ['Technology'],
                workRadiusKm: 50,
                description: 'Test description',
                contactPersonName: 'John Doe',
                contactPersonEmail: 'john@example.com'
            }

            await expect(
                result.current.addBusinessRole(BusinessRole.AUFTRAGNEHMER, roleData)
            ).rejects.toThrow('Keine Unternehmens-ID verfügbar')
        })
    })
})