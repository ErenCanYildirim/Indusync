import { z } from 'zod';
import type { Address } from './company-profile';

/**
 * Business role enumeration matching backend BusinessRole enum.
 * Represents the roles that companies can have on the platform.
 */
export enum BusinessRole {
    /** Auftraggeber (Client) role - can create orders and hire service providers */
    AUFTRAGGEBER = "AUFTRAGGEBER",
    /** Auftragnehmer (Contractor) role - can provide services and fulfill orders */
    AUFTRAGNEHMER = "AUFTRAGNEHMER",
}

/**
 * Interface representing the current role state of a company.
 * Used to track which business roles a company currently has.
 */
export interface CompanyRoles {
    /** Whether the company has Auftraggeber (client) role */
    isAuftraggeber: boolean;
    /** Whether the company has Auftragnehmer (contractor) role */
    isAuftragnehmer: boolean;
}

/**
 * Interface for role requirement data.
 * Provides information about what fields and documents are required for each role.
 */
export interface RoleRequirements {
    /** The business role these requirements apply to */
    role: BusinessRole;
    /** List of required field names */
    requiredFields: string[];
    /** List of optional field names */
    optionalFields: string[];
    /** Human-readable description of the role */
    description: string;
    /** Whether this role follows the registration flow pattern */
    followsRegistrationFlow: boolean;
}

/**
 * Schema for adding a business role to a company.
 * Extends registration form types with role-specific fields.
 */
export const AddBusinessRoleSchema = z.object({
    /** The business role being added */
    role: z.nativeEnum(BusinessRole),

    // Fields from registration form for Auftragnehmer role
    /** List of company specializations (required for AN role) */
    specializations: z.array(z.string()).optional().default([]),
    /** List of industries the company operates in (required for AN role) */
    industries: z.array(z.string()).optional().default([]),
    /** List of order categories the company handles (required for AN role) */
    orderCategories: z.array(z.string()).optional().default([]),
    /** Work radius in kilometers (required for AN role) */
    workRadiusKm: z.number().min(1, "Arbeitsradius muss mindestens 1 km betragen").max(1000, "Arbeitsradius darf maximal 1000 km betragen").optional(),
    /** Company description (required for AN role) */
    description: z.string().min(10, "Unternehmensbeschreibung muss mindestens 10 Zeichen lang sein").max(600, "Unternehmensbeschreibung darf maximal 600 Zeichen lang sein").optional(),
    /** List of certifications (optional for AN role) */
    certifications: z.array(z.string()).optional().default([]),

    // Additional contact/company info that may need updates
    /** Contact person name */
    contactPersonName: z.string().min(2, "Name des Ansprechpartners muss mindestens 2 Zeichen lang sein").max(200, "Name des Ansprechpartners darf maximal 200 Zeichen lang sein").optional(),
    /** Contact person email */
    contactPersonEmail: z.string().email("Ungültiges E-Mail-Format").max(255, "E-Mail darf maximal 255 Zeichen lang sein").optional(),
    /** Contact person phone number */
    contactPersonPhone: z.string().min(5, "Telefonnummer muss mindestens 5 Zeichen lang sein").max(20, "Telefonnummer darf maximal 20 Zeichen lang sein").optional(),
    /** Number of employees */
    employeeCount: z.number().min(1, "Mitarbeiteranzahl muss mindestens 1 betragen").max(100000, "Mitarbeiteranzahl darf maximal 100.000 betragen").optional(),
    /** Business hours description */
    businessHours: z.string().max(500, "Öffnungszeiten dürfen maximal 500 Zeichen lang sein").optional(),

    // File upload fields (only required for Auftragnehmer role)
    /** Verification document file name/URL (required for AN role) */
    verificationDocumentUrl: z.string().optional(),
    /** Certificates document file name/URL (optional for AN role) */
    certificatesDocumentUrl: z.string().optional(),

    // File objects for internal state management (not sent to backend)
    /** Verification document file object */
    _verificationFile: z.custom<File>((val) => val instanceof File, "Ungültige Verifizierungsdatei").optional(),
    /** Certificates document file object */
    _certificatesFile: z.custom<File>((val) => val instanceof File, "Ungültige Zertifikatsdatei").optional(),
}).superRefine((data, ctx) => {
    // Validate required fields for Auftragnehmer role
    if (data.role === BusinessRole.AUFTRAGNEHMER) {
        if (!data.specializations || data.specializations.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Mindestens eine Spezialisierung ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["specializations"],
            });
        }

        if (!data.industries || data.industries.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Mindestens eine Branche ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["industries"],
            });
        }

        if (!data.workRadiusKm || data.workRadiusKm <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Arbeitsradius ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["workRadiusKm"],
            });
        }

        if (!data.description || data.description.trim().length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Unternehmensbeschreibung ist für die Auftragnehmer-Rolle erforderlich (mindestens 10 Zeichen).",
                path: ["description"],
            });
        }

        if (!data.contactPersonName || data.contactPersonName.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Name des Ansprechpartners ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["contactPersonName"],
            });
        }

        if (!data.contactPersonEmail || !data.contactPersonEmail.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "E-Mail des Ansprechpartners ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["contactPersonEmail"],
            });
        }

        if (!data.employeeCount || data.employeeCount < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Mitarbeiteranzahl ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["employeeCount"],
            });
        }

        // Validate verification document is provided (either file or URL)
        if (!data._verificationFile && !data.verificationDocumentUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Verifizierungsdokument ist für die Auftragnehmer-Rolle erforderlich.",
                path: ["_verificationFile"],
            });
        }

        // Validate contact phone if provided
        if (data.contactPersonPhone && (data.contactPersonPhone.trim().length < 5 || data.contactPersonPhone.trim().length > 20)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Telefonnummer muss zwischen 5 und 20 Zeichen lang sein.",
                path: ["contactPersonPhone"],
            });
        }
    }
});

