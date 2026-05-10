// Mock API service to simulate backend interactions
// Import CompanyMembership from types
import type { CompanyMembership } from '@/lib/api/types'
import type {
  UserProfile,
  UpdateProfileData,
  ChangePasswordData,
  ProfileApiError,
  UpdateProfileResponse,
  ChangePasswordResponse
} from '@/lib/types/profile'
import { apiClient } from '@/lib/api/client'

// delay helper for mock data
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Types for our data models  
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  companyType?: string
  role: "admin" | "client" | "provider"
  createdAt: Date
  // Company membership information
  companyMemberships?: CompanyMembership[]
  currentCompanyMembership?: CompanyMembership
  // Additional fields to match UserProfile
  phone?: string
  website?: string
  accountType?: 'PERSONAL' | 'BUSINESS'
  emailVerified?: boolean
}

export interface Order {
  id: string
  title: string
  description: string
  category: string
  projectType: string
  budget: number
  location: string
  startDate: Date
  endDate: Date
  status: "draft" | "published" | "in_progress" | "completed" | "cancelled"
  createdBy: string
  createdAt: Date
  requirements: string[]
  skills: string[]
  documents: {
    name: string
    url: string
    size: string
  }[]
}

// Mock database
let users: User[] = [
  {
    id: "1",
    email: "admin@indusync.de",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    email: "client@example.com",
    companyName: "TechPro GmbH",
    companyType: "GMBH",
    role: "client",
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    email: "provider@example.com",
    companyName: "ElektroService GmbH",
    companyType: "GMBH",
    role: "provider",
    createdAt: new Date("2023-03-20"),
  },
]

let orders: Order[] = [
  {
    id: "1",
    title: "Wartung Produktionsanlage",
    description: "Regelmäßige Wartung unserer Produktionsanlage im Werk Berlin",
    category: "elektrotechnik",
    projectType: "wiederkehrend",
    budget: 5000,
    location: "Berlin",
    startDate: new Date("2024-06-15"),
    endDate: new Date("2024-06-30"),
    status: "published",
    createdBy: "2",
    createdAt: new Date("2024-05-01"),
    requirements: ["iso9001", "insured"],
    skills: ["Automatisierungstechnik", "SPS-Programmierung"],
    documents: [
      {
        name: "Projektbeschreibung.pdf",
        url: "/documents/projektbeschreibung.pdf",
        size: "1.2 MB",
      },
    ],
  },
  {
    id: "2",
    title: "SPS-Programmierung",
    description: "Programmierung einer Siemens S7-1500 SPS für unsere neue Fertigungslinie",
    category: "programmierung",
    projectType: "einmalig",
    budget: 8000,
    location: "München",
    startDate: new Date("2024-06-22"),
    endDate: new Date("2024-07-15"),
    status: "published",
    createdBy: "2",
    createdAt: new Date("2024-05-05"),
    requirements: ["iso9001", "registered"],
    skills: ["SPS-Programmierung", "Siemens S7", "TIA Portal"],
    documents: [
      {
        name: "Technische_Spezifikation.docx",
        url: "/documents/technische_spezifikation.docx",
        size: "842 KB",
      },
    ],
  },
]

