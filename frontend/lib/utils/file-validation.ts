/**
 * Comprehensive File Validation Utilities for Terms & Conditions
 * 
 * This module provides client-side and server-side validation utilities for T&C document uploads
 * with security-focused validation, malware scanning integration, and proper error handling.
 * 
 * Security Features:
 * - File type validation (MIME type and extension)
 * - File size validation with configurable limits
 * - Content validation for PDF files
 * - Malware scanning integration placeholder
 * - Security violation error handling
 * - Rate limiting support
 * - File content analysis
 */

import { DEFAULT_TC_FILE_VALIDATION, type FileValidationConfig, type FileValidationResult } from '@/lib/types/terms-conditions'

/**
 * Security validation error codes
 */
export const SecurityErrorCodes = {
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    MALWARE_DETECTED: 'MALWARE_DETECTED',
    SUSPICIOUS_CONTENT: 'SUSPICIOUS_CONTENT',
    CORRUPTED_FILE: 'CORRUPTED_FILE',
    INVALID_PDF_STRUCTURE: 'INVALID_PDF_STRUCTURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SECURITY_VIOLATION: 'SECURITY_VIOLATION'
} as const

export type SecurityErrorCode = typeof SecurityErrorCodes[keyof typeof SecurityErrorCodes]

/**
 * Security validation error class
 */
export class FileSecurityError extends Error {
    constructor(
        public code: SecurityErrorCode,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message)
        this.name = 'FileSecurityError'
    }
}

/**
 * Advanced file validation result with security details
 */
export interface SecurityValidationResult extends FileValidationResult {
    securityChecks: {
        mimeTypeValid: boolean
        extensionValid: boolean
        sizeValid: boolean
        contentValid: boolean
        malwareScanPassed: boolean
        structureValid: boolean
    }
    warnings: string[]
    securityScore: number // 0-100, higher is more secure
}

/**
 * Rate limiting tracker for file uploads
 */
class UploadRateLimiter {
    private attempts: Map<string, number[]> = new Map()
    private readonly maxAttempts = 5
    private readonly windowMs = 15 * 60 * 1000 // 15 minutes

    checkRateLimit(identifier: string): boolean {
        const now = Date.now()
        const attempts = this.attempts.get(identifier) || []

        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => now - time < this.windowMs)

        if (recentAttempts.length >= this.maxAttempts) {
            return false // Rate limit exceeded
        }

        // Add current attempt
        recentAttempts.push(now)
        this.attempts.set(identifier, recentAttempts)

        return true
    }

    getRemainingAttempts(identifier: string): number {
        const attempts = this.attempts.get(identifier) || []
        const now = Date.now()
        const recentAttempts = attempts.filter(time => now - time < this.windowMs)
        return Math.max(0, this.maxAttempts - recentAttempts.length)
    }
}

const rateLimiter = new UploadRateLimiter()

/**
 * Validate file MIME type against allowed types
 */
function validateMimeType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
}

/**
 * Validate file extension against allowed extensions
 */
function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    const extension = '.' + filename.split('.').pop()?.toLowerCase()
    return allowedExtensions.includes(extension)
}

/**
 * Validate file size against maximum limit
 */
function validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize
}

/**
 * Validate PDF file structure by checking magic bytes
 */
async function validatePdfStructure(file: File): Promise<boolean> {
    try {
        // Read first few bytes to check PDF magic number
        const buffer = await file.slice(0, 8).arrayBuffer()
        const bytes = new Uint8Array(buffer)

        // PDF files should start with %PDF-
        const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D] // %PDF-

        for (let i = 0; i < pdfMagic.length; i++) {
            if (bytes[i] !== pdfMagic[i]) {
                return false
            }
        }

        return true
    } catch (error) {
        console.error('Error validating PDF structure:', error)
        return false
    }
}

/**
 * Perform basic content analysis for suspicious patterns
 */
async function analyzeFileContent(file: File): Promise<{ isValid: boolean, warnings: string[] }> {
    const warnings: string[] = []

    try {
        // Check for suspicious file names
        const suspiciousPatterns = [
            /script/i,
            /executable/i,
            /\.exe$/i,
            /\.bat$/i,
            /\.cmd$/i,
            /\.scr$/i,
            /\.com$/i,
            /\.pif$/i
        ]

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(file.name)) {
                warnings.push(`Suspicious filename pattern detected: ${file.name}`)
            }
        }

        // Check file size anomalies
        if (file.size === 0) {
            warnings.push('File appears to be empty')
            return { isValid: false, warnings }
        }

        if (file.size < 100) {
            warnings.push('File is unusually small for a PDF document')
        }

        // For PDF files, do additional checks
        if (file.type === 'application/pdf') {
            const isValidPdf = await validatePdfStructure(file)
            if (!isValidPdf) {
                warnings.push('File does not appear to be a valid PDF document')
                return { isValid: false, warnings }
            }
        }

        return { isValid: true, warnings }
    } catch (error) {
        console.error('Error analyzing file content:', error)
        warnings.push('Unable to analyze file content')
        return { isValid: false, warnings }
    }
}


