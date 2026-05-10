// Project types
export type ProjectStatus = "Aktiv" | "Entwurf" | "Auftrag vergeben" | "In Verzug" | "Abgeschlossen" 

export interface Project {
  id: number;
  title: string;
  status: ProjectStatus;
  location: string;
  startDate: string; // Assuming DD.MM.YYYY
  endDate: string;   // Assuming DD.MM.YYYY
  applications: number;
  description?: string;
  client?: string;
  budget?: string;
}

export type SortKey = keyof Project | '';
export type SortDirection = "ascending" | "descending";

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export interface ProjectFilters {
  searchTerm?: string;
  status?: ProjectStatus | "all";
  dateFilter?: "all" | "current" | "upcoming" | "past";
}

// Mock data (can be replaced with API calls)
const mockProjects: Project[] = [
  {
    id: 1,
    title: "Wartung Produktionsanlage",
    status: "Aktiv",
    location: "Berlin",
    startDate: "15.06.2024",
    endDate: "30.06.2024",
    applications: 8,
    description: "Detaillierte Wartung und Überprüfung aller Komponenten der Hauptproduktionsanlage. Austausch von Verschleißteilen und Software-Updates.",
    client: "Industrie AG",
    budget: "€15.000",
  },
  {
    id: 2,
    title: "SPS-Programmierung",
    status: "Aktiv",
    location: "München",
    startDate: "22.06.2024",
    endDate: "15.07.2024",
    applications: 5,
    description: "Entwicklung und Implementierung einer neuen SPS-Steuerung für eine Verpackungsmaschine. Inklusive Tests und Inbetriebnahme.",
    client: "Maschinenbau GmbH",
    budget: "€25.000",
  },
  {
    id: 3,
    title: "Elektroinstallation Neubau",
    status: "In Verzug",
    location: "Hamburg",
    startDate: "30.06.2024",
    endDate: "30.08.2024",
    applications: 12,
    description: "Komplette Elektroinstallation für ein neues Bürogebäude, inklusive Netzwerktechnik und Sicherheitssystemen.",
    client: "Immobilien KG",
    budget: "€120.000",
  },
  {
    id: 4,
    title: "Schaltschrankbau",
    status: "Abgeschlossen",
    location: "Frankfurt",
    startDate: "01.06.2024",
    endDate: "10.06.2024",
    applications: 6,
    description: "Planung und Fertigung von 5 Industrieschaltschränken nach Kundenspezifikation.",
    client: "Automation Solutions",
    budget: "€30.000",
  },
  {
    id: 5,
    title: "Automatisierung Fertigungslinie",
    status: "Aktiv",
    location: "Köln",
    startDate: "10.07.2024",
    endDate: "25.08.2024",
    applications: 3,
    description: "Modernisierung und Automatisierung einer bestehenden Fertigungslinie zur Effizienzsteigerung.",
    client: "Produktion GmbH & Co. KG",
    budget: "€75.000",
  },
  {
    id: 6,
    title: "Wartung Klimaanlage",
    status: "Entwurf",
    location: "Stuttgart",
    startDate: "05.07.2024",
    endDate: "07.07.2024",
    applications: 0,
    description: "Regelmäßige Wartung der zentralen Klimaanlage eines Einkaufszentrums.",
    client: "Shopping Center Management",
    budget: "€5.000",
  },
  {
    id: 7,
    title: "Netzwerkinstallation",
    status: "Aktiv",
    location: "Düsseldorf",
    startDate: "20.06.2024",
    endDate: "30.06.2024",
    applications: 4,
    description: "Installation und Konfiguration eines neuen Netzwerks für ein mittelständisches Unternehmen.",
    client: "Tech Solutions GmbH",
    budget: "€18.000",
  },
  {
    id: 8,
    title: "Sicherheitssystem Upgrade",
    status: "Entwurf",
    location: "Leipzig",
    startDate: "15.07.2024",
    endDate: "20.07.2024",
    applications: 0,
    description: "Upgrade der Sicherheitssysteme in einem Bürogebäude, inklusive Zutrittskontrolle und Videoüberwachung.",
    client: "Sicherheit & Co.",
    budget: "€22.000",
  },
  {
    id: 9,
    title: "Beleuchtungsanlage Theater",
    status: "Abgeschlossen",
    location: "Dresden",
    startDate: "01.05.2024",
    endDate: "15.05.2024",
    applications: 7,
    description: "Installation einer neuen Beleuchtungsanlage für ein Stadttheater.",
    client: "Kulturamt Dresden",
    budget: "€45.000",
  },
  {
    id: 10,
    title: "Photovoltaikanlage",
    status: "Auftrag vergeben",
    location: "Nürnberg",
    startDate: "01.07.2024",
    endDate: "15.08.2024",
    applications: 9,
    description: "Installation einer Photovoltaikanlage auf dem Dach eines Industriegebäudes.",
    client: "Energie GmbH",
    budget: "€85.000",
  },
];

/**
 * Helper function to parse DD.MM.YYYY to Date object
 */
export const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

/**
 * Get all projects
 * This could be replaced with an API call in the future
 */
export const getAllProjects = async (): Promise<Project[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockProjects]);
    }, 300);
  });
};

/**
 * Get a project by ID
 */
export const getProjectById = async (id: number): Promise<Project | null> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const project = mockProjects.find(p => p.id === id) || null;
      resolve(project);
    }, 300);
  });
};

/**
 * Filter and sort projects
 */
export const filterAndSortProjects = (
  projects: Project[],
  filters: ProjectFilters,
  sortConfig?: SortConfig
): Project[] => {
  let filtered = [...projects];

  // Apply search filter
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter((project) =>
      project.title.toLowerCase().includes(searchLower) ||
      project.location.toLowerCase().includes(searchLower) ||
      (project.description && project.description.toLowerCase().includes(searchLower)) ||
      (project.client && project.client.toLowerCase().includes(searchLower))
    );
  }

  // Apply status filter
  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((project) => project.status === filters.status);
  }

  // Apply date filter
  if (filters.dateFilter && filters.dateFilter !== "all") {
    const today = new Date();
    
    filtered = filtered.filter((project) => {
      const startDate = parseDate(project.startDate);
      const endDate = parseDate(project.endDate);
      
      if (filters.dateFilter === "current") {
        // Current: Today is between start and end dates
        return today >= startDate && today <= endDate;
      } else if (filters.dateFilter === "upcoming") {
        // Upcoming: Start date is in the future
        return startDate > today;
      } else if (filters.dateFilter === "past") {
        // Past: End date is before today
        return endDate < today;
      }
      return true;
    });
  }

  // Apply sorting
  if (sortConfig && sortConfig.key) {
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Project];
      const bValue = b[sortConfig.key as keyof Project];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Special case for dates
        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
          const aDate = parseDate(aValue);
          const bDate = parseDate(bValue);
          return sortConfig.direction === 'ascending' 
            ? aDate.getTime() - bDate.getTime() 
            : bDate.getTime() - aDate.getTime();
        }
        
        return sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }

  return filtered;
};

/**
 * Paginate projects
 */
export const paginateProjects = (
  projects: Project[],
  page: number,
  itemsPerPage: number
): Project[] => {
  const startIndex = (page - 1) * itemsPerPage;
  return projects.slice(startIndex, startIndex + itemsPerPage);
};