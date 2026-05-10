/**
 * Order Management Hooks
 * Comprehensive React Query hooks for order operations
 * Aligned with backend capabilities and proper error handling
 * 
 * @author IndusSync Frontend Team
 * @since Backend Integration Rework
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ordersApi, orderQueryKeys, handleOrderApiError } from '@/lib/api/orders'
import type {
  CreateOrderRequest,
  OrderDetailResponse,
  OrderListResponse,
  OrderDocumentDto,
  PaginationParams,
  OrderStatus
} from '@/lib/api/types'

// =============================================================================
// ORDER CRUD HOOKS
// =============================================================================

/**
 * Hook for creating draft orders
 */
export function useCreateDraftOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => ordersApi.createDraft(orderData),
    onSuccess: (data) => {
      // Invalidate order lists to refresh cache
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Entwurf erfolgreich erstellt!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Erstellen des Entwurfs: ${orderError.message}`)
    }
  })
}

/**
 * Hook for publishing orders
 */
export function usePublishOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.publishOrder(orderId),
    onSuccess: (data, orderId) => {
      // Update specific order in cache
      queryClient.setQueryData(orderQueryKeys.detail(orderId), data)
      // Invalidate lists to show updated status
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Auftrag erfolgreich veröffentlicht!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Veröffentlichen: ${orderError.message}`)
    }
  })
}

/**
 * Hook for updating orders
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, orderData }: { orderId: string, orderData: Partial<CreateOrderRequest> }) =>
      ordersApi.updateOrder(orderId, orderData),
    onSuccess: (data, { orderId }) => {
      // Update specific order in cache
      queryClient.setQueryData(orderQueryKeys.detail(orderId), data)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Auftrag erfolgreich aktualisiert!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Aktualisieren: ${orderError.message}`)
    }
  })
}

/**
 * Hook for cancelling orders
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: orderQueryKeys.detail(orderId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Auftrag wurde storniert')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Stornieren: ${orderError.message}`)
    }
  })
}

// =============================================================================
// ORDER QUERY HOOKS
// =============================================================================

/**
 * Hook for fetching order details
 */
export function useOrder(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: enabled && !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (order not found)
      if (error?.response?.status === 404) return false
      return failureCount < 3
    }
  })
}

/**
 * Hook for fetching company's orders with pagination
 */
export function useMyOrders(role: 'client' | 'provider', params: PaginationParams = {}) {
  return useQuery<import("@/lib/api/types").PaginatedResponse<import("@/lib/api/types").OrderListResponse>>({
    queryKey: ['orders', 'list', role, params],
    queryFn: () => ordersApi.getMyOrders(role, params),
    keepPreviousData: true,
  })
}

/**
 * Hook for fetching company's completed orders with pagination
 */
export function useMyCompletedOrders(role: 'client' | 'provider', params: PaginationParams = {}) {
  return useQuery<import("@/lib/api/types").PaginatedResponse<import("@/lib/api/types").OrderListResponse>>({
    queryKey: ['orders', 'completed', role, params],
    queryFn: () => ordersApi.getMyCompletedOrders(role, params),
    keepPreviousData: true,
  })
}

/**
 * Hook for searching orders
 */
export function useSearchOrders(searchParams: {
  query?: string
  location?: string
  radius?: number
  category?: string
  minBudget?: number
  maxBudget?: number
  page?: number
  size?: number
}, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.search(searchParams),
    queryFn: () => ordersApi.searchOrders(searchParams),
    enabled: enabled && (searchParams.query || searchParams.location || searchParams.category),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  })
}

/**
 * Hook for fetching current deadline extension proposal (if any)
 */
export function useDeadlineExtensionProposal(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['orders', orderId, 'deadline-extension-proposal'],
    queryFn: () => ordersApi.getDeadlineExtensionProposal(orderId),
    enabled: enabled && !!orderId,
    staleTime: 1 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no proposal) or 204 (empty response)
      if (error?.response?.status === 404 || error?.response?.status === 204) return false
      return failureCount < 3
    }
  })
}

// =============================================================================
// DOCUMENT MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook for uploading order documents
 */
export function useUploadOrderDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, file, documentType, description }: {
      orderId: string
      file: File
      documentType?: string
      description?: string
    }) => ordersApi.uploadDocument(orderId, file, documentType, description),
    onSuccess: (data, { orderId }) => {
      // Invalidate documents list for this order
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.documents(orderId) })
      // Also invalidate order details to update document count
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      toast.success('Dokument erfolgreich hochgeladen!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Hochladen: ${orderError.message}`)
    }
  })
}

/**
 * Hook for fetching order documents
 */
