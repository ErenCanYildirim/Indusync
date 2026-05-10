/**
 * Company Profile Types
 * 
 * This file contains TypeScript interfaces for company profile viewing functionality.
 * These types match the enhanced PublicCompanyInfo structure from the backend.
 */

import type { TermsConditionsDocument } from './terms-conditions';

/**
 * Company document type enum matching backend DocumentType
 */
export type CompanyDocumentType = "VERIFICATION" | "CERTIFICATES" | "CERTIFICATION_ITEM" | "OTHER";

/**
 * Company document interface matching backend CompanyDocument DTO
 */
export interface CompanyDocument {
    id: string;
    type: CompanyDocumentType;
    name: string;
    url: string;
    uploadedAt: string;
    fileSize?: number;
    contentType?: string;
    category?: string;
}

/**
 * Contact information for a company
 */
export interface ContactInfo {
    email?: string;
    phone?: string;
    contactPersonName?: string;
    contactPersonPosition?: string;
}

/**
 * Address information matching backend Address value object
 */
export interface Address {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
}

/**
 * Geographic location information matching backend GeoLocation
 */
export interface GeoLocation {
    latitude?: number;
    longitude?: number;
}

/**
 * Company type enum matching backend CompanyType
 */
export type CompanyType =
    | "GMBH"
    | "AG"
    | "EINZELUNTERNEHMEN"
    | "GBR"
    | "UG"
    | "OHG"
    | "KG"
    | "GMBH_CO_KG"
    | "OTHER";

/**
 * Company status enum matching backend CompanyStatus
 */
export type CompanyStatus =
    | "PENDING"
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED"
    | "REJECTED";

/**
 * Comprehensive company profile interface matching enhanced PublicCompanyInfo structure.
 * This interface represents the complete public company information available to users
 * when viewing company profiles in the context of order matching.
 */
export interface CompanyProfile {
    id?: string;
    // Core identification
    companyId: string;
    name: string;
    companyType: CompanyType;

    // Basic company information
    description?: string;
    website?: string;
    city?: string;

    // Business roles - these determine what the company can do
    isAuftraggeber: boolean;  // Can create orders (client)
    isAuftragnehmer: boolean; // Can provide services (provider)

    // Business specialization and industry information
    specializations: string[];
    industries: string[];
    orderCategories?: string[];

    // Verification and company status
    verified: boolean;
    status?: CompanyStatus;
    verifiedAt?: string;
    verifiedBy?: string;

    // Company details
    foundedYear?: number;
    employeeCount?: number;
    logoUrl?: string;

    // Contact and location information
    contactEmail?: string;
    contactPhone?: string;
    address?: Address;
    location?: GeoLocation;
    workRadiusKm?: number;
    businessHours?: string;

    // Legal and business registration information
    taxId?: string;
    registrationNumber?: string;
    vatNumber?: string;

    // Quality and performance metrics
    qualityScore?: number;
    completionRate?: number;
    averageResponseHours?: number;
    insuranceCoverage?: boolean;

    // Additional business information
    annualRevenue?: number;
    certifications?: string[];

    // Timestamps
    createdAt: string;
    updatedAt?: string;

    // Company documents (verification, certificates, etc.)
    documents?: CompanyDocument[];

    // Terms & Conditions document availability
    hasTermsConditions: boolean;
    termsConditionsDocument?: TermsConditionsDocument;

    // Computed/derived fields for display purposes
    businessRoleDescription?: string;
    formattedAddress?: string;
}

/**
 * Simplified contact information interface for display purposes
 */
export interface CompanyContactInfo {
    email?: string;
    phone?: string;
    businessHours?: string;
    address?: Address;
    formattedAddress?: string;
}

/**
 * Company metrics interface for displaying quality and performance data
 */
export interface CompanyMetrics {
    qualityScore?: number;
    completionRate?: number;
    averageResponseHours?: number;
    insuranceCoverage?: boolean;
    verified: boolean;
    verifiedAt?: string;
}

/**
 * Company business information interface
 */
export interface CompanyBusinessInfo {
    specializations: string[];
    industries: string[];
    orderCategories?: string[];
    workRadiusKm?: number;
    foundedYear?: number;
    employeeCount?: number;
    certifications?: string[];
    businessRoleDescription?: string;
}

/**
 * API response wrapper for company profile data
 */
export interface CompanyProfileResponse {
    success: boolean;
    data?: CompanyProfile;
    error?: string;
    message?: string;
}

/**
 * Loading states for company profile data
 */
export interface CompanyProfileLoadingState {
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    data?: CompanyProfile | null;
}

/**
 * Company profile hook return type
 */
export interface UseCompanyProfileReturn extends CompanyProfileLoadingState {
    refetch: () => void;
    isRefetching: boolean;
}

/**
 * Error types for company profile API operations
 */
export interface CompanyProfileApiError extends Error {
    status?: number;
    code?: string;
    details?: Record<string, any>;
}

/**
 * API error codes for company profile operations
 */
export const CompanyProfileErrorCodes = {
    INVALID_COMPANY_ID: 'INVALID_COMPANY_ID',
    COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',
    ACCESS_DENIED: 'ACCESS_DENIED',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    NO_DATA_RECEIVED: 'NO_DATA_RECEIVED',
    INVALID_PROFILE_DATA: 'INVALID_PROFILE_DATA',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Type for company profile error codes
 */
export type CompanyProfileErrorCode = typeof CompanyProfileErrorCodes[keyof typeof CompanyProfileErrorCodes];

/**
 * Cache configuration interface for company profile service
 */
export interface CompanyProfileCacheConfig {
    ttl: number; // Time to live in milliseconds
    maxSize: number; // Maximum number of cached entries
}

/**
 * Cached company profile entry interface
 */
export interface CachedCompanyProfile {
    data: CompanyProfile;
    timestamp: number;
    expiresAt: number;
}

/**
 * Company profile service statistics interface
 */
export interface CompanyProfileCacheStats {
    size: number;
    maxSize: number;
    entries: string[];
}

/**
 * Type guard to check if a company profile is complete
 */
export function isCompanyProfileComplete(profile: Partial<CompanyProfile>): profile is CompanyProfile {
    return !!(
        profile.companyId &&
        profile.name &&
        profile.companyType &&
        typeof profile.isAuftraggeber === 'boolean' &&
        typeof profile.isAuftragnehmer === 'boolean' &&
        Array.isArray(profile.specializations) &&
        Array.isArray(profile.industries) &&
        typeof profile.verified === 'boolean' &&
        typeof profile.hasTermsConditions === 'boolean' &&
        profile.createdAt
    );
}

/**
 * Type guard to check if contact information is available
 */
export function hasContactInfo(profile: CompanyProfile): boolean {
    return !!(
        profile.contactEmail ||
        profile.contactPhone ||
        profile.address ||
        profile.businessHours
    );
}

/**
 * Type guard to check if company has documents
 */
export function hasDocuments(profile: CompanyProfile): boolean {
    return !!(profile.documents && profile.documents.length > 0);
}

/**
 * Type guard to check if company has quality metrics
 */
export function hasQualityMetrics(profile: CompanyProfile): boolean {
    return !!(
        profile.qualityScore !== undefined ||
        profile.completionRate !== undefined ||
        profile.averageResponseHours !== undefined
    );
}

/**
 * Type guard to check if company has Terms & Conditions document
 */
export function hasTermsConditions(profile: CompanyProfile): boolean {
    return profile.hasTermsConditions && !!profile.termsConditionsDocument;
}