import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { z } from 'zod'; // Import z from Zod
import {
  Project,
  ProjectSchema,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatusEnum,
  ProjectStatus, // Import ProjectStatus type
} from '@/lib/types/project';

// Simulate a database or API storage
let simulatedProjectsDB: Project[] = [
  // Add some initial mock data if needed for testing
  {
    id: uuidv4(),
    title: "Erstes Beispielprojekt",
    description: "Dies ist eine detaillierte Beschreibung des ersten Beispielprojekts, das verschiedene Aspekte abdeckt.",
    location: "Berlin",
    postalCode: "10115",
    budget: 5000,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
    contactPerson: "Max Mustermann",
    contactEmail: "max.mustermann@example.com",
    contactPhone: "0123456789",
    requiredSkills: ["JavaScript", "React", "Node.js"],
    status: ProjectStatusEnum.Enum.Offen,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: uuidv4(), // Example company ID
  },
  {
    id: uuidv4(),
    title: "Zweites Projekt für Tests",
    description: "Kurze Beschreibung für das zweite Projekt, das hauptsächlich für Testzwecke dient.",
    location: "München",
    postalCode: "80331",
    deadline: new Date(new Date().setDate(new Date().getDate() + 60)), // 60 days from now
    contactPerson: "Erika Musterfrau",
    contactEmail: "erika.musterfrau@example.com",
    requiredSkills: ["Projektmanagement", "Qualitätssicherung"],
    status: ProjectStatusEnum.Enum["In Bearbeitung"],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
    updatedAt: new Date(),
    companyId: uuidv4(),
  },
];

const SIMULATED_API_DELAY = 500; // ms

export interface UseProjectsReturn {
  projects: Project[];
  project?: Project | null; // For fetching a single project
  loading: boolean;
  error: Error | string | null;
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (projectInput: CreateProjectInput) => Promise<Project | null>;
  updateProject: (id: string, projectUpdate: UpdateProjectInput) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);

  const clearError = () => setError(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
      setProjects([...simulatedProjectsDB]); // Return a copy
    } catch (e: any) {
      const errMessage = e instanceof Error ? e.message : 'Fehler beim Laden der Projekte.';
      setError(errMessage);
      console.error(errMessage, e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setProject(null);
    try {
      await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
      const foundProject = simulatedProjectsDB.find(p => p.id === id);
      if (foundProject) {
        setProject({ ...foundProject }); // Return a copy
      } else {
        setError(`Projekt mit ID ${id} nicht gefunden.`);
      }
    } catch (e: any) {
      const errMessage = e instanceof Error ? e.message : `Fehler beim Laden des Projekts ${id}.`;
      setError(errMessage);
      console.error(errMessage, e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectInput: CreateProjectInput): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input against the full ProjectSchema to ensure all defaults are applied
      // The CreateProjectSchema is for input, but the stored object is a full Project
      const newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: ProjectStatus } = {
        ...projectInput,
        budget: projectInput.budget ?? undefined, // Ensure optional number is handled
        contactPhone: projectInput.contactPhone ?? undefined,
      };
      
      const newProject: Project = ProjectSchema.parse({
        ...newProjectData,
        id: uuidv4(),
        status: ProjectStatusEnum.Enum.Offen, // Default status
        createdAt: new Date(),
        updatedAt: new Date(),
        // companyId: projectInput.companyId, // Assuming companyId is part of CreateProjectInput if required
      });

      await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
      simulatedProjectsDB.push(newProject);
      setProjects(prev => [...prev, newProject]); // Update local state if projects list is already loaded
      return { ...newProject }; // Return a copy
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const errMessage = "Validierungsfehler: " + e.errors.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ');
        setError(errMessage);
        console.error("Validation error:", e.errors);
      } else {
        const errMessage = e instanceof Error ? e.message : 'Fehler beim Erstellen des Projekts.';
        setError(errMessage);
        console.error(errMessage, e);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, projectUpdate: UpdateProjectInput): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const projectIndex = simulatedProjectsDB.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        setError(`Projekt mit ID ${id} nicht gefunden für Update.`);
        return null;
      }

      const existingProject = simulatedProjectsDB[projectIndex];
      // Merge and validate. Ensure all fields are present for validation, even if partial update.
      const updatedData = { ...existingProject, ...projectUpdate, updatedAt: new Date() };
      
      // Ensure budget and contactPhone are correctly handled if they are part of projectUpdate
      if (projectUpdate.budget !== undefined) {
        updatedData.budget = projectUpdate.budget ?? undefined;
      }
      if (projectUpdate.contactPhone !== undefined) {
        updatedData.contactPhone = projectUpdate.contactPhone ?? undefined;
      }
      
      const validatedProject = ProjectSchema.parse(updatedData);

      await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
      simulatedProjectsDB[projectIndex] = validatedProject;
      setProjects(prev => prev.map(p => p.id === id ? { ...validatedProject } : p));
      if (project?.id === id) {
        setProject({ ...validatedProject });
      }
      return { ...validatedProject };
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const errMessage = "Validierungsfehler beim Update: " + e.errors.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ');
        setError(errMessage);
        console.error("Validation error on update:", e.errors);
      } else {
        const errMessage = e instanceof Error ? e.message : `Fehler beim Aktualisieren des Projekts ${id}.`;
        setError(errMessage);
        console.error(errMessage, e);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [project]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
      const initialLength = simulatedProjectsDB.length;
      simulatedProjectsDB = simulatedProjectsDB.filter(p => p.id !== id);
      if (simulatedProjectsDB.length < initialLength) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (project?.id === id) {
          setProject(null);
        }
        return true;
      } else {
        setError(`Projekt mit ID ${id} nicht gefunden zum Löschen.`);
        return false;
      }
    } catch (e: any) {
      const errMessage = e instanceof Error ? e.message : `Fehler beim Löschen des Projekts ${id}.`;
      setError(errMessage);
      console.error(errMessage, e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Effect to load projects initially (optional, could be triggered by a component)
  // useEffect(() => {
  //   fetchProjects();
  // }, [fetchProjects]);

  return {
    projects,
    project,
    loading,
    error,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    clearError,
  };
}