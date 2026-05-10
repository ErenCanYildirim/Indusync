import Cookies from 'js-cookie'

// Token storage keys
const AUTH_TOKEN_KEY = 'indusync_auth_token'
const REFRESH_TOKEN_KEY = 'indusync_refresh_token'
const USER_DATA_KEY = 'indusync_user_data'

// Token expiry times (in days)
const TOKEN_EXPIRY_DAYS = 7
const REFRESH_TOKEN_EXPIRY_DAYS = 30

/**
 * Get the authentication token from cookies
 */
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return Cookies.get(AUTH_TOKEN_KEY) || null
}

/**
 * Set the authentication token in cookies
 * Note: httpOnly cannot be set from client-side JavaScript
 * For maximum security, consider setting httpOnly cookies server-side
 */
export const setAuthToken = (token: string, rememberMe: boolean = false): void => {
    const expiry = rememberMe ? TOKEN_EXPIRY_DAYS * 4 : TOKEN_EXPIRY_DAYS

    Cookies.set(AUTH_TOKEN_KEY, token, {
        expires: expiry,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
        // Note: httpOnly can only be set server-side
        // Current protection: sameSite: 'strict' + secure in production
    })
}

/**
 * Remove the authentication token from cookies
 */
export const removeAuthToken = (): void => {
    Cookies.remove(AUTH_TOKEN_KEY, { path: '/' })
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' })
    Cookies.remove(USER_DATA_KEY, { path: '/' })
}

/**
 * Get the refresh token from cookies
 */
export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return Cookies.get(REFRESH_TOKEN_KEY) || null
}

/**
 * Set the refresh token in cookies
 */
export const setRefreshToken = (token: string): void => {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
        expires: REFRESH_TOKEN_EXPIRY_DAYS,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        httpOnly: false // Note: In production, consider using httpOnly cookies for refresh tokens
    })
}

/**
 * Store user data in localStorage (for quick access)
 */
export const setUserData = (userData: any): void => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
    } catch (error) {
        console.warn('Failed to store user data:', error)
    }
}

/**
 * Get user data from localStorage
 */
export const getUserData = (): any | null => {
    if (typeof window === 'undefined') return null
    try {
        const data = localStorage.getItem(USER_DATA_KEY)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.warn('Failed to parse user data:', error)
        return null
    }
}

/**
 * Remove user data from localStorage
 */
export const removeUserData = (): void => {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(USER_DATA_KEY)
    } catch (error) {
        console.warn('Failed to remove user data:', error)
    }
}

/**
 * Check if the current token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    if (!token) return true

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        return payload.exp < currentTime
    } catch (error) {
        console.warn('Failed to parse token:', error)
        return true
    }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const token = getAuthToken()
    if (!token) return false
    return !isTokenExpired(token)
}

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
    removeAuthToken()
    removeUserData()
} 