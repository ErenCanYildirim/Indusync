// API Response Types for Authentication and Company Management

export interface LoginRequest {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterRequest {
    // === Core Identity ===
    email: string
    password: string
    confirmPassword: string
    accountType: 'PERSONAL' | 'BUSINESS'

    // === Personal Information ===
    firstName?: string
    lastName?: string
    phone?: string
    website?: string

    // === Company Information ===
    companyName?: string
    companyType?: 'EINZELUNTERNEHMEN' | 'GBR' | 'GMBH' | 'AG' | 'UG' | 'OHG' | 'KG' | 'GMBH_CO_KG' | 'OTHER'
    taxId?: string
    registrationNumber?: string

    // === Address Fields ===
    street?: string
    houseNumber?: string
    postalCode?: string
    city?: string
    country?: string

    // === Location Coordinates ===
    latitude?: number
    longitude?: number

    // === Business-specific Fields ===
    workRadiusKm?: number
    specializations?: string[]
    industries?: string[]
    orderCategories?: string[]
    description?: string

    // === Role Flags ===
    companyTypeAuftraggeber?: boolean
    companyTypeAuftragnehmer?: boolean

    // === Auftragnehmer-specific Fields ===
    companyDetailsName?: string
    companyAddress?: string
    companyPostalCode?: string
    companyCity?: string
    workRadius?: string
    countrySelection?: string
    contactPersonCount?: number
    contactPersonName?: string
    contactDepartment?: string
    contactEmail?: string
    contactPhone?: string
    employeeCount?: number
    companyDescription?: string
    companyVerificationFile?: string
    companyCertificatesFile?: string

    // === User Preferences ===
    emailNotifications?: boolean
    interests?: string[]
    referralSource?: string

