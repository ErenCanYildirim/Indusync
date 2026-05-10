/**
 * Project Creation Hook
 * Integrates ProjectCreationStepper with backend Orders API including document management
 * 
 * @author IndusSync Frontend Team
 * @since Backend Integration Rework
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ordersApi } from '@/lib/api/orders'
import { CreateOrderRequest, OrderDetailResponse } from '@/lib/api/types'
import { useUploadOrderDocument, usePublishOrder } from '@/lib/hooks/useOrders'
import { toast } from 'sonner'

// Interface matching ProjectCreationStepper form data
export interface ProjectFormData {
    projectName: string;
    contactPersons: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
    }>;
    orderCategories: string[];
    selectedIndustries: string[];
    placementTypes: string[];
    documents: File[];
    verifications: string[];
    certifications: string[];
    specializations: string[];
    selectedSpecializations: string[];
    location: string;
    // Enhanced address fields for backend integration
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    radius: number;
    isUnlimitedRadius: boolean;
    startDate?: Date;
    endDate?: Date;
    responseTime: string;
    customResponseDays?: string;
    customIndustry?: string;
}

// Validation error interface
export interface ValidationErrors {
    [key: string]: string;
}

/**
 * Maps ProjectCreationStepper form data to backend CreateOrderCommand
 */
function mapProjectDataToOrderRequest(data: ProjectFormData, isDraft: boolean = false): CreateOrderRequest {
    // Use primary contact person
    const primaryContact = data.contactPersons[0] || { name: '', email: '', phone: '' };

    // Map categories (use first one as primary, rest as additional)
    const primaryCategory = data.orderCategories[0] || 'OTHER';
    const additionalCategories = data.orderCategories.slice(1);

    // Map frontend industry values to German display names
    const mapIndustryToGermanName = (frontendValue: string): string => {
        const mapping: { [key: string]: string } = {
            'plant-engineering': 'Maschinenbau',
            'healthcare': 'Krankenhäuser',
            'agriculture-resources': 'Sonstiges',
            'mining': 'Bergbau',
            'manufacturing': 'Allgemeine Fertigung',
            'automotive': 'Automobilindustrie',
            'mechanical-engineering': 'Maschinenbau',
            'chemical': 'Chemische Industrie',
            'electrical': 'Elektronikindustrie',
            'metal': 'Stahl- und Metallindustrie',
            'food-beverage': 'Lebensmittel und Getränke',
            'pharmaceutical': 'Pharmaindustrie',
            'construction': 'Bauwesen',
            'energy': 'Energieerzeugung',
            'renewable-energy': 'Erneuerbare Energien',
            'transportation': 'Transport und Logistik',
            'other': 'Sonstiges'
        };
        return mapping[frontendValue] || 'Allgemeine Fertigung';
    };

    // Map frontend placement types to German display names
    const mapPlacementTypeToGermanName = (frontendValue: string): string => {
        const mapping: { [key: string]: string } = {
            'public': 'Werkvertrag',
            'private': 'Dienstleistungsvertrag',
            'direct': 'Direktvermittlung'
        };
        return mapping[frontendValue] || 'Werkvertrag';
    };

    // Ensure required fields have valid values
    const title = data.projectName?.trim();
    const contactName = primaryContact.name?.trim();
    const contactEmail = primaryContact.email?.trim();
    const street = data.street?.trim();
    const houseNumber = data.houseNumber?.trim();
    const postalCode = data.postalCode?.trim();
    const city = data.city?.trim();
    const country = data.country?.trim() || 'Deutschland';

    // For published orders, validate required fields strictly
    if (!isDraft) {
        // Validate required fields before submission (@NotBlank backend validation)
        if (!title) {
            throw new Error('Projektname ist erforderlich');
        }
        if (!contactName) {
            throw new Error('Name des Ansprechpartners ist erforderlich');
        }
        if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            throw new Error('Gültige E-Mail des Ansprechpartners ist erforderlich');
        }
        if (!street) {
            throw new Error('Straße ist erforderlich');
        }
        if (!houseNumber) {
            throw new Error('Hausnummer ist erforderlich');
        }
        if (!postalCode || !/^\d{5}$/.test(postalCode)) {
            throw new Error('Gültige 5-stellige Postleitzahl ist erforderlich');
        }
        if (!city) {
            throw new Error('Stadt ist erforderlich');
        }

        // Ensure coordinates are valid (required by backend @NotNull)
        if (!data.latitude || !data.longitude || (data.latitude === 0 && data.longitude === 0)) {
            throw new Error('GPS-Koordinaten sind erforderlich. Bitte wählen Sie eine Adresse aus der Autocomplete-Liste.');
        }

        // Validate required collections (@NotEmpty backend validation)
        if (!data.orderCategories || data.orderCategories.length === 0) {
            throw new Error('Mindestens eine Auftragskategorie ist erforderlich');
        }
        if (!data.selectedIndustries || data.selectedIndustries.length === 0) {
            throw new Error('Mindestens eine Branche ist erforderlich');
        }
        if (!data.placementTypes || data.placementTypes.length === 0) {
            throw new Error('Mindestens eine Auftragsart ist erforderlich');
        }
    }

    // For drafts, ensure all required fields have valid values (backend has strict @NotBlank/@NotNull)
    // Use reasonable defaults/placeholders where user hasn't provided values yet
    const locationLat = data.latitude || 50.1109; // Default to Frankfurt coordinates if not set
    const locationLng = data.longitude || 8.6821;

    // Ensure email is valid format even for drafts
    const validEmail = contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
        ? contactEmail
        : 'draft@temp-indusync.com';

    // Ensure postal code is 5 digits even for drafts  
    const validPostalCode = postalCode && /^\d{5}$/.test(postalCode)
        ? postalCode
        : '60000'; // Default Frankfurt postal code

    // Enhanced request mapping with all required backend fields
    const orderRequest: CreateOrderRequest = {
        title: title || 'Neuer Auftrag',
        description: `Auftrag in den Kategorien: ${data.orderCategories.join(', ')}`,

        // Contact information (use defaults for drafts)
        contactName: contactName || 'TBD',
        contactEmail: validEmail,
        contactPhone: primaryContact.phone?.trim() || '',

        // Service address (use defaults for drafts)
        street: street || 'TBD',
        houseNumber: houseNumber || '0',
        postalCode: validPostalCode,
        city: city || 'TBD',
        country: country,

        // Geographic coordinates
        locationLat: locationLat,
        locationLng: locationLng,

        // Search configuration
        searchRadiusKm: data.isUnlimitedRadius ? 1000 : (data.radius || 50),

        // Categories & classification (provide defaults for drafts)
        primaryCategory: primaryCategory,
        additionalCategories: additionalCategories.length > 0 ? additionalCategories : undefined,
        targetIndustries: data.selectedIndustries.length > 0 ? data.selectedIndustries.map(mapIndustryToGermanName) : ['Sonstiges'],
        placementTypes: data.placementTypes.length > 0 ? data.placementTypes.map(mapPlacementTypeToGermanName) : ['Werkvertrag'],

        // Skills & requirements (optional fields)
        requiredSpecializations: data.selectedSpecializations.length > 0 ? data.selectedSpecializations : undefined,
        requiredSkills: data.verifications.length > 0 ? data.verifications : undefined,
        requiredVerifications: data.verifications.length > 0 ? data.verifications : undefined,
        requiredCertifications: data.certifications.length > 0 ? data.certifications : undefined,

        // Timeline & urgency
        urgency: 'MEDIUM' as const,
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        deadline: data.endDate ? data.endDate.toISOString() : undefined,
        responseTimeHours: data.responseTime ? parseInt(data.responseTime) * 24 : 168, // Default to 7 days
    };

    return orderRequest;
}

