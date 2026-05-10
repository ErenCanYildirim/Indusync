/**
 * Document Display Utilities
 * Utility functions for formatting and displaying order documents
 * 
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

import type { OrderDocumentDto } from '@/lib/api/types'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Enhanced document display data with formatted fields
 */
export interface DocumentDisplayData {
    id: string
    fileName: string
    originalFileName: string
    documentType?: string
    description?: string
    fileSize: number
    contentType: string
    uploadedAt: string
    downloadUrl?: string
    // Formatted display fields
    formattedSize: string
    formattedDate: string
    fileIcon: string
}

/**
 * File type icon mapping result
 */
export interface FileTypeIcon {
    iconName: string
    color: string
    bgColor: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB", "256 KB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }

    // Format with appropriate decimal places
    const formattedSize = unitIndex === 0
        ? size.toString()
        : size.toFixed(size < 10 ? 1 : 0)

    return `${formattedSize} ${units[unitIndex]}`
}

/**
 * Format upload date for German locale with time
 * @param isoString - ISO date string from backend
 * @returns Formatted date string in German format
 */
export function formatUploadDate(isoString: string): string {
    try {
        const date = new Date(isoString)

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Ungültiges Datum'
        }

        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Berlin'
        })
    } catch (error) {
        console.error('Error formatting upload date:', error)
        return 'Ungültiges Datum'
    }
}

/**
 * Get appropriate file type icon based on content type
 * @param contentType - MIME type of the file
 * @returns Lucide icon name for the file type
 */
export function getFileTypeIcon(contentType: string): string {
    const type = contentType.toLowerCase()

    // PDF files
    if (type.includes('pdf')) {
        return 'FileText'
    }

    // Image files
    if (type.includes('image')) {
        return 'Image'
    }

    // Word documents
    if (type.includes('word') || type.includes('msword') ||
        type.includes('officedocument.wordprocessingml')) {
        return 'FileText'
    }

    // Excel files
    if (type.includes('excel') || type.includes('spreadsheet') ||
        type.includes('officedocument.spreadsheetml')) {
        return 'Sheet'
    }

    // PowerPoint files
    if (type.includes('powerpoint') || type.includes('presentation') ||
        type.includes('officedocument.presentationml')) {
        return 'Presentation'
    }

    // Archive files
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') ||
        type.includes('tar') || type.includes('gzip')) {
        return 'Archive'
    }

    // Video files
    if (type.includes('video')) {
        return 'Video'
    }

    // Audio files
    if (type.includes('audio')) {
        return 'Music'
    }

    // Text files
    if (type.includes('text') || type.includes('plain')) {
        return 'FileText'
    }

    // Default file icon
    return 'File'
}

/**
 * Get file type icon with color information for enhanced display
 * @param contentType - MIME type of the file
 * @returns Object with icon name and color information
 */
export function getFileTypeIconWithColor(contentType: string): FileTypeIcon {
    const type = contentType.toLowerCase()

    // PDF files - red theme
    if (type.includes('pdf')) {
        return {
            iconName: 'FileText',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        }
    }

    // Image files - green theme
    if (type.includes('image')) {
        return {
            iconName: 'Image',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        }
    }

    // Word documents - blue theme
    if (type.includes('word') || type.includes('msword') ||
        type.includes('officedocument.wordprocessingml')) {
        return {
            iconName: 'FileText',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        }
    }

    // Excel files - green theme
    if (type.includes('excel') || type.includes('spreadsheet') ||
        type.includes('officedocument.spreadsheetml')) {
        return {
            iconName: 'Sheet',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        }
    }

    // PowerPoint files - orange theme
    if (type.includes('powerpoint') || type.includes('presentation') ||
        type.includes('officedocument.presentationml')) {
        return {
            iconName: 'Presentation',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        }
    }

    // Archive files - purple theme
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') ||
        type.includes('tar') || type.includes('gzip')) {
        return {
            iconName: 'Archive',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        }
    }

    // Video files - pink theme
    if (type.includes('video')) {
        return {
            iconName: 'Video',
            color: 'text-pink-600',
            bgColor: 'bg-pink-50'
        }
    }

    // Audio files - yellow theme
    if (type.includes('audio')) {
        return {
            iconName: 'Music',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        }
    }

    // Text files - gray theme
    if (type.includes('text') || type.includes('plain')) {
        return {
            iconName: 'FileText',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
        }
    }

    // Default file icon - gray theme
    return {
        iconName: 'File',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
    }
}

/**
 * Transform OrderDocumentDto to DocumentDisplayData with formatted fields
 * @param document - Raw document data from API
 * @returns Enhanced document data with formatted display fields
 */
export function transformDocumentForDisplay(document: OrderDocumentDto): DocumentDisplayData {
    return {
        ...document,
        formattedSize: formatFileSize(document.fileSize),
        formattedDate: formatUploadDate(document.uploadedAt),
        fileIcon: getFileTypeIcon(document.contentType)
    }
}

/**
 * Transform array of OrderDocumentDto to DocumentDisplayData array
 * @param documents - Array of raw document data from API
 * @returns Array of enhanced document data with formatted display fields
 */
export function transformDocumentsForDisplay(documents: OrderDocumentDto[]): DocumentDisplayData[] {
    return documents.map(transformDocumentForDisplay)
}

/**
 * Check if a file type is supported for preview
 * @param contentType - MIME type of the file
 * @returns True if file can be previewed in browser
 */
export function isPreviewableFileType(contentType: string): boolean {
    const type = contentType.toLowerCase()

    // Images can be previewed
    if (type.includes('image')) {
        return true
    }

    // PDFs can be previewed
    if (type.includes('pdf')) {
        return true
    }

    // Text files can be previewed
    if (type.includes('text/plain')) {
        return true
    }

    return false
}

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns File extension without dot, or empty string if no extension
 */
export function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
        return ''
    }
    return filename.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * Validate file size against maximum allowed size
 * @param fileSize - Size in bytes
 * @param maxSizeMB - Maximum allowed size in MB (default: 10MB)
 * @returns True if file size is within limits
 */
export function isValidFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return fileSize <= maxSizeBytes
}

/**
 * Get human-readable file type description
 * @param contentType - MIME type of the file
 * @returns User-friendly description of file type
 */
export function getFileTypeDescription(contentType: string): string {
    const type = contentType.toLowerCase()

    if (type.includes('pdf')) return 'PDF-Dokument'
    if (type.includes('image/jpeg') || type.includes('image/jpg')) return 'JPEG-Bild'
    if (type.includes('image/png')) return 'PNG-Bild'
    if (type.includes('image/gif')) return 'GIF-Bild'
    if (type.includes('image/svg')) return 'SVG-Grafik'
    if (type.includes('image')) return 'Bilddatei'

    if (type.includes('msword') || type.includes('officedocument.wordprocessingml')) {
        return 'Word-Dokument'
    }
    if (type.includes('excel') || type.includes('officedocument.spreadsheetml')) {
        return 'Excel-Tabelle'
    }
    if (type.includes('powerpoint') || type.includes('officedocument.presentationml')) {
        return 'PowerPoint-Präsentation'
    }

    if (type.includes('zip')) return 'ZIP-Archiv'
    if (type.includes('rar')) return 'RAR-Archiv'
    if (type.includes('7z')) return '7Z-Archiv'

    if (type.includes('video')) return 'Videodatei'
    if (type.includes('audio')) return 'Audiodatei'
    if (type.includes('text')) return 'Textdatei'

    return 'Datei'
}