    // === Terms and Privacy (REQUIRED) ===
    termsAccepted: boolean
    privacyAccepted: boolean
}

export interface UserProfile {
    id: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    website?: string
    accountType: 'PERSONAL' | 'BUSINESS'
    emailVerified: boolean
    createdAt: string
    updatedAt: string
    roles?: string[]
    companyId?: string
    // Company membership information
    companyMemberships?: CompanyMembership[]
    currentCompanyMembership?: CompanyMembership
}

export interface CompanyMembership {
    companyId: string
    companyName: string
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER'
    positionTitle?: string
    isPrimaryContact: boolean
    joinedAt: string
    active: boolean
    // Permission flags
    canCreateOrders: boolean
    canManageEmployees: boolean
    canAssignProjects: boolean
    canViewFinancials: boolean
    canManageCompanySettings: boolean
}

// Re-export company-related types from dedicated company-profile module
export type {
    CompanyProfile,
    CompanyDocument,
    CompanyType,
    CompanyStatus,
    ContactInfo,
    Address,
    GeoLocation,
    CompanyContactInfo,
    CompanyMetrics,
    CompanyBusinessInfo,
    CompanyProfileResponse,
    CompanyProfileLoadingState,
    UseCompanyProfileReturn,
    CompanyDocumentType
} from '../types/company-profile';



export interface AuthResponse {
    token: string
    refreshToken?: string
    user: UserProfile
    expiresIn: number
}

export interface ApiError {
    message: string
    code?: string
    details?: Record<string, any>
}

export interface PaginatedResponse<T> {
    data: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

// Query Keys for TanStack Query
export const queryKeys = {
    auth: {
        user: ['auth', 'user'] as const,
        check: ['auth', 'check'] as const,
    },
    company: {
        profile: ['company', 'profile'] as const,
        list: ['company', 'list'] as const,
        roles: (companyId: string) => ['company', companyId, 'roles'] as const,
        availableRoles: (companyId: string) => ['company', companyId, 'available-roles'] as const,
        roleRequirements: (companyId: string, role?: string) => ['company', companyId, 'role-requirements', role] as const,
        documents: (companyId?: string) => ['company', companyId || 'current', 'documents'] as const,
        documentDownloadUrl: (documentId: string) => ['company', 'document', documentId, 'download-url'] as const,
        termsConditions: (companyId: string) => ['company', companyId, 'terms-conditions'] as const,
        termsConditionsUrl: (companyId: string) => ['company', companyId, 'terms-conditions', 'url'] as const,
    },
    orders: {
        all: ['orders'] as const,
        lists: () => [...queryKeys.orders.all, 'list'] as const,
        list: (params: PaginationParams) => [...queryKeys.orders.lists(), params] as const,
        details: () => [...queryKeys.orders.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.orders.details(), id] as const,
        search: (params: any) => [...queryKeys.orders.all, 'search', params] as const,
    },
} as const

// =============================================================================
// ORDER-RELATED TYPES (Sprint 2 Day 4)
// =============================================================================

export type OrderStatus = 'DRAFT' | 'PUBLISHED' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface CreateOrderRequest {
    // === Core Order Information ===
    title: string
    description: string

    // === Contact Information ===
    contactName: string
    contactEmail: string
    contactPhone?: string

    // === Service Address ===
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country?: string

    // === Geographic Coordinates (BigDecimal in backend) ===
    locationLat: number
    locationLng: number

    // === Matching Configuration ===
    searchRadiusKm: number

    // === Categories & Classification (Backend expects enum objects, not strings) ===
    primaryCategory: string // Maps to OrderCategory enum
    additionalCategories?: string[] // Maps to Set<OrderCategory>
    targetIndustries: string[] // Maps to Set<Industry> 
    placementTypes: string[] // Maps to Set<PlacementType>

    // === Skills & Requirements ===
    requiredSpecializations?: string[]
    requiredSkills?: string[]
    requiredVerifications?: string[]
    requiredCertifications?: string[]

    // === Timeline & Urgency ===
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' // Maps to Urgency enum
    startDate?: string // ISO string -> LocalDateTime
    deadline?: string // ISO string -> LocalDateTime
    responseTimeHours?: number

    // === Financial ===
    budget?: number // Maps to BigDecimal
}

export interface ContactPersonDto {
    name: string
    email: string
    phone?: string
}

export interface AddressDto {
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
}

export interface GeoLocationDto {
    latitude: number
    longitude: number
}

export interface OrderDocumentDto {
    id: string
    fileName: string
    originalFileName: string
    documentType?: string
    description?: string
    fileSize: number
    contentType: string
    uploadedAt: string
    downloadUrl?: string
}

export interface OrderDetailResponse {
    address: any
    // === Core Information ===
    id: string
    title: string
    description: string
    status: OrderStatus
    companyId: string
    companyName?: string

    // === Terms & Conditions ===
    clientHasTermsConditions: boolean

    // === Contact Information ===
    contactPerson: ContactPersonDto

    // === Service Location ===
    serviceAddress: AddressDto
    location: GeoLocationDto
    searchRadiusKm: number

    // === Categories & Classification ===
    primaryCategory: string
    additionalCategories?: string[]
    targetIndustries: string[]
    placementTypes: string[]

    // === Skills & Requirements ===
    requiredSpecializations?: string[]
    requiredSkills?: string[]
    requiredVerifications?: string[]
    requiredCertifications?: string[]

    // === Timeline & Urgency ===
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    startDate?: string
    deadline?: string
    responseTimeHours?: number

    // === Financial ===
    budget?: number

    // === Lifecycle Timestamps ===
    publishedAt?: string
    createdAt: string
    updatedAt: string
    completedAt?: string

    // === Provider Assignment ===
    /**
     * ID des ausgewählten Dienstleisters (Provider). Wird gesetzt, sobald der Auftrag
     * von einem Auftragnehmer angenommen und vom Auftraggeber bestätigt wurde.
     */
    providerId?: string

    // === Provider View ===
    distanceKm?: number

    // === Documents ===
    documents: OrderDocumentDto[]