/**
 * Enhanced validation functions
 */
export function validateStep1(data: ProjectFormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.projectName?.trim()) {
        errors.projectName = 'Projektname ist erforderlich';
    }

    if (!data.orderCategories || data.orderCategories.length === 0) {
        errors.orderCategories = 'Mindestens eine Auftragskategorie ist erforderlich';
    }

    // Validate primary contact person
    const primaryContact = data.contactPersons?.[0];
    if (!primaryContact?.name?.trim()) {
        errors.contactName = 'Name des Ansprechpartners ist erforderlich';
    }

    if (!primaryContact?.email?.trim()) {
        errors.contactEmail = 'E-Mail des Ansprechpartners ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContact.email)) {
        errors.contactEmail = 'Ungültige E-Mail-Adresse';
    }

    return errors;
}

export function validateStep2(data: ProjectFormData): ValidationErrors {
    const errors: ValidationErrors = {};

    // Validate address components
    if (!data.street?.trim()) {
        errors.street = 'Straße ist erforderlich';
    }

    if (!data.houseNumber?.trim()) {
        errors.houseNumber = 'Hausnummer ist erforderlich';
    }

    if (!data.postalCode?.trim()) {
        errors.postalCode = 'Postleitzahl ist erforderlich';
    } else if (!/^\d{5}$/.test(data.postalCode)) {
        errors.postalCode = 'Postleitzahl muss 5 Ziffern haben';
    }

    if (!data.city?.trim()) {
        errors.city = 'Stadt ist erforderlich';
    }

    // Validate coordinates - they are required for the backend
    if (!data.latitude || !data.longitude || (data.latitude === 0 && data.longitude === 0)) {
        errors.coordinates = 'GPS-Koordinaten sind erforderlich. Bitte wählen Sie eine Adresse aus der Autocomplete-Liste.';
    }

    return errors;
}

