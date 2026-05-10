import { z } from 'zod';

// Define an enum for project status, if applicable
export const ProjectStatusEnum = z.enum([
  "Offen",
  "In Bearbeitung",
  "Abgeschlossen",
  "Storniert",
  "Angebot Erstellt",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(), // Optional: Will be generated on creation
  title: z.string().min(5, { message: "Titel muss mindestens 5 Zeichen lang sein." }).max(100, { message: "Titel darf maximal 100 Zeichen lang sein." }),
  description: z.string().min(10, { message: "Beschreibung muss mindestens 10 Zeichen lang sein." }).max(1000, { message: "Beschreibung darf maximal 1000 Zeichen lang sein." }),
  location: z.string().min(3, { message: "Ort muss mindestens 3 Zeichen lang sein." }),
  postalCode: z.string().regex(/^\d{5}$/, { message: "Bitte geben Sie eine gültige Postleitzahl ein (5 Ziffern)." }),
  budget: z.number().positive({ message: "Budget muss ein positiver Betrag sein." }).optional(),
  deadline: z.date({
    required_error: "Ein Fälligkeitsdatum ist erforderlich.",
    invalid_type_error: "Das ist kein gültiges Datum.",
  }),
  contactPerson: z.string().min(2, { message: "Ansprechpartner muss mindestens 2 Zeichen haben." }),
  contactEmail: z.string().email({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." }),
  contactPhone: z.string().min(7, { message: "Telefonnummer muss mindestens 7 Zeichen haben." }).optional().or(z.literal('')), // Optional, but if provided, must be valid
  requiredSkills: z.array(z.string()).min(1, { message: "Mindestens eine Fähigkeit muss ausgewählt werden." }),
  status: ProjectStatusEnum.default("Offen"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  companyId: z.string().uuid().optional(), // Assuming a project is linked to a company
  assignedProviderId: z.string().uuid().optional(), // If a service provider is assigned
});

export type Project = z.infer<typeof ProjectSchema>;

// For creation, some fields might be optional or not yet present
export const CreateProjectSchema = ProjectSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  status: true, // Status will be set to 'Offen' by default
  assignedProviderId: true, 
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// For update, all fields are optional, and ID is required
export const UpdateProjectSchema = ProjectSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;