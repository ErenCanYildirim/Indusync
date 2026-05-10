import { useState, useCallback } from 'react';
import { matchingApi } from '@/lib/api/matching';
import type {
    MatchingPreviewRequest,
    MatchingPreviewResponse,
    MatchingQueryHistory,
    MatchingQueryDetails
} from '@/lib/types/matching';

export const useMatchingPreview = () => {
    const [preview, setPreview] = useState<MatchingPreviewResponse | null>(null);
    const [history, setHistory] = useState<MatchingQueryHistory[]>([]);
    const [queryDetails, setQueryDetails] = useState<MatchingQueryDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

      const runPreview = useCallback(async (request: MatchingPreviewRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await matchingApi.runPreview(request);
      setPreview(result);
      // Refresh history after successful preview
      await fetchHistory();
      return result;
    } catch (err) {
      console.error('Error in runPreview hook:', err);
      let errorMessage = 'Unbekannter Fehler beim Ausführen der Matching-Vorschau';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'response' in err) {
        // Handle axios errors
        const axiosError = err as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Keine Berechtigung für diese Aktion.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Matching-Service nicht gefunden.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
        }
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

      const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await matchingApi.getHistory();
      setHistory(result);
      return result;
    } catch (err) {
      let errorMessage = 'Fehler beim Laden des Matching-Verlaufs';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
        }
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

      const fetchQueryDetails = useCallback(async (queryId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await matchingApi.getQueryDetails(queryId);
      setQueryDetails(result);
      return result;
    } catch (err) {
      let errorMessage = 'Fehler beim Laden der Abfrage-Details';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Abfrage-Details nicht gefunden.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
        }
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

    const clearPreview = useCallback(() => {
        setPreview(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        preview,
        history,
        queryDetails,
        loading,
        error,
        runPreview,
        fetchHistory,
        fetchQueryDetails,
        clearPreview,
        clearError,
    };
}; 