export function validateStep3(data: ProjectFormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (data.selectedIndustries.length === 0) {
        errors.selectedIndustries = 'Mindestens eine Branche ist erforderlich';
    }

    if (data.placementTypes.length === 0) {
        errors.placementTypes = 'Mindestens eine Auftragsart ist erforderlich';
    }

    return errors;
}

export function validateStep4(data: ProjectFormData): ValidationErrors {
    const errors: ValidationErrors = {};

    // Documents are optional, but if uploaded, validate file types
    if (data.documents && data.documents.length > 0) {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        const invalidFiles = data.documents.filter(file => !allowedTypes.includes(file.type));

        if (invalidFiles.length > 0) {
            errors.documents = 'Nur PDF, Word, und Bilddateien sind erlaubt';
        }

        // Check file size (max 10MB per file)
        const oversizedFiles = data.documents.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            errors.documentSize = 'Dateien dürfen maximal 10MB groß sein';
        }
    }

    return errors;
}

export function validateAllSteps(data: ProjectFormData): ValidationErrors {
    return {
        ...validateStep1(data),
        ...validateStep2(data),
        ...validateStep3(data),
        ...validateStep4(data)
    };
}

/**
 * Enhanced Project Creation Hook with full backend integration
 */
export function useProjectCreation(editMode: boolean = false, editOrderId?: string) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    // Use order hooks for document and publish operations
    const uploadDocument = useUploadOrderDocument();
    const publishOrder = usePublishOrder();

    /**
     * Validates a specific step
     */
    const validateStep = (step: number, data: ProjectFormData): boolean => {
        let stepErrors: ValidationErrors = {};

        switch (step) {
            case 0:
                stepErrors = validateStep1(data);
                break;
            case 1:
                stepErrors = validateStep2(data);
                break;
            case 2:
                stepErrors = validateStep3(data);
                break;
            case 3:
                stepErrors = validateStep4(data);
                break;
            default:
                stepErrors = {};
        }

        setValidationErrors(stepErrors);

        if (Object.keys(stepErrors).length > 0) {
            const firstError = Object.values(stepErrors)[0];
            toast.error(firstError);
            return false;
        }

        return true;
    };

    /**
     * Uploads documents for an order
     */
    const uploadOrderDocuments = async (orderId: string, documents: File[]): Promise<boolean> => {
        if (!documents || documents.length === 0) {
            return true; // No documents to upload
        }

        try {
            const uploadPromises = documents.map(async (file) => {
                return uploadDocument.mutateAsync({
                    orderId,
                    file,
                    documentType: 'ATTACHMENT',
                    description: `Projektdokument: ${file.name}`
                });
            });

            await Promise.all(uploadPromises);
            return true;
        } catch (error) {
            console.error('Error uploading documents:', error);
            throw new Error('Fehler beim Hochladen der Dokumente');
        }
    };

    /**
     * Creates a project with full workflow: order creation + document upload
     */
    const createProject = async (formData: ProjectFormData): Promise<string | null> => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Final validation before submission
            const finalErrors = validateAllSteps(formData);
            if (Object.keys(finalErrors).length > 0) {
                setValidationErrors(finalErrors);
                const firstError = Object.values(finalErrors)[0];
                toast.error(`Validierungsfehler: ${firstError}`);
                return null;
            }

            // Step 1: Create or update the order as draft
            const orderRequest = mapProjectDataToOrderRequest(formData, true);

            console.log('=== DEBUG: Creating Project Order ===');
            console.log('Order Request:', JSON.stringify(orderRequest, null, 2));

            const response = editMode && editOrderId
                ? await ordersApi.updateOrder(editOrderId, orderRequest)
                : await ordersApi.createDraft(orderRequest);
            const savedId = editMode && editOrderId ? editOrderId : response.id;
            setCreatedOrderId(savedId);

            // Step 2: Upload documents if any
            if (formData.documents && formData.documents.length > 0) {
                await uploadOrderDocuments(savedId, formData.documents);
            }

            toast.success(editMode ? 'Entwurf aktualisiert!' : 'Auftrag erfolgreich erstellt!');
            router.push('/dashboard/auftraege');

            return savedId;
        } catch (err) {
            console.error('Project creation error:', err);

            // Handle validation errors without navigation
            if (err instanceof Error && err.message.includes('Validierungsfehler')) {
                setError(err.message);
                toast.error(err.message);
                return null; // Don't navigate, stay on form
            }

            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen des Auftrags';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Saves as draft with minimal validation
     */
    const saveDraft = async (formData: ProjectFormData): Promise<string | null> => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Less strict validation for draft - only check required fields
            const step1Errors = validateStep1(formData);
            if (Object.keys(step1Errors).length > 0) {
                setValidationErrors(step1Errors);
                const firstError = Object.values(step1Errors)[0];
                toast.error(`Mindestanforderungen für Entwurf: ${firstError}`);
                return null;
            }

            // Create the order as draft
            const orderRequest = mapProjectDataToOrderRequest(formData, true);

            console.log('=== DEBUG: Saving Draft / Updating Order ===');
            console.log('Order Request:', JSON.stringify(orderRequest, null, 2));

            const response = editMode && editOrderId
                ? await ordersApi.updateOrder(editOrderId, orderRequest)
                : await ordersApi.createDraft(orderRequest);
            const savedId = editMode && editOrderId ? editOrderId : response.id;
            setCreatedOrderId(savedId);

            // Upload documents if any (optional for draft)
            if (formData.documents && formData.documents.length > 0) {
                try {
                    await uploadOrderDocuments(savedId, formData.documents);
                } catch (uploadError) {
                    // Don't fail draft creation if document upload fails
                    console.warn('Document upload failed for draft:', uploadError);
                    toast.warning('Entwurf gespeichert, aber Dokumente konnten nicht hochgeladen werden');
                }
            }

            toast.success('Entwurf gespeichert!');
            return response.id;
        } catch (err) {
            console.error('Draft creation error:', err);

            // Handle validation errors without navigation
            if (err instanceof Error && err.message.includes('Validierungsfehler')) {
                setError(err.message);
                toast.error(err.message);
                return null; // Don't navigate, stay on form
            }

            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Speichern des Entwurfs';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Creates and immediately publishes an order
     */
    const createAndPublishProject = async (formData: ProjectFormData): Promise<string | null> => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Full validation required for publishing
            const finalErrors = validateAllSteps(formData);
            if (Object.keys(finalErrors).length > 0) {
                setValidationErrors(finalErrors);
                const firstError = Object.values(finalErrors)[0];
                toast.error(`Validierungsfehler: ${firstError}`);
                return null;
            }

            // Step 1: Create the order as draft
            const orderRequest = mapProjectDataToOrderRequest(formData, false);

            console.log('=== DEBUG: Creating/Updating and Publishing Order ===');
            console.log('Order Request:', JSON.stringify(orderRequest, null, 2));

            const draftResponse = editMode && editOrderId
                ? await ordersApi.updateOrder(editOrderId, orderRequest)
                : await ordersApi.createDraft(orderRequest);

            const savedId = editMode && editOrderId ? editOrderId : draftResponse.id;
            setCreatedOrderId(savedId);

            // Step 2: Upload documents
            if (formData.documents && formData.documents.length > 0) {
                await uploadOrderDocuments(savedId, formData.documents);
            }

            // Step 3: Publish the order
            await publishOrder.mutateAsync(savedId);

            toast.success(editMode ? 'Auftrag aktualisiert und veröffentlicht!' : 'Auftrag erstellt und veröffentlicht!');
            router.push('/dashboard/auftraege');

            return savedId;
        } catch (err) {
            console.error('Create and publish error:', err);

            // Handle validation errors without navigation
            if (err instanceof Error && err.message.includes('Validierungsfehler')) {
                setError(err.message);
                toast.error(err.message);
                return null; // Don't navigate, stay on form
            }

            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen und Veröffentlichen';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Publishes an existing order
     */
    const publishExistingOrder = async (orderId: string): Promise<boolean> => {
        try {
            await publishOrder.mutateAsync(orderId);
            toast.success('Auftrag veröffentlicht!');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Veröffentlichen';
            toast.error(errorMessage);
            return false;
        }
    };

    const clearValidationErrors = () => {
        setValidationErrors({});
    };

    return {
        // Core operations
        createProject,
        saveDraft,
        createAndPublishProject,
        publishExistingOrder,

        // Validation
        validateStep,

        // State
        isSubmitting: isSubmitting || uploadDocument.isPending || publishOrder.isPending,
        error,
        validationErrors,
        createdOrderId,

        // Actions
        clearError: () => setError(null),
        clearValidationErrors,
    };
} 