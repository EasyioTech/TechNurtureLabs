'use client';

import { useEffect, useCallback } from 'react';

const PWA_LOGIN_STORAGE_KEY = 'pwa_last_email';
const SESSION_STORAGE_KEY = 'pwa_session_active';

/**
 * Hook for PWA login persistence
 * Saves the last used email when user logs in
 * Auto-fills email on next login if session expires
 */
export function usePWALoginPersistence() {
    // Save email after successful login
    const saveLoginEmail = useCallback((email: string) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(PWA_LOGIN_STORAGE_KEY, email);
                sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
            }
        } catch (err) {
            // LocalStorage might be full or disabled in private mode
            console.warn('Unable to save login persistence:', err);
        }
    }, []);

    // Get saved email for auto-fill
    const getSavedEmail = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                return localStorage.getItem(PWA_LOGIN_STORAGE_KEY) || '';
            }
        } catch (err) {
            console.warn('Unable to retrieve saved email:', err);
        }
        return '';
    }, []);

    // Clear saved email on logout
    const clearLoginData = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(PWA_LOGIN_STORAGE_KEY);
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } catch (err) {
            console.warn('Unable to clear login data:', err);
        }
    }, []);

    // Check if there's an active session (browser not closed)
    const hasActiveSession = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
            }
        } catch (err) {
            console.warn('Unable to check session status:', err);
        }
        return false;
    }, []);

    return {
        saveLoginEmail,
        getSavedEmail,
        clearLoginData,
        hasActiveSession
    };
}

/**
 * Hook to auto-fill login form with saved email
 * Used on login pages to improve UX for PWA users
 */
export function useAutoFillLoginEmail(onEmailRetrieved?: (email: string) => void) {
    const { getSavedEmail } = usePWALoginPersistence();

    useEffect(() => {
        const savedEmail = getSavedEmail();
        if (savedEmail && onEmailRetrieved) {
            onEmailRetrieved(savedEmail);
        }
    }, [getSavedEmail, onEmailRetrieved]);

    return getSavedEmail();
}
