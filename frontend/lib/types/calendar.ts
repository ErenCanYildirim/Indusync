/**
 * Calendar-related types
 * TypeScript interfaces for calendar functionality
 * 
 * @author IndusSync Frontend Team
 */

import { OrderStatus, Urgency } from './order'

/**
 * Calendar order response type
 * Matches backend OrderCalendarResponse structure
 */
export interface OrderCalendarResponse {
  // === Core Information ===
  id: string
  title: string
  description: string
  status: OrderStatus

  // === Company Information ===
  companyId: string
  companyName: string
  providerId?: string // Only present for accepted orders

  // === Calendar-Required Dates ===
  startDate: string // ISO datetime string
  deadline: string // ISO datetime string

  // === Additional Display Information ===
  urgency: Urgency
  primaryCategory: string
  budget?: number
  city?: string
  fullAddress?: string

  // === Calendar-Specific Computed Fields ===
  isSpanning: boolean // Whether order spans multiple days
  durationDays: number // Duration in days
  isActive: boolean // Whether order is currently active
  isOverdue: boolean // Whether deadline has passed and order is not completed

  // === Provider Perspective Fields ===
  distanceKm?: number // Distance from provider location (if applicable)
}

/**
 * Calendar view configuration
 */
export interface CalendarViewConfig {
  role: 'client' | 'provider'
  startDate?: string
  endDate?: string
}

/**
 * Calendar filter options
 */
export interface CalendarFilters {
  status?: OrderStatus[]
  urgency?: Urgency[]
  category?: string[]
  showOverdue?: boolean
  showActive?: boolean
}

/**
 * Calendar-specific order item for display purposes
 * Extends order data with calendar-specific properties
 */
export interface OrderCalendarItem {
  // Core order information
  id: string
  title: string
  description: string
  status: OrderStatus

  // Company information  
  companyId: string
  companyName?: string
  providerId?: string // Required for accepted orders

  // Date information (both required for calendar display)
  startDate: string // ISO string
  deadline: string // ISO string

  // Additional display information
  budget?: number
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  primaryCategory?: string
  city?: string
  fullAddress?: string

  // Calendar-specific computed properties
  duration?: number // Duration in days (computed)
  isSpanning?: boolean // Whether order spans multiple days
  isToday?: boolean // Whether order is active today
  isOverdue?: boolean // Whether deadline has passed
}

/**
 * Calendar view configuration
 */
export interface CalendarView {
  type: 'month' | 'week'
  currentDate: Date
}

/**
 * Calendar event for user role detection
 */
export interface CalendarUserContext {
  isProvider: boolean
  isClient: boolean
  companyId?: string
  userRole?: string
}

/**
 * Calendar order filtering options
 */
export interface CalendarOrderFilters {
  statuses?: OrderStatus[]
  showCompletedOrders?: boolean
  showDraftOrders?: boolean
  categoryFilter?: string
  urgencyFilter?: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[]
}

/**
 * Transform order response to calendar item
 */
export function transformToCalendarItem(order: OrderDetailResponse | OrderListResponse): OrderCalendarItem | null {
  // Only include orders with both startDate and deadline
  if (!order.startDate || !order.deadline) {
    return null
  }

  // Note: Removed the providerId requirement to show orders for both clients and providers
  // Clients see all their orders regardless of provider assignment
  // Providers see orders assigned to them (handled in the hook logic)

  const startDate = new Date(order.startDate)
  const deadline = new Date(order.deadline)
  const today = new Date()

  // Calculate duration in days
  const duration = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return {
    id: order.id,
    title: order.title,
    description: order.description,
    status: order.status,
    companyId: order.companyId,
    companyName: order.companyName,
    providerId: order.providerId,
    startDate: order.startDate,
    deadline: order.deadline,
    budget: order.budget,
    urgency: order.urgency,
    primaryCategory: order.primaryCategory,
    city: 'city' in order ? order.city : undefined,
    fullAddress: 'fullAddress' in order ? order.fullAddress : undefined,

    // Computed properties
    duration,
    isSpanning: duration > 1,
    isToday: today >= startDate && today <= deadline,
    isOverdue: today > deadline && order.status !== 'COMPLETED'
  }
}

/**
 * Get order color based on status
 */
export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'border-gray-400 bg-gray-50 text-gray-600'
    case 'PUBLISHED':
      return 'border-blue-500 bg-blue-50 text-blue-700'
    case 'MATCHED':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700'
    case 'IN_PROGRESS':
      return 'border-green-500 bg-green-50 text-green-700'
    case 'COMPLETED':
      return 'border-gray-500 bg-gray-100 text-gray-600'
    case 'CANCELLED':
      return 'border-red-500 bg-red-50 text-red-700'
    default:
      return 'border-gray-400 bg-gray-50 text-gray-600'
  }
}

/**
 * Get badge variant for order status
 */
export function getOrderStatusBadgeVariant(
  status: OrderStatus,
):
  | "default"
  | "outline"
  | "ausgeschrieben"
  | "auftrag_vergeben"
  | "aktiv"
  | "abgeschlossen"
  | "in_verzug"
  | "entwurf" {
  switch (status) {
    case "DRAFT":
      return "entwurf";
    case "PUBLISHED":
      return "ausgeschrieben";
    case "MATCHED":
      return "auftrag_vergeben";
    case "IN_PROGRESS":
      return "aktiv";
    case "COMPLETED":
      return "abgeschlossen";
    case "CANCELLED":
      return "in_verzug"; // fallback variant for cancelled/overdue
    default:
      return "outline";
  }
}

/**
 * Get order urgency color
 */
export function getOrderUrgencyColor(urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): string {
  switch (urgency) {
    case 'URGENT':
      return 'text-red-600'
    case 'HIGH':
      return 'text-orange-600'
    case 'MEDIUM':
      return 'text-yellow-600'
    case 'LOW':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
} 