import { useState, useEffect } from 'react';

export interface Deadline {
  id: number; // Changed to number
  title: string; // Changed from task
  date: string; // Specific date format
  time: string; // Specific time format
}

export interface UseUpcomingDeadlinesReturn {
  deadlines: Deadline[];
  loading: boolean;
  error: Error | null;
}

// Simulate API call
const fetchUpcomingDeadlines = (): Promise<Deadline[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: "Projektabschluss: Wartung Produktionsanlage",
          date: "15.06.2024",
          time: "18:00",
        },
        {
          id: 2,
          title: "Angebotsfrist: Elektroinstallation",
          date: "10.06.2024",
          time: "12:00",
        },
        {
          id: 3,
          title: "Besprechung: SPS-Programmierung",
          date: "05.06.2024",
          time: "10:30",
        },
        {
          id: 4,
          title: "Materiallieferung: Schaltschrankbau",
          date: "08.06.2024",
          time: "09:00",
        },
      ]);
    }, 400); // Simulate network delay
  });
};

export function useUpcomingDeadlines(): UseUpcomingDeadlinesReturn {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadDeadlines = async () => {
      try {
        setLoading(true);
        const result = await fetchUpcomingDeadlines();
        setDeadlines(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch upcoming deadlines'));
        setDeadlines([]);
      } finally {
        setLoading(false);
      }
    };

    loadDeadlines();
  }, []);

  return { deadlines, loading, error };
}