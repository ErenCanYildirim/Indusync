/**
 * Terms & Conditions Components
 * 
 * This module exports all Terms & Conditions related components for easy importing
 * throughout the application.
 */

export { TermsConditionsUpload } from './terms-conditions-upload';
export { TermsConditionsViewer } from './terms-conditions-viewer';
export {
    TermsConditionsAccessButton,
    useTermsConditionsAvailability,
    CompactTermsConditionsButton
} from './terms-conditions-access-button';

// Re-export types for convenience
export type {
    TermsConditionsDocument,
    AccessContext,
    TermsConditionsResponse,
    GetTermsConditionsResponse,
    TermsConditionsAccessRequest,
    TermsConditionsAccessResponse,
    UseTermsConditionsReturn,
    FileValidationConfig,
    FileValidationResult
} from '@/lib/types/terms-conditions';

// Re-export utilities
export {
    validateTermsConditionsFile,
    formatFileSize,
    isPdfFile,
    DEFAULT_TC_FILE_VALIDATION
} from '@/lib/types/terms-conditions';