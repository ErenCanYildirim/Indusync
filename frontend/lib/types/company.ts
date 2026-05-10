import { z } from 'zod';
import { CompanyType } from './company-profile';

// Validation patterns and messages (inline to avoid import issues during compilation)
const patterns = {
  postalCode: /^\d{5}$/,
};

const messages = {
  postalCode: "Bitte geben Sie eine gültige Postleitzahl ein (5 Ziffern)",
};

// Re-export types from company-profile for consistency
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
  UseCompanyProfileReturn
} from './company-profile';

// Zod schema for company type validation
export const CompanyTypeEnum = z.enum([
  "GMBH", "AG", "EINZELUNTERNEHMEN", "GBR", "UG", "OHG", "KG", "GMBH_CO_KG", "OTHER"
]);

// Company registration form schema
export const CompanyRegistrationSchema = z.object({
  companyName: z.string().min(2, { message: "Firmenname muss mindestens 2 Zeichen lang sein." }),
  companyType: CompanyTypeEnum,
  street: z.string().min(3, { message: "Straße muss mindestens 3 Zeichen lang sein." }),
  houseNumber: z.string().min(1, { message: "Hausnummer ist erforderlich." }),
  postalCode: z.string().regex(patterns.postalCode, { message: messages.postalCode }),
  city: z.string().min(2, { message: "Stadt muss mindestens 2 Zeichen lang sein." }),
  country: z.string().min(2, { message: "Land muss mindestens 2 Zeichen lang sein." }), // Could be an enum
  taxId: z.string().optional(), // VAT ID or similar
  registrationNumber: z.string().optional(), // Commercial register number

  // Contact person
  contactPersonName: z.string().min(2, { message: "Name des Ansprechpartners ist erforderlich." }),
  contactPersonEmail: z.string().email({ message: "Gültige E-Mail ist erforderlich." }),
  contactPersonPhone: z.string().optional(),

  agreeTerms: z.boolean().refine(val => val === true, { message: "Sie müssen den AGB zustimmen." }),
  agreePrivacy: z.boolean().refine(val => val === true, { message: "Sie müssen den Datenschutzbestimmungen zustimmen." }),
});

export type CompanyFormData = z.infer<typeof CompanyRegistrationSchema>;