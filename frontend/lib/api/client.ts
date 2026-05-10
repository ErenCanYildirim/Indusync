import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAuthToken, removeAuthToken, isTokenExpired } from '@/lib/utils/auth'
import { toast } from 'sonner'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'
const API_TIMEOUT = 10000 // 10 seconds


/**
 * Create the main API client instance
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/v1`,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add auth token if available and valid
        const token = getAuthToken()
        if (token && !isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date().getTime() }

        return config
    },
    (error: AxiosError) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
    }
)


/**
 * Response interceptor for error handling and token refresh
 */
apiClient.interceptors.response.use(
    (response) => {
        // Log request duration in development
        if (process.env.NODE_ENV === 'development') {
            const duration = new Date().getTime() - response.config.metadata?.startTime
            console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }

        // Handle 204 No Content responses properly
        if (response.status === 204) {
            // For 204 responses, set data to null to avoid issues with undefined data
            response.data = null
        }

        return response
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            // Prevent infinite retry loops
            if (!originalRequest._retry) {
                originalRequest._retry = true

                // Clear invalid token and redirect to login
                removeAuthToken()

                // Don't show error toast for auth endpoints
                const isAuthEndpoint = originalRequest.url?.includes('/auth/')
                if (!isAuthEndpoint) {
                    toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')
                }

                // Redirect to login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login'
                }
            }
            return Promise.reject(error)
        }

        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
            toast.error('Sie haben keine Berechtigung für diese Aktion.')
            return Promise.reject(error)
        }

        // Handle 404 Not Found errors
        if (error.response?.status === 404) {
            // Don't show toast for completion request endpoints - they handle their own error display
            const isCompletionRequestEndpoint = originalRequest.url?.includes('/completion-request')
            if (!isCompletionRequestEndpoint) {
                toast.error('Die angeforderte Ressource wurde nicht gefunden.')
            }
            return Promise.reject(error)
        }



        // Handle 400 Bad Request errors (validation errors)
        if (error.response?.status === 400) {
            const errorMessage = error.response.data?.message || 'Ungültige Anfrage';
            console.error('API 400 Error Details:', {
                url: originalRequest.url,
                method: originalRequest.method,
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });

            toast.error(`Validierungsfehler: ${errorMessage}`);
            return Promise.reject(error);
        }

        // Handle 422 Validation errors
        if (error.response?.status === 422) {
            const validationErrors = error.response.data?.details || error.response.data?.errors;
            if (validationErrors) {
                // Handle validation errors from backend
                Object.keys(validationErrors).forEach(field => {
                    toast.error(`${field}: ${validationErrors[field]}`);
                });
            } else {
                toast.error('Validierungsfehler: Bitte überprüfen Sie Ihre Eingaben.');
            }
            return Promise.reject(error);
        }

        // Handle 500 Server errors
        if (error.response?.status === 500) {
            toast.error('Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
            return Promise.reject(error)
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || !error.response) {
            toast.error('Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung.')
            return Promise.reject(error)
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            toast.error('Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.')
            return Promise.reject(error)
        }

        // Generic error handling
        const errorMessage = error.response?.data?.message || 'Ein unbekannter Fehler ist aufgetreten.'
        console.error('API Error:', {
            status: error.response?.status,
            message: errorMessage,
            url: originalRequest.url,
            method: originalRequest.method,
            data: error.response?.data,
            fullError: error,
        })

        // Don't show generic errors for auth endpoints (they handle their own errors)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/')
        if (!isAuthEndpoint) {
            toast.error(errorMessage)
        }

        return Promise.reject(error)
    }
)

/**
 * Helper function to create form data requests
 */
export const createFormDataClient = (): AxiosInstance => {
    const formDataClient = axios.create({
        baseURL: `${API_BASE_URL}/v1`,
        timeout: 30000, // Longer timeout for file uploads
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    // Use the same interceptors
    formDataClient.interceptors.request.use(apiClient.interceptors.request.handlers[0].fulfilled)
    formDataClient.interceptors.response.use(
        apiClient.interceptors.response.handlers[0].fulfilled,
        apiClient.interceptors.response.handlers[0].rejected
    )

    return formDataClient
}

/**
 * Export the configured API client
 */
export default apiClient

// Type augmentation for metadata
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number
        }
    }
} 