export function useOrderDocuments(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.documents(orderId),
    queryFn: () => ordersApi.getOrderDocuments(orderId),
    enabled: enabled && !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for deleting order documents
 */
export function useDeleteOrderDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, documentId }: { orderId: string, documentId: string }) =>
      ordersApi.deleteDocument(orderId, documentId),
    onSuccess: (data, { orderId }) => {
      // Invalidate documents list to remove deleted document
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.documents(orderId) })
      // Also invalidate order details to update document count
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      toast.success('Dokument wurde gelöscht')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Löschen: ${orderError.message}`)
    }
  })
}

/**
 * Hook for downloading order documents
 */
export function useDownloadOrderDocument() {
  return useMutation({
    mutationFn: ({ orderId, documentId, fileName }: {
      orderId: string
      documentId: string
      fileName: string
    }) => ordersApi.downloadDocument(orderId, documentId),
    onSuccess: (blob, { fileName }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download gestartet')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Download fehlgeschlagen: ${orderError.message}`)
    }
  })
}

// =============================================================================
// ORDER STATUS AND VALIDATION HELPERS
// =============================================================================

export function useOrderStatus() {
  const getStatusColor = (status: OrderStatus): string => {
    const colors = {
      DRAFT: 'text-gray-600 bg-gray-100',
      PUBLISHED: 'text-blue-600 bg-blue-100',
      MATCHED: 'text-purple-600 bg-purple-100',
      IN_PROGRESS: 'text-yellow-600 bg-yellow-100',
      COMPLETED: 'text-green-600 bg-green-100',
      CANCELLED: 'text-red-600 bg-red-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  const getStatusDisplayName = (status: OrderStatus): string => {
    const displayNames = {
      DRAFT: 'Entwurf',
      PUBLISHED: 'Veröffentlicht',
      MATCHED: 'Zugeordnet',
      IN_PROGRESS: 'In Bearbeitung',
      COMPLETED: 'Abgeschlossen',
      CANCELLED: 'Storniert'
    }
    return displayNames[status] || status
  }

  const canEdit = (status: OrderStatus): boolean => {
    return status === 'DRAFT'
  }

  const canPublish = (status: OrderStatus): boolean => {
    return status === 'DRAFT'
  }

  const canCancel = (status: OrderStatus): boolean => {
    return ['DRAFT', 'PUBLISHED', 'MATCHED'].includes(status)
  }

  return {
    getStatusColor,
    getStatusDisplayName,
    canEdit,
    canPublish,
    canCancel
  }
}

/**
 * Hook for order validation helpers
 */
export function useOrderValidation() {
  const validateOrder = (orderData: Partial<CreateOrderRequest>) => {
    return ordersApi.validateOrderData(orderData as CreateOrderRequest)
  }

  return {
    validateOrder
  }
}

// =============================================================================
// ORDER MATCHING HOOKS
// =============================================================================

export function useExpressInterest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.expressInterest(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate order details to show updated interest status
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      toast.success('Interesse erfolgreich bekundet!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler: ${orderError.message}`)
    }
  })
}

export function useSelectProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, providerId }: { orderId: string, providerId: string }) =>
      ordersApi.selectProvider(orderId, providerId),
    onSuccess: (_, { orderId }) => {
      // Invalidate order details to show provider selection
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      // Invalidate order lists to reflect status change
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Dienstleister erfolgreich ausgewählt!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler bei der Auswahl: ${orderError.message}`)
    }
  })
}

/**
 * Hook for fetching interested providers for an order
 */
export function useInterestedProviders(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.interestedProviders(orderId),
    queryFn: () => ordersApi.getInterestedProviders(orderId),
    enabled: enabled && !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no interested providers)
      if (error?.response?.status === 404) return false
      return failureCount < 3
    }
  })
}

// =============================================================================
// DEADLINE EXTENSION HOOKS
// =============================================================================

export function useProposeDeadlineExtension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, newDeadlineIso }: { orderId: string; newDeadlineIso: string }) =>
      ordersApi.extendDeadline(orderId, newDeadlineIso, false),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useConfirmDeadlineExtension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, newDeadlineIso }: { orderId: string; newDeadlineIso: string }) =>
      ordersApi.extendDeadline(orderId, newDeadlineIso, true),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useRejectDeadlineExtension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, rejectionReason }: { orderId: string, rejectionReason?: string }) =>
      ordersApi.rejectDeadlineExtension(orderId, rejectionReason),
    onSuccess: (_, { orderId }) => {
      // Invalidate deadline extension proposal to show rejection
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'deadline-extension-proposal'] })
      toast.success('Deadline-Verlängerung abgelehnt')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler: ${orderError.message}`)
    }
  })
}

export function useCancelDeadlineExtensionProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelDeadlineExtensionProposal(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate deadline extension proposal to remove cancelled proposal
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'deadline-extension-proposal'] })
      toast.success('Deadline-Verlängerungsvorschlag storniert')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler: ${orderError.message}`)
    }
  })
}

// =============================================================================
// ORDER COMPLETION HOOKS
// =============================================================================

/**
 * Hook for requesting order completion
 */
export function useRequestCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, completionMessage }: { orderId: string, completionMessage?: string }) =>
      ordersApi.requestCompletion(orderId, completionMessage),
    onSuccess: (data, { orderId }) => {
      // Invalidate completion request to show new request
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.completionRequest(orderId) })
      toast.success('Abschluss beantragt!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Beantragen des Abschlusses: ${orderError.message}`)
    }
  })
}

