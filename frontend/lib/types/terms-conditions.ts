/**
 * Terms & Conditions Types
 * 
 * This file contains TypeScript interfaces for Terms & Conditions document management
 * and access functionality. These types match the backend TermsConditionsDocument
 * and related DTOs.
 */

/**
 * Access context enum for tracking where T&C documents are accessed from
 */
export type AccessContext = 'ORDER_DETAIL' | 'COMPANY_PROFILE' | 'EXPRESSION_OF_INTEREST';

/**
 * Terms & Conditions document interface matching backend TermsConditionsDocument entity
 */
export interface TermsConditionsDocument {
    id: string;
    companyId: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    isActive: boolean;
    version: number;
    checksum: string;
}

/**
 * Terms & Conditions access log interface for audit tracking
 */
export interface TermsConditionsAccess {
    id: string;
    documentId: string;
    accessedBy: string;
    accessContext: AccessContext;
    orderId?: string;
    ipAddress?: string;
    userAgent?: string;
    accessedAt: string;
}

/**
 * API request interface for uploading T&C documents
 */
export interface UploadTermsConditionsRequest {
    file: File;
    companyId: string;
}

/**
 * API response interface for T&C document operations (matches actual backend response)
 */
export interface TermsConditionsResponse {
    documentId: string | null;
    companyId: string;
    fileName: string | null;
    originalFileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    fileUrl: string | null;
    uploadedAt: string | null;
    uploadedBy: string | null;
    isActive: boolean | null;
    version: number | null;
    checksum: string | null;
    success: boolean;
    successful: boolean;
    message: string;
    errorCode?: string;
    fileExtension: string;
    formattedFileSize: string;
    pdfDocument: boolean;
}

/**
 * API response interface for retrieving T&C documents (simplified to match backend)
 */
export interface GetTermsConditionsResponse extends TermsConditionsResponse {
    // The backend returns the document data directly, not nested
}

/**
 * API request interface for tracking T&C document access
 */
export interface TermsConditionsAccessRequest {
    documentId: string;
    accessContext: AccessContext;
    orderId?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * API response interface for T&C access tracking
 */
export interface TermsConditionsAccessResponse {
    accessId: string;
    documentId: string;
    accessedAt: string;
    success: boolean;
    message: string;
}

/**
 * Loading states for T&C operations
 */
export interface TermsConditionsLoadingState {
    isLoading: boolean;
    isUploading: boolean;
    isDeleting: boolean;
    isError: boolean;
    error?: Error | null;
}

/**
 * Hook return type for T&C data management
 */
export interface UseTermsConditionsReturn extends TermsConditionsLoadingState {
    document: TermsConditionsDocument | null;
    hasDocument: boolean;
    uploadDocument: (file: File) => Promise<TermsConditionsResponse>;
    deleteDocument: () => Promise<void>;
    getDocumentUrl: () => Promise<string>;
    trackAccess: (context: AccessContext, orderId?: string) => Promise<void>;
    refetch: () => void;
}

/**
 * Error types for T&C API operations
 */
export interface TermsConditionsApiError extends Error {
    status?: number;
    code?: string;
    details?: Record<string, any>;
}

/**
 * API error codes for T&C operations
 */
export const TermsConditionsErrorCodes = {
    INVALID_COMPANY_ID: 'INVALID_COMPANY_ID',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    MALWARE_DETECTED: 'MALWARE_DETECTED',
    DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
    ACCESS_DENIED: 'ACCESS_DENIED',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    DELETE_FAILED: 'DELETE_FAILED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Type for T&C error codes
 */
export type TermsConditionsErrorCode = typeof TermsConditionsErrorCodes[keyof typeof TermsConditionsErrorCodes];

/**
 * File validation configuration
 */
export interface FileValidationConfig {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    allowedExtensions: string[];
}

/**
 * Default file validation configuration for T&C documents
 */
export const DEFAULT_TC_FILE_VALIDATION: FileValidationConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['.pdf']
};

/**
 * File validation result
 */
export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Type guard to check if a T&C document is valid
 */
export function isValidTermsConditionsDocument(doc: any): doc is TermsConditionsDocument {
    return !!(
        doc &&
        typeof doc.id === 'string' &&
        typeof doc.companyId === 'string' &&
        typeof doc.fileName === 'string' &&
        typeof doc.originalFileName === 'string' &&
        typeof doc.fileSize === 'number' &&
        typeof doc.mimeType === 'string' &&
        typeof doc.url === 'string' &&
        typeof doc.uploadedAt === 'string' &&
        typeof doc.uploadedBy === 'string' &&
        typeof doc.isActive === 'boolean' &&
        typeof doc.version === 'number' &&
        typeof doc.checksum === 'string'
    );
}

/**
 * Utility function to validate file for T&C upload
 */
export function validateTermsConditionsFile(
    file: File,
    config: FileValidationConfig = DEFAULT_TC_FILE_VALIDATION
): FileValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > config.maxFileSize) {
        errors.push(`File size exceeds ${config.maxFileSize / (1024 * 1024)}MB limit`);
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.type)) {
        errors.push(`Invalid file type. Only ${config.allowedMimeTypes.join(', ')} files are allowed`);
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(fileExtension)) {
        errors.push(`Invalid file extension. Only ${config.allowedExtensions.join(', ')} files are allowed`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Utility function to format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Utility function to check if file is PDF
 */
export function isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || getFileExtension(file.name) === 'pdf';
}