/**
 * Type for add business role form data.
 * Inferred from the AddBusinessRoleSchema.
 */
export type AddBusinessRoleData = z.infer<typeof AddBusinessRoleSchema>;

/**
 * Response interface for role addition API calls.
 */
export interface CompanyRoleAdditionResponse {
    /** Company ID */
    companyId: string;
    /** Company name */
    companyName: string;
    /** The role that was added */
    addedRole: BusinessRole;
    /** Updated Auftraggeber status */
    isAuftraggeber: boolean;
    /** Updated Auftragnehmer status */
    isAuftragnehmer: boolean;
    /** Timestamp when role was added */
    addedAt: string;
    /** Success/error message */
    message: string;
    /** Whether the operation was successful */
    success: boolean;
    /** Whether documents require manual verification */
    requiresVerification?: boolean;
    /** Error code if operation failed */
    errorCode?: string;
    /** Field-specific error messages */
    fieldErrors?: Record<string, string>;
}

/**
 * Interface for available roles API response.
 */
export interface AvailableRolesResponse {
    /** List of roles that can be added to the company */
    availableRoles: BusinessRole[];
    /** Current company roles */
    currentRoles: CompanyRoles;
}

/**
 * Utility functions for business role management.
 */
export const BusinessRoleUtils = {
    /**
     * Gets the German display name for a business role.
     */
    getDisplayName: (role: BusinessRole): string => {
        switch (role) {
            case BusinessRole.AUFTRAGGEBER:
                return "Auftraggeber";
            case BusinessRole.AUFTRAGNEHMER:
                return "Auftragnehmer";
            default:
                return role;
        }
    },

    /**
     * Gets the description of what a role enables.
     */
    getRoleDescription: (role: BusinessRole): string => {
        switch (role) {
            case BusinessRole.AUFTRAGGEBER:
                return "Ermöglicht das Erstellen von Aufträgen und Beauftragen von Dienstleistern";
            case BusinessRole.AUFTRAGNEHMER:
                return "Ermöglicht das Anbieten von Dienstleistungen und Erfüllen von Aufträgen";
            default:
                return "";
        }
    },

    /**
     * Checks if a role requires additional specialization data.
     */
    requiresSpecializationData: (role: BusinessRole): boolean => {
        return role === BusinessRole.AUFTRAGNEHMER;
    },

    /**
     * Gets the list of roles that can be added based on current roles.
     */
    getAvailableRoles: (currentRoles: CompanyRoles): BusinessRole[] => {
        const available: BusinessRole[] = [];

        if (!currentRoles.isAuftraggeber) {
            available.push(BusinessRole.AUFTRAGGEBER);
        }

        if (!currentRoles.isAuftragnehmer) {
            available.push(BusinessRole.AUFTRAGNEHMER);
        }

        return available;
    },

    /**
     * Checks if a company can add a specific role.
     */
    canAddRole: (currentRoles: CompanyRoles, role: BusinessRole): boolean => {
        switch (role) {
            case BusinessRole.AUFTRAGGEBER:
                return !currentRoles.isAuftraggeber;
            case BusinessRole.AUFTRAGNEHMER:
                return !currentRoles.isAuftragnehmer;
            default:
                return false;
        }
    },

    /**
     * Gets role requirements for a specific business role.
     */
    getRoleRequirements: (role: BusinessRole): RoleRequirements => {
        switch (role) {
            case BusinessRole.AUFTRAGGEBER:
                return {
                    role,
                    requiredFields: [],
                    optionalFields: [],
                    description: BusinessRoleUtils.getRoleDescription(role),
                    followsRegistrationFlow: false,
                };
            case BusinessRole.AUFTRAGNEHMER:
                return {
                    role,
                    requiredFields: [
                        'specializations',
                        'industries',
                        'workRadiusKm',
                        'description',
                        'contactPersonName',
                        'contactPersonEmail',
                        'verificationDocumentUrl', // Required for Auftragnehmer
                    ],
                    optionalFields: [
                        'orderCategories',
                        'certifications',
                        'contactPersonPhone',
                        'employeeCount',
                        'businessHours',
                        'certificatesDocumentUrl', // Optional for Auftragnehmer
                    ],
                    description: BusinessRoleUtils.getRoleDescription(role),
                    followsRegistrationFlow: true,
                };
            default:
                throw new Error(`Unknown business role: ${role}`);
        }
    },
};

/**
 * Type guard to check if a string is a valid BusinessRole.
 */
export const isBusinessRole = (value: string): value is BusinessRole => {
    return Object.values(BusinessRole).includes(value as BusinessRole);
};

/**
 * Converts a string to BusinessRole enum value.
 * Throws error if invalid.
 */
export const parseBusinessRole = (value: string): BusinessRole => {
    if (!isBusinessRole(value)) {
        throw new Error(`Invalid business role: ${value}`);
    }
    return value as BusinessRole;
};