    // === Applications ===
    applications: OrderApplicationDto[]
    applicationsCount: number

    // === Helper Properties ===
    isUrgent?: boolean
    hasDeadline?: boolean
    hasBudget?: boolean
    statusDisplayName?: string
    isPublished?: boolean
    isFinalState?: boolean
}

export interface OrderListResponse {
    address: any
    id: string
    title: string
    description: string
    status: OrderStatus
    companyId: string
    companyName?: string

    // === Terms & Conditions ===
    clientHasTermsConditions: boolean

    // Location info (simplified for list view)
    city?: string
    postalCode?: string
    fullAddress?: string
    searchRadiusKm?: number

    // Categories & Classification
    primaryCategory?: string
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

    // Timeline & Financial
    budget?: number
    deadline?: string
    publishedAt?: string
    createdAt: string

    // Provider view
    distanceKm?: number
    requiredSkills?: string[]

    // Summary fields for list view (computed)
    isDraft?: boolean
    isPublished?: boolean
    isFinal?: boolean
    canBeModified?: boolean
    statusDisplayName?: string
}

export interface PaginationParams {
    page?: number
    size?: number
    sort?: string
    status?: OrderStatus
}

export interface ApiResponse<T> {
    data: T
    page?: number
    size?: number
    totalElements?: number
    totalPages?: number
    first?: boolean
    last?: boolean
}

// Order search and filtering
export interface OrderSearchParams {
    query?: string
    location?: string
    radius?: number
    category?: string
    minBudget?: number
    maxBudget?: number
    status?: OrderStatus
    page?: number
    size?: number
}

// Form schemas (for React Hook Form + Zod)
export interface CreateOrderFormData {
    // Basic order info
    title: string
    description: string

    // Service location
    address: {
        street: string
        houseNumber: string
        postalCode: string
        city: string
        country: string
    }

    // Geographic settings
    useCurrentLocation?: boolean
    latitude?: number
    longitude?: number
    searchRadiusKm: number

    // Additional metadata (for future features)
    category?: string
    budget?: number
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
    expectedDuration?: string
    requiredSkills?: string[]
    documents?: File[]
}

// =============================================================================
// ORDER MATCH AND ORDER BOARD TYPES (Order Board Integration)
// =============================================================================

export interface OrderMatchResponse {
    // === Core Match Information ===
    orderId: string
    order?: OrderDetailResponse

    // === Match Scoring ===
    matchScore: number // 0.0 - 1.0
    matchScorePercentage: number // 0-100
    distanceKm?: number

    // === Detailed Score Breakdown ===
    industryScore?: number // 0.0 - 1.0
    skillsScore?: number // 0.0 - 1.0
    contractScore?: number // 0.0 - 1.0
    certificatesScore?: number // 0.0 - 1.0
    verificationScore?: number // 0.0 - 1.0
    radiusScore?: number // 0.0 - 1.0

    // === Match Metadata ===
    matchedAt: string // ISO DateTime
    viewed: boolean
    viewedAt?: string // ISO DateTime
    interested?: boolean
    respondedAt?: string // ISO DateTime

    // === Computed Properties ===
    isHighQuality: boolean

