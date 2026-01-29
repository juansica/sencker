/**
 * useAuth Hook with Firebase
 * React hook for Firebase authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import { firebaseAuth } from '../services/firebase';
import type { FirebaseUser } from '../services/firebase';

interface AuthState {
    user: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = user !== null;

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await firebaseAuth.signIn(email, password);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(formatFirebaseError(message));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await firebaseAuth.signUp(email, password);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(formatFirebaseError(message));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await firebaseAuth.signInWithGoogle();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Google login failed';
            setError(formatFirebaseError(message));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await firebaseAuth.signOut();
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError,
    };
}

// Format Firebase error messages for display
function formatFirebaseError(message: string): string {
    if (message.includes('email-already-in-use')) {
        return 'Este email ya está registrado. ¿Quizás iniciaste sesión con Google anteriormente?';
    }
    if (message.includes('invalid-email')) {
        return 'Email inválido';
    }
    if (message.includes('weak-password')) {
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (message.includes('user-not-found') || message.includes('wrong-password') || message.includes('invalid-credential')) {
        return 'Email o contraseña incorrectos. Si usaste Google, presiona "Continuar con Google".';
    }
    if (message.includes('account-exists-with-different-credential')) {
        return 'Ya existe una cuenta con este email. Por favor inicia sesión con tu método anterior (Google/Email).';
    }
    if (message.includes('popup-closed-by-user')) {
        return 'Inicio de sesión cancelado';
    }
    if (message.includes('popup-blocked')) {
        return 'El navegador bloqueó la ventana emergente. Por favor permítela e intenta de nuevo.';
    }
    return 'Ocurrió un error. Por favor intenta nuevamente.';
}