// API functions
export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(800)

    const user = users.find((u) => u.email === email)

    if (!user || password !== "password") {
      // In a real app, you'd hash passwords
      throw new Error("Invalid email or password")
    }

    return {
      user,
      token: "mock-jwt-token",
    }
  },

  async register(userData: Partial<User>, password?: string): Promise<{ user: User; token: string }> {
    await delay(1000)
    // Password would be used here in a real backend for hashing and storing
    // For mock, it's not used beyond this point in this function.

    // Check if email already exists
    if (users.some((u) => u.email === userData.email)) {
      throw new Error("Email already in use")
    }

    const newUser: User = {
      id: (users.length + 1).toString(),
      email: userData.email!,
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyName: userData.companyName,
      companyType: userData.companyType,
      role: userData.role ?? "client",
      createdAt: new Date(),
    }

    users = [...users, newUser]

    return {
      user: newUser,
      token: "mock-jwt-token",
    }
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(300)

    // In a real app, this would make an actual API call to /v1/auth/profile
    // return await fetch('/v1/auth/profile', {
    //   headers: { 'Authorization': `Bearer ${getToken()}` }
    // }).then(res => res.json())

    // For mock purposes, return user with mock company membership
    const mockUser = users[1]
    if (mockUser) {
      mockUser.companyMemberships = [
        {
          companyId: "comp-1",
          companyName: "Beispiel GmbH",
          role: "ADMIN",
          positionTitle: "Projektleiter",
          isPrimaryContact: true,
          joinedAt: new Date(2023, 0, 15).toISOString(),
          active: true,
          canCreateOrders: true,
          canManageEmployees: true,
          canAssignProjects: true,
          canViewFinancials: false,
          canManageCompanySettings: false
        }
      ]
      mockUser.currentCompanyMembership = mockUser.companyMemberships[0]
    }
    return mockUser
  },

  async logout(): Promise<void> {
    await delay(300)
    // In a real app, this would invalidate the token
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    await delay(800)
    return orders
  },

  async getOrder(id: string): Promise<Order | null> {
    await delay(500)
    const order = orders.find((o) => o.id === id)
    return order || null
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    await delay(1200)

    const newOrder: Order = {
      id: (orders.length + 1).toString(),
      title: orderData.title!,
      description: orderData.description!,
      category: orderData.category!,
      projectType: orderData.projectType!,
      budget: orderData.budget ?? 0,
      location: orderData.location!,
      startDate: orderData.startDate!,
      endDate: orderData.endDate!,
      status: "draft",
      createdBy: orderData.createdBy ?? "2",
      createdAt: new Date(),
      requirements: orderData.requirements || [],
      skills: orderData.skills || [],
      documents: orderData.documents || [],
    }

    orders = [...orders, newOrder]

    return newOrder
  },

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    await delay(800)

    const index = orders.findIndex((o) => o.id === id)

    if (index === -1) {
      throw new Error("Order not found")
    }

    const updatedOrder = {
      ...orders[index],
      ...orderData,
    }

    orders = [...orders.slice(0, index), updatedOrder, ...orders.slice(index + 1)]

    return updatedOrder
  },

  async deleteOrder(id: string): Promise<void> {
    await delay(400)
    const index = orders.findIndex((o) => o.id === id)
    if (index > -1) {
      orders.splice(index, 1)
    }
  },

  // Company Memberships
  async getCompanyMemberships(): Promise<CompanyMembership[]> {
    await delay(300)
    // In a real app: GET /v1/auth/company-memberships
    const currentUser = await this.getCurrentUser()
    return currentUser?.companyMemberships || []
  },

  async checkPermission(permission: string): Promise<boolean> {
    await delay(200)
    // In a real app: GET /v1/auth/check-permission?permission=${permission}
    const currentUser = await this.getCurrentUser()
    if (!currentUser?.currentCompanyMembership) return false

    const membership = currentUser.currentCompanyMembership
    switch (permission) {
      case 'CREATE_ORDERS':
        return membership.canCreateOrders
      case 'MANAGE_EMPLOYEES':
        return membership.canManageEmployees
      case 'ASSIGN_PROJECTS':
        return membership.canAssignProjects
      case 'VIEW_FINANCIALS':
        return membership.canViewFinancials
      case 'MANAGE_COMPANY_SETTINGS':
        return membership.canManageCompanySettings
      default:
        return false
    }
  },

  // Profile Management API Methods
  /**
   * Get current user profile
   * Fetches the current user's profile information from the backend
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/auth/profile')
      return response.data
    } catch (error: any) {
      // Handle different error scenarios
      if (error.response?.status === 401) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
      }
      if (error.response?.status === 404) {
        throw new Error('Benutzerprofil nicht gefunden.')
      }
      if (error.response?.status >= 500) {
        throw new Error('Serverfehler beim Laden des Profils. Bitte versuchen Sie es später erneut.')
      }

      const errorMessage = error.response?.data?.message || 'Fehler beim Laden des Profils'
      throw new Error(errorMessage)
    }
  },

  /**
   * Update user profile
   * Updates the current user's profile information
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await apiClient.put('/auth/update-profile', data)
      return response.data
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.validationErrors || []
        const profileError: ProfileApiError = {
          message: error.response.data?.message || 'Validierungsfehler',
          validationErrors: validationErrors
        }
        throw profileError
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
      }

      // Handle authorization errors
      if (error.response?.status === 403) {
        throw new Error('Keine Berechtigung zum Aktualisieren des Profils.')
      }

      // Handle user not found
      if (error.response?.status === 404) {
        throw new Error('Benutzerprofil nicht gefunden.')
      }

      // Handle server errors
      if (error.response?.status >= 500) {
        throw new Error('Serverfehler beim Aktualisieren des Profils. Bitte versuchen Sie es später erneut.')
      }

      // Handle network errors
      if (!error.response) {
        throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
      }

      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Profils'
      throw new Error(errorMessage)
    }
  },

  /**
   * Change user password
   * Changes the current user's password with proper validation
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      })
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message

        // Handle specific password validation errors
        if (errorMessage?.includes('current password')) {
          throw new Error('Das aktuelle Passwort ist falsch.')
        }
        if (errorMessage?.includes('password confirmation')) {
          throw new Error('Die Passwort-Bestätigung stimmt nicht überein.')
        }
        if (errorMessage?.includes('password length') || errorMessage?.includes('8 characters')) {
          throw new Error('Das neue Passwort muss mindestens 8 Zeichen lang sein.')
        }

        throw new Error(errorMessage || 'Ungültige Passwort-Daten')
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
      }

      // Handle authorization errors
      if (error.response?.status === 403) {
        throw new Error('Keine Berechtigung zum Ändern des Passworts.')
      }

      // Handle user not found
      if (error.response?.status === 404) {
        throw new Error('Benutzerkonto nicht gefunden.')
      }

      // Handle server errors
      if (error.response?.status >= 500) {
        throw new Error('Serverfehler beim Ändern des Passworts. Bitte versuchen Sie es später erneut.')
      }

      // Handle network errors
      if (!error.response) {
        throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
      }

      const errorMessage = error.response?.data?.message || 'Fehler beim Ändern des Passworts'
      throw new Error(errorMessage)
    }
  },
}