/**
 * Malware scanning integration placeholder
 * TODO: Integrate with a real malware scanning service
 */
async function performMalwareScan(file: File): Promise<{ passed: boolean, details?: string }> {
    // Later integrate with:
    // - ClamAV
    // - VirusTotal API
    // - AWS GuardDuty
    // - Azure Defender
    // - Google Cloud Security Command Center

    try {
        // Simulate malware scan delay
        await new Promise(resolve => setTimeout(resolve, 100))

        // Basic heuristic checks
        const suspiciousIndicators = [
            file.name.toLowerCase().includes('virus'),
            file.name.toLowerCase().includes('malware'),
            file.name.toLowerCase().includes('trojan'),
            file.size > 50 * 1024 * 1024, // Unusually large for T&C
        ]

        const suspiciousCount = suspiciousIndicators.filter(Boolean).length

        if (suspiciousCount > 0) {
            return {
                passed: false,
                details: `File flagged by ${suspiciousCount} heuristic check(s)`
            }
        }

        return { passed: true }
    } catch (error) {
        console.error('Malware scan error:', error)
        // In case of scan failure, err on the side of caution
        return {
            passed: false,
            details: 'Malware scan service unavailable'
        }
    }
}

/**
 * Calculate security score based on validation results
 */
function calculateSecurityScore(checks: SecurityValidationResult['securityChecks']): number {
    const weights = {
        mimeTypeValid: 20,
        extensionValid: 15,
        sizeValid: 15,
        contentValid: 20,
        malwareScanPassed: 25,
        structureValid: 5
    }

    let score = 0
    let totalWeight = 0

    for (const [check, weight] of Object.entries(weights)) {
        totalWeight += weight
        if (checks[check as keyof typeof checks]) {
            score += weight
        }
    }

    return Math.round((score / totalWeight) * 100)
}


 * Comprehensive client-side file validation for Terms & Conditions documents
 * 
 * This function performs extensive validation including:
 * - Basic file validation (type, size, extension)
 * - PDF structure validation
 * - Content analysis for suspicious patterns
 * - Malware scanning (placeholder)
 * - Rate limiting checks
 * 
 * @param file - The file to validate
 * @param config - Validation configuration (optional)
 * @param userIdentifier - User identifier for rate limiting (optional)
 * @returns Promise<SecurityValidationResult> - Comprehensive validation result
 */
export async function validateTermsConditionsFileSecurity(
    file: File,
    config: FileValidationConfig = DEFAULT_TC_FILE_VALIDATION,
    userIdentifier?: string
): Promise<SecurityValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Initialize security checks
    const securityChecks = {
        mimeTypeValid: false,
        extensionValid: false,
        sizeValid: false,
        contentValid: false,
        malwareScanPassed: false,
        structureValid: false
    }

    try {
        // Rate limiting check
        if (userIdentifier && !rateLimiter.checkRateLimit(userIdentifier)) {
            const remaining = rateLimiter.getRemainingAttempts(userIdentifier)
            throw new FileSecurityError(
                SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                `Upload rate limit exceeded. ${remaining} attempts remaining.`,
                { remainingAttempts: remaining }
            )
        }

        // Basic validation checks
        securityChecks.mimeTypeValid = validateMimeType(file, config.allowedMimeTypes)
        if (!securityChecks.mimeTypeValid) {
            errors.push(`Invalid file type. Only ${config.allowedMimeTypes.join(', ')} files are allowed`)
        }

        securityChecks.extensionValid = validateFileExtension(file.name, config.allowedExtensions)
        if (!securityChecks.extensionValid) {
            errors.push(`Invalid file extension. Only ${config.allowedExtensions.join(', ')} files are allowed`)
        }

        securityChecks.sizeValid = validateFileSize(file, config.maxFileSize)
        if (!securityChecks.sizeValid) {
            errors.push(`File size exceeds ${Math.round(config.maxFileSize / (1024 * 1024))}MB limit`)
        }

        // PDF structure validation
        if (file.type === 'application/pdf') {
            securityChecks.structureValid = await validatePdfStructure(file)
            if (!securityChecks.structureValid) {
                errors.push('File does not appear to be a valid PDF document')
            }
        } else {
            securityChecks.structureValid = true // Not applicable for non-PDF files
        }

        // Content analysis
        const contentAnalysis = await analyzeFileContent(file)
        securityChecks.contentValid = contentAnalysis.isValid
        warnings.push(...contentAnalysis.warnings)

        if (!securityChecks.contentValid) {
            errors.push('File content analysis failed security checks')
        }

        // Malware scanning
        const malwareScan = await performMalwareScan(file)
        securityChecks.malwareScanPassed = malwareScan.passed

        if (!securityChecks.malwareScanPassed) {
            errors.push(`Security scan failed: ${malwareScan.details || 'Unknown threat detected'}`)
        }

        // Calculate security score
        const securityScore = calculateSecurityScore(securityChecks)

        // Add warning for low security scores
        if (securityScore < 80) {
            warnings.push(`File has a low security score (${securityScore}/100)`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            securityChecks,
            securityScore
        }

    } catch (error) {
        if (error instanceof FileSecurityError) {
            throw error
        }

        // Handle unexpected errors
        console.error('Unexpected error during file validation:', error)
        throw new FileSecurityError(
            SecurityErrorCodes.SECURITY_VIOLATION,
            'An unexpected error occurred during security validation',
            { originalError: error }
        )
    }
}


