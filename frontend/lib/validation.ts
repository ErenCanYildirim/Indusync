// Common validation patterns
export const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  phone: /^(?:\+|00)?\d{1,4}[\s\-]?\d{1,15}(?:[\s\-]?\d{1,15})*$/,
  url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  postalCode: /^\d{5}$/,
};

// Common validation messages
export const messages = {
  required: "Dieses Feld ist erforderlich",
  email: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
  password: "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten",
  passwordMatch: "Passwörter stimmen nicht überein",
  phone: "Bitte geben Sie eine gültige Telefonnummer ein.",
  url: "Bitte geben Sie eine gültige URL ein",
  postalCode: "Bitte geben Sie eine gültige Postleitzahl ein (5 Ziffern)",
  // Order validation messages
  title: "Titel muss zwischen 3 und 200 Zeichen lang sein",
  description: "Beschreibung muss zwischen 10 und 2000 Zeichen lang sein",
  street: "Straße ist erforderlich",
  houseNumber: "Hausnummer ist erforderlich",
  city: "Stadt ist erforderlich",
  searchRadius: "Suchradius muss zwischen 1 und 1000 km liegen",
  coordinates: "Gültige Koordinaten sind erforderlich",
};

// Import Zod for schema validation
import { z } from 'zod'

// =============================================================================
// ZOD SCHEMAS FOR ORDERS (Sprint 2 Day 4)
// =============================================================================

export const addressSchema = z.object({
  street: z.string()
    .min(1, "Straße ist erforderlich")
    .max(100, "Straße darf maximal 100 Zeichen lang sein"),
  houseNumber: z.string()
    .min(1, "Hausnummer ist erforderlich")
    .max(10, "Hausnummer darf maximal 10 Zeichen lang sein"),
  postalCode: z.string()
    .regex(/^\d{5}$/, "Postleitzahl muss 5 Ziffern haben"),
  city: z.string()
    .min(1, "Stadt ist erforderlich")
    .max(100, "Stadt darf maximal 100 Zeichen lang sein"),
  country: z.string()
    .min(1, "Land ist erforderlich")
    .max(50, "Land darf maximal 50 Zeichen lang sein")
    .default("Deutschland"),
})

export const geoLocationSchema = z.object({
  latitude: z.number()
    .min(-90, "Breitengrad muss zwischen -90 und 90 liegen")
    .max(90, "Breitengrad muss zwischen -90 und 90 liegen"),
  longitude: z.number()
    .min(-180, "Längengrad muss zwischen -180 und 180 liegen")
    .max(180, "Längengrad muss zwischen -180 und 180 liegen"),
})

export const createOrderSchema = z.object({
  // Basic order information
  title: z.string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein")
    .trim(),

  description: z.string()
    .min(10, "Beschreibung muss mindestens 10 Zeichen lang sein")
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein")
    .trim(),

  // Service address (flattened for API)
  street: z.string()
    .min(1, "Straße ist erforderlich")
    .max(100, "Straße darf maximal 100 Zeichen lang sein"),
  houseNumber: z.string()
    .min(1, "Hausnummer ist erforderlich")
    .max(10, "Hausnummer darf maximal 10 Zeichen lang sein"),
  postalCode: z.string()
    .regex(/^\d{5}$/, "Postleitzahl muss 5 Ziffern haben"),
  city: z.string()
    .min(1, "Stadt ist erforderlich")
    .max(100, "Stadt darf maximal 100 Zeichen lang sein"),
  country: z.string()
    .min(1, "Land ist erforderlich")
    .max(50, "Land darf maximal 50 Zeichen lang sein")
    .default("Deutschland"),

  // Geographic coordinates
  latitude: z.number()
    .min(-90, "Breitengrad muss zwischen -90 und 90 liegen")
    .max(90, "Breitengrad muss zwischen -90 und 90 liegen"),
  longitude: z.number()
    .min(-180, "Längengrad muss zwischen -180 und 180 liegen")
    .max(180, "Längengrad muss zwischen -180 und 180 liegen"),

  // Search configuration
  searchRadiusKm: z.number()
    .int("Suchradius muss eine ganze Zahl sein")
    .min(1, "Suchradius muss mindestens 1 km betragen")
    .max(1000, "Suchradius darf maximal 1000 km betragen"),
})

// Form schema with nested address object (for UI forms)
export const createOrderFormSchema = z.object({
  // Basic order information
  title: z.string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein")
    .trim(),

  description: z.string()
    .min(10, "Beschreibung muss mindestens 10 Zeichen lang sein")
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein")
    .trim(),

  // Nested address object (easier for forms)
  address: addressSchema,

  // Geographic settings
  useCurrentLocation: z.boolean().default(false).optional(),
  location: geoLocationSchema.optional(),

  searchRadiusKm: z.number()
    .int("Suchradius muss eine ganze Zahl sein")
    .min(1, "Suchradius muss mindestens 1 km betragen")
    .max(1000, "Suchradius darf maximal 1000 km betragen")
    .default(50),

  // Additional fields (for future features)
  category: z.string().optional(),
  budget: z.number().positive("Budget muss positiv sein").optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM').optional(),
  expectedDuration: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]).optional(),
})

// Search form schema
export const orderSearchSchema = z.object({
  query: z.string().max(200, "Suchbegriff darf maximal 200 Zeichen lang sein").optional(),
  location: z.string().max(100, "Ort darf maximal 100 Zeichen lang sein").optional(),
  radius: z.number().int().min(1).max(1000).optional(),
  category: z.string().optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

// Type inference from schemas
export type CreateOrderFormData = z.infer<typeof createOrderFormSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type OrderSearchData = z.infer<typeof orderSearchSchema>

// Helper function to transform form data to API data
export const transformOrderFormToApi = (formData: CreateOrderFormData): CreateOrderData => {
  return {
    title: formData.title,
    description: formData.description,
    street: formData.address.street,
    houseNumber: formData.address.houseNumber,
    postalCode: formData.address.postalCode,
    city: formData.address.city,
    country: formData.address.country,
    latitude: formData.location?.latitude || 0,
    longitude: formData.location?.longitude || 0,
    searchRadiusKm: formData.searchRadiusKm,
  }
}

// Types for form validation
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
}

export type ValidationRules = Record<string, ValidationRule>;
export type ValidationErrors = Record<string, string>;

/**
 * Validates a set of form values against provided rules.
 * Returns an object of field names to error messages.
 */
export function validateForm(
  values: Record<string, any>,
  rules: ValidationRules
): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = values[field];

    // Required validation
    if (rule.required) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        errors[field] = messages.required;
        return;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        errors[field] = (messages as any)[field] || messages.required;
      }
    }
  });

  return errors;
}