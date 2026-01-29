/**
 * Firebase Configuration
 * Initialize Firebase for client-side authentication
 */

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log('✅ Firebase initialized');

// Google provider
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const firebaseAuth = {
    // Email/Password sign up
    async signUp(email: string, password: string): Promise<FirebaseUser> {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    },

    // Email/Password sign in
    async signIn(email: string, password: string): Promise<FirebaseUser> {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    },

    // Google sign in
    async signInWithGoogle(): Promise<FirebaseUser> {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    },

    // Sign out
    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
    },

    // Get current user's ID token
    async getIdToken(): Promise<string | null> {
        const user = auth.currentUser;
        if (!user) return null;
        return user.getIdToken();
    },

    // Listen to auth state changes
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
        return onAuthStateChanged(auth, callback);
    },
};

export type { FirebaseUser };
