import { z } from 'zod';
import { patterns, messages } from '@/lib/validation';

// Base schema with fields common to all steps or used for discrimination
export const BaseRegistrationSchema = z.object({
  // === Core Identity ===
  accountType: z.enum(["business", "personal"], { required_error: "Bitte wählen Sie einen Kontotyp." }),
  email: z.string().email({ message: messages.email }),
  password: z
    .string()
    .min(8, { message: "Passwort muss mindestens 8 Zeichen lang sein." })
    .regex(patterns.password, { message: messages.password }),
  confirmPassword: z.string().min(8, { message: "Passwortbestätigung ist erforderlich." }),

  // === Personal Information ===
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().regex(patterns.phone, { message: messages.phone }).optional().or(z.literal('')),
  website: z.string().url({ message: messages.url }).optional().or(z.literal('')),

  // === Company Information ===
  companyName: z.string().optional(),
  companyType: z.string().optional(), // Consider an enum like in CompanyRegistrationSchema
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),

  // === Address Fields ===
  houseNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  street: z.string().optional(),

  // === Location Coordinates ===
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // === Business-specific Fields ===
  workRadiusKm: z.number().optional(),
  specializations: z.array(z.string()).optional().default([]),
  industries: z.array(z.string()).optional().default([]),
  orderCategories: z.array(z.string()).optional().default([]),
  description: z.string().optional(),

  // === Role Flags ===
  companyTypeAuftraggeber: z.boolean().optional(),
  companyTypeAuftragnehmer: z.boolean().optional(),

  // === Auftragnehmer-specific Fields ===
  companyDetailsName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPostalCode: z.string().optional(),
  companyCity: z.string().optional(),
  workRadius: z.string().optional(),
  countrySelection: z.string().optional(),
  contactPersonCount: z.number().optional(),
  contactPersonName: z.string().optional(),
  contactDepartment: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  employeeCount: z.number().optional(),
  companyDescription: z.string().optional(),
  companyVerificationFile: z.string().optional(),
  companyCertificatesFile: z.string().optional(),

  // === User Preferences ===
  referralSource: z.string().optional(),
  interests: z.array(z.string()).optional().default([]),
  emailNotifications: z.boolean().default(true),

  // === Terms and Privacy (REQUIRED) ===
  termsAccepted: z.boolean().refine(val => val === true, { message: "Sie müssen den AGB zustimmen." }),
  privacyAccepted: z.boolean().refine(val => val === true, { message: "Sie müssen den Datenschutzbestimmungen zustimmen." }),

  // === File Objects (for internal state management, not directly from form input elements) ===
  // These will hold the actual File objects, not just their names.
  // They are optional because they are only present if a file is selected.
  _verificationFile: z.custom<File>((val) => val instanceof File, "Ungültige Verifizierungsdatei.").optional(),
  _certificatesFile: z.custom<File>((val) => val instanceof File, "Ungültige Zertifikatsdatei.").optional(),
});

// Schema with refinements for conditional logic and password confirmation
export const RegistrationSchema = BaseRegistrationSchema.superRefine((data, ctx) => {
  // Password validation
  validatePasswords(data, ctx);

  // Account type specific validation
  if (data.accountType === "personal") {
    validatePersonalAccount(data, ctx);
  } else if (data.accountType === "business") {
    validateBusinessAccount(data, ctx);
  }

  // Address validation (optional fields)
  validateAddressIfProvided(data, ctx);

  // Auftragnehmer specific validation for companyPostalCode
  if (data.companyTypeAuftragnehmer && data.companyPostalCode && !patterns.postalCode.test(data.companyPostalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: messages.postalCode, // Use the existing message for postal codes
      path: ["companyPostalCode"],
    });
  }
})
  .transform(data => {
    // Clean up data: remove fields not relevant to the account type
    const { accountType, ...rest } = data;
    if (accountType === 'personal') {
      const { companyName, companyType, taxId, ...personalData } = rest;
      return { accountType, ...personalData };
    } else if (accountType === 'business') {
      const { firstName, lastName, ...businessData } = rest;
      return { accountType, ...businessData };
    }
    return data; // Should not be reached if accountType is always personal or business
  });

// Helper validation functions
function validatePasswords(data: z.infer<typeof BaseRegistrationSchema>, ctx: z.RefinementCtx) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: messages.passwordMatch,
      path: ["confirmPassword"],
    });
  }
}

function validatePersonalAccount(data: z.infer<typeof BaseRegistrationSchema>, ctx: z.RefinementCtx) {
  if (!data.firstName || data.firstName.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vorname ist erforderlich (mind. 2 Zeichen).", path: ["firstName"] });
  }
  if (!data.lastName || data.lastName.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nachname ist erforderlich (mind. 2 Zeichen).", path: ["lastName"] });
  }
}

function validateBusinessAccount(data: z.infer<typeof BaseRegistrationSchema>, ctx: z.RefinementCtx) {
  if (!data.companyName || data.companyName.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Firmenname ist erforderlich (mind. 2 Zeichen).", path: ["companyName"] });
  }
  if (!data.companyType || data.companyType.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rechtsform ist erforderlich.", path: ["companyType"] });
  }
}

function validateAddressIfProvided(data: z.infer<typeof BaseRegistrationSchema>, ctx: z.RefinementCtx) {
  if (data.street && data.street.length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adresse muss mindestens 3 Zeichen lang sein.", path: ["street"] });
  }
  if (data.postalCode && !patterns.postalCode.test(data.postalCode)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: messages.postalCode, path: ["postalCode"] });
  }
  if (data.city && data.city.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stadt muss mindestens 2 Zeichen lang sein.", path: ["city"] });
  }
}

export type RegistrationFormData = z.infer<typeof BaseRegistrationSchema>; // Use Base for form state type
export type FinalRegistrationData = z.infer<typeof RegistrationSchema>; // Use refined for submission type