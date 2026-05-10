import { LocalCompanyState } from "./components/logo-basics-card";

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Validates company profile data before sending to backend
 */
export const validateCompanyProfile = (data: LocalCompanyState): ValidationResult => {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
        errors.push({
            field: 'name',
            message: 'Firmenname ist erforderlich'
        });
    }

    if (data.name && data.name.length > 255) {
        errors.push({
            field: 'name',
            message: 'Firmenname darf maximal 255 Zeichen lang sein'
        });
    }

    // Email validation
    if (data.contact.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.contact.email)) {
            errors.push({
                field: 'contact.email',
                message: 'Ungültige E-Mail-Adresse'
            });
        }
    }

    // Phone validation (basic)
    if (data.contact.phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
        if (!phoneRegex.test(data.contact.phone)) {
            errors.push({
                field: 'contact.phone',
                message: 'Ungültige Telefonnummer'
            });
        }
    }

    // Website validation
    if (data.contact.website) {
        try {
            new URL(data.contact.website);
        } catch {
            errors.push({
                field: 'contact.website',
                message: 'Ungültige Website-URL'
            });
        }
    }

    // Postal code validation (Germany/Austria format)
    if (data.address.postalCode) {
        const postalCodeRegex = /^\d{5}$/;
        if (!postalCodeRegex.test(data.address.postalCode)) {
            errors.push({
                field: 'address.postalCode',
                message: 'Postleitzahl muss 5 Ziffern haben'
            });
        }
    }

    // Work radius validation
    if (data.workRadiusKm !== undefined && data.workRadiusKm !== null) {
        if (data.workRadiusKm < 0) {
            errors.push({
                field: 'workRadiusKm',
                message: 'Arbeitsradius kann nicht negativ sein'
            });
        }
        if (data.workRadiusKm > 1000) {
            errors.push({
                field: 'workRadiusKm',
                message: 'Arbeitsradius darf maximal 1000 km betragen'
            });
        }
    }

    // VAT number validation (basic EU format)
    if (data.taxInfo.vatNumber) {
        const vatRegex = /^[A-Z]{2}[0-9A-Z]{2,}$/;
        if (!vatRegex.test(data.taxInfo.vatNumber)) {
            errors.push({
                field: 'taxInfo.vatNumber',
                message: 'Ungültige USt-IdNr. Format (z.B. DE123456789)'
            });
        }
    }

    // Description length validation
    if (data.description && data.description.length > 2000) {
        errors.push({
            field: 'description',
            message: 'Beschreibung darf maximal 2000 Zeichen lang sein'
        });
    }

    // Business hours validation (basic check)
    if (data.businessHours && data.businessHours.length > 255) {
        errors.push({
            field: 'businessHours',
            message: 'Geschäftszeiten dürfen maximal 255 Zeichen lang sein'
        });
    }

    // Specializations validation
    if (data.specializations) {
        if (data.specializations.length > 50) {
            errors.push({
                field: 'specializations',
                message: 'Maximal 50 Spezialisierungen erlaubt'
            });
        }

        data.specializations.forEach((spec, index) => {
            if (spec.length > 100) {
                errors.push({
                    field: `specializations[${index}]`,
                    message: 'Spezialisierung darf maximal 100 Zeichen lang sein'
                });
            }
        });
    }

    // Industries validation
    if (data.industries) {
        if (data.industries.length > 20) {
            errors.push({
                field: 'industries',
                message: 'Maximal 20 Branchen erlaubt'
            });
        }

        data.industries.forEach((industry, index) => {
            if (industry.length > 100) {
                errors.push({
                    field: `industries[${index}]`,
                    message: 'Branche darf maximal 100 Zeichen lang sein'
                });
            }
        });
    }

    // Order categories validation
    if (data.orderCategories) {
        if (data.orderCategories.length > 30) {
            errors.push({
                field: 'orderCategories',
                message: 'Maximal 30 Auftragskategorien erlaubt'
            });
        }

        data.orderCategories.forEach((category, index) => {
            if (category.length > 100) {
                errors.push({
                    field: `orderCategories[${index}]`,
                    message: 'Auftragskategorie darf maximal 100 Zeichen lang sein'
                });
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Sanitizes company profile data before sending to backend
 */
export const sanitizeCompanyProfile = (data: LocalCompanyState): Partial<LocalCompanyState> => {
    return {
        ...data,
        name: data.name?.trim(),
        description: data.description?.trim(),
        businessHours: data.businessHours?.trim(),
        contact: {
            ...data.contact,
            phone: data.contact.phone?.trim(),
            email: data.contact.email?.trim(),
            website: data.contact.website?.trim()
        },
        address: {
            ...data.address,
            street: data.address.street?.trim(),
            houseNumber: data.address.houseNumber?.trim(),
            postalCode: data.address.postalCode?.trim(),
            city: data.address.city?.trim(),
            country: data.address.country?.trim()
        },
        taxInfo: {
            ...data.taxInfo,
            vatNumber: data.taxInfo.vatNumber?.trim().toUpperCase(),
            taxId: data.taxInfo.taxId?.trim()
        },
        // Remove empty arrays
        specializations: data.specializations?.filter(s => s.trim().length > 0),
        industries: data.industries?.filter(i => i.trim().length > 0),
        orderCategories: data.orderCategories?.filter(c => c.trim().length > 0)
    };
};

/**
 * Formats validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
    if (errors.length === 0) return '';

    if (errors.length === 1) {
        return errors[0].message;
    }

    return `Folgende Fehler müssen behoben werden:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}; 