/**
 * Hook for confirming order completion
 */
export function useConfirmCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.confirmCompletion(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate order details to show COMPLETED status
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      // Invalidate completion request
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.completionRequest(orderId) })
      // Invalidate order lists to reflect status change
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      toast.success('Auftrag erfolgreich abgeschlossen!')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Bestätigen des Abschlusses: ${orderError.message}`)
    }
  })
}

/**
 * Hook for rejecting order completion
 */
export function useRejectCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, rejectionReason }: { orderId: string, rejectionReason?: string }) =>
      ordersApi.rejectCompletion(orderId, rejectionReason),
    onSuccess: (data, { orderId }) => {
      // Invalidate completion request to show rejection
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.completionRequest(orderId) })
      toast.success('Abschluss abgelehnt')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Ablehnen des Abschlusses: ${orderError.message}`)
    }
  })
}

/**
 * Hook for cancelling completion request
 */
export function useCancelCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelCompletion(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate completion request to remove cancelled request
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.completionRequest(orderId) })
      toast.success('Abschlussantrag storniert')
    },
    onError: (error) => {
      const orderError = handleOrderApiError(error)
      toast.error(`Fehler beim Stornieren des Antrags: ${orderError.message}`)
    }
  })
}

/**
 * Hook for fetching current completion request (if any)
 */
export function useCompletionRequest(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.completionRequest(orderId),
    queryFn: () => ordersApi.getCompletionRequest(orderId),
    enabled: enabled && !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no completion request exists) or 204 (empty response)
      if (error?.response?.status === 404 || error?.response?.status === 204) return false
      return failureCount < 3
    },
    onError: (error: any) => {
      // Don't show error toast for 404 or 204 - they're expected when no completion request exists
      if (error?.response?.status !== 404 && error?.response?.status !== 204) {
        const orderError = handleOrderApiError(error)
        toast.error(`Fehler beim Laden der Abschlussanfrage: ${orderError.message}`)
      }
    }
  })
}

/**
 * Hook for fetching pending completion request (if any)
 */
export function usePendingCompletionRequest(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['orders', orderId, 'completion-request', 'pending'],
    queryFn: () => ordersApi.getPendingCompletionRequest(orderId),
    enabled: enabled && !!orderId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for live updates
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no pending completion request) or 204 (empty response)
      if (error?.response?.status === 404 || error?.response?.status === 204) return false
      return failureCount < 3
    },
    onError: (error: any) => {
      // Don't show error toast for 404 or 204 - they're expected when no pending completion request exists
      if (error?.response?.status !== 404 && error?.response?.status !== 204) {
        const orderError = handleOrderApiError(error)
        toast.error(`Fehler beim Laden der ausstehenden Abschlussanfrage: ${orderError.message}`)
      }
    }
  })
}

/**
 * Hook for fetching completion request history
 */
export function useCompletionRequestHistory(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orderQueryKeys.completionHistory(orderId),
    queryFn: () => ordersApi.getCompletionRequestHistory(orderId),
    enabled: enabled && !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no completion history)
      if (error?.response?.status === 404) return false
      return failureCount < 3
    },
    onError: (error: any) => {
      // Don't show error toast for 404 - it's expected when no completion history exists
      if (error?.response?.status !== 404) {
        const orderError = handleOrderApiError(error)
        toast.error(`Fehler beim Laden der Abschlussverlaufs: ${orderError.message}`)
      }
    }
  })
}

/**
 * Hook for checking completion authorization
 */
export function useCompletionAuthorization(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['orders', orderId, 'completion-authorization'],
    queryFn: async () => {
      const [canRequest, canConfirm, canReject, canCancel] = await Promise.all([
        ordersApi.canRequestCompletion(orderId),
        ordersApi.canConfirmCompletion(orderId),
        ordersApi.canRejectCompletion(orderId),
        ordersApi.canCancelCompletion(orderId),
      ])
      return { canRequest, canConfirm, canReject, canCancel }
    },
    enabled: enabled && !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or 403 (authorization endpoints may not exist or be forbidden)
      if (error?.response?.status === 404 || error?.response?.status === 403) return false
      return failureCount < 3
    },
    onError: (error: any) => {
      // Don't show error toast for 404 or 403 - expected for authorization checks
      if (error?.response?.status !== 404 && error?.response?.status !== 403) {
        const orderError = handleOrderApiError(error)
        toast.error(`Fehler beim Prüfen der Abschlussberechtigungen: ${orderError.message}`)
      }
    }
  })
} 