/**
 * Quick client-side validation for immediate feedback
 * This is a lighter version for real-time validation during file selection
 */
export function validateTermsConditionsFileQuick(
    file: File,
    config: FileValidationConfig = DEFAULT_TC_FILE_VALIDATION
): FileValidationResult {
    const errors: string[] = []

    // Basic checks only for quick validation
    if (!validateMimeType(file, config.allowedMimeTypes)) {
        errors.push(`Invalid file type. Only ${config.allowedMimeTypes.join(', ')} files are allowed`)
    }

    if (!validateFileExtension(file.name, config.allowedExtensions)) {
        errors.push(`Invalid file extension. Only ${config.allowedExtensions.join(', ')} files are allowed`)
    }

    if (!validateFileSize(file, config.maxFileSize)) {
        errors.push(`File size exceeds ${Math.round(config.maxFileSize / (1024 * 1024))}MB limit`)
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Server-side validation helper (for use in API routes)
 * This would be used in Next.js API routes for server-side validation
 */
export async function validateTermsConditionsFileServer(
    file: File | Buffer,
    filename: string,
    mimeType: string,
    config: FileValidationConfig = DEFAULT_TC_FILE_VALIDATION
): Promise<SecurityValidationResult> {
    // This would implement server-side specific validation
    // For now, return a basic implementation
    const errors: string[] = []
    const warnings: string[] = []

    const securityChecks = {
        mimeTypeValid: config.allowedMimeTypes.includes(mimeType),
        extensionValid: validateFileExtension(filename, config.allowedExtensions),
        sizeValid: true, // Would check actual file size
        contentValid: true, // Would perform server-side content analysis
        malwareScanPassed: true, // Would integrate with server-side malware scanner
        structureValid: true // Would validate file structure on server
    }

    if (!securityChecks.mimeTypeValid) {
        errors.push(`Invalid MIME type: ${mimeType}`)
    }

    if (!securityChecks.extensionValid) {
        errors.push(`Invalid file extension for: ${filename}`)
    }

    const securityScore = calculateSecurityScore(securityChecks)

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityChecks,
        securityScore
    }
}


/**
 * Get remaining upload attempts for rate limiting
 */
export function getRemainingUploadAttempts(userIdentifier: string): number {
    return rateLimiter.getRemainingAttempts(userIdentifier)
}

/**
 * Utility function to format security validation errors for user display
 */
export function formatSecurityErrors(result: SecurityValidationResult): string[] {
    const userFriendlyErrors: string[] = []

    for (const error of result.errors) {
        if (error.includes('Invalid file type')) {
            userFriendlyErrors.push('Please select a PDF file for your Terms & Conditions document.')
        } else if (error.includes('File size exceeds')) {
            userFriendlyErrors.push('The file is too large. Please ensure your PDF is under 10MB.')
        } else if (error.includes('Security scan failed')) {
            userFriendlyErrors.push('The file failed security checks. Please try a different document.')
        } else if (error.includes('not appear to be a valid PDF')) {
            userFriendlyErrors.push('The file appears to be corrupted or is not a valid PDF document.')
        } else {
            userFriendlyErrors.push(error)
        }
    }

    return userFriendlyErrors
}

/**
 * Export rate limiter for testing
 */
export { rateLimiter }