    // === Helper Methods ===
    matchQuality?: 'Excellent' | 'High' | 'Good' | 'Fair' | 'Low'
    matchReason?: string
}

export interface OrderBoardFilters {
    minScore?: number // 0.0 - 1.0
    unviewedOnly?: boolean
    page?: number
    size?: number
}

export interface OrderBoardParams extends OrderBoardFilters {
    // Additional parameters for order board API calls
}

// =============================================================================
// ORDER BOARD API RESPONSE TYPES
// =============================================================================

export interface OrderBoardResponse {
    content: OrderMatchResponse[]
    totalElements: number
    totalPages: number
    size: number
    number: number // current page
    numberOfElements: number
    first: boolean
    last: boolean
    empty: boolean
}

export interface CompanyMatchResponse {
    [x: string]: any
    providerId: string
    company?: {
        companyId: string
        companyName: string
        companyType: string
        status: string
        verified: boolean
        verifiedAt?: string
        street: string
        houseNumber: string
        postalCode: string
        city: string
        country: string
        formattedAddress: string
        contactEmail: string
        contactPhone: string
        website: string
        description: string
        businessHours?: string
        workRadiusKm: number
        specializations: string[]
        industries: string[]
        orderCategories: string[]
        certifications: string[]
        isAuftraggeber: boolean
        isAuftragnehmer: boolean
        businessRoleDescription: string
        foundedYear?: number
        employeeCount?: number
        annualRevenue?: number
        taxId: string
        registrationNumber: string
        vatNumber?: string
        insuranceCoverage: boolean
        qualityScore?: number
        completionRate?: number
        averageResponseHours?: number
        logoUrl?: string
        latitude: number
        longitude: number
        createdAt: string
        updatedAt: string
        message?: string
        canEdit?: boolean
        canManage?: boolean
        statusMessage: string
        sizeCategory: string
    }

    matchScore: number
    matchScorePercentage: number
    distanceKm?: number

    industryScore?: number
    skillsScore?: number
    contractScore?: number
    certificatesScore?: number
    verificationScore?: number
    radiusScore?: number

    matchedAt: string
    notificationSent?: boolean
    isHighQuality: boolean

    // Provider Activity Tracking
    viewedAt?: string
    respondedAt?: string
    interested?: boolean
}

// Calendar-specific order response (from dedicated calendar endpoint)
export interface OrderCalendarResponse {
    // Core Information
    id: string
    title: string
    description: string
    status: OrderStatus

    // Company Information
    companyId: string
    companyName?: string
    providerId?: string // Only present for accepted orders

    // Calendar-Required Dates
    startDate: string // ISO string
    deadline: string  // ISO string

    // Additional Display Information
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    primaryCategory?: string
    budget?: number
    city?: string
    fullAddress?: string

    // Calendar-Specific Computed Fields
    isSpanning: boolean // Whether order spans multiple days
    durationDays: number // Duration in days
    isActive: boolean // Whether order is currently active
    isOverdue: boolean // Whether deadline has passed and order is not completed

    // Provider Perspective Fields
    distanceKm?: number // Distance from provider location
}

export interface DeadlineExtensionProposal {
    id: string;
    orderId: string;
    proposedDeadline: string;
    requesterCompanyId: string;
    status: 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
    confirmedByCompanyId?: string;
    confirmedAt?: string;
    rejectedByCompanyId?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    cancelledAt?: string;
    createdAt: string;
}

export interface ReviewRatingDto {
    category: string;
    score: number;
    comment?: string;
}

export interface CreateReviewRequest {
    orderId: string;
    revieweeCompanyId: string;
    ratings: ReviewRatingDto[];
}

export interface ReviewResponse {
    reviewId: string;
    orderId: string;
    reviewerCompanyId: string;
    revieweeCompanyId: string;
    createdAt: string;
    updatedAt: string;
    ratings: ReviewRatingDto[];
}

// =============================================================================
// ORDER APPLICATIONS TYPES
// =============================================================================

export type ApplicationStatus = 'APPLIED' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED'

export interface OrderApplicationDto {
    id: string
    companyId: string
    companyName: string
    appliedAt: string // ISO string
    status: ApplicationStatus
    message?: string
    isCurrentUserApplication?: boolean // For provider perspective
}

// Application status helper functions
export const ApplicationStatusColors = {
    APPLIED: 'bg-blue-100 text-blue-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
} as const

export const ApplicationStatusText = {
    APPLIED: 'Applied',
    WITHDRAWN: 'Withdrawn',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected'
} as const

export function getApplicationStatusColor(status: ApplicationStatus): string {
    return ApplicationStatusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getApplicationStatusText(status: ApplicationStatus): string {
    return ApplicationStatusText[status] || status
} 