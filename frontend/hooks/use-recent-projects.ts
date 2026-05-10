import { useState, useEffect } from 'react';

export interface Project {
  id: number; // Changed to number
  title: string;
  status: "Aktiv" | "Abgeschlossen"; // Adjusted status values
  location: string; // Added location
  dueDate: string; // Changed from deadline
  contact: string; // Changed from client
}

export interface UseRecentProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: Error | null;
}

// Simulate API call
const fetchRecentProjects = (): Promise<Project[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: "Wartung Produktionsanlage",
          status: "Aktiv",
          location: "Berlin",
          dueDate: "15.06.2024",
          contact: "Thomas Müller",
        },
        {
          id: 2,
          title: "SPS-Programmierung",
          status: "Aktiv",
          location: "München",
          dueDate: "22.06.2024",
          contact: "Julia Schmidt",
        },
        {
          id: 3,
          title: "Elektroinstallation Neubau",
          status: "Aktiv",
          location: "Hamburg",
          dueDate: "30.06.2024",
          contact: "Michael Weber",
        },
        {
          id: 4,
          title: "Schaltschrankbau",
          status: "Abgeschlossen",
          location: "Frankfurt",
          dueDate: "01.06.2024",
          contact: "Sarah Becker",
        },
      ]);
    }, 700); // Simulate network delay
  });
};

export function useRecentProjects(): UseRecentProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const result = await fetchRecentProjects();
        setProjects(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch recent projects'));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return { projects, loading, error };
}