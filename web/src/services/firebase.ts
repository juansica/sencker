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
    apiKey: "AIzaSyDR6ANToGfWbQ97Eq-0pLizz_hQlaaPFCQ",
    authDomain: "sencker-a269e.firebaseapp.com",
    projectId: "sencker-a269e",
    storageBucket: "sencker-a269e.firebasestorage.app",
    messagingSenderId: "508435567820",
    appId: "1:508435567820:web:81a1c3bad4857a84cb9e69",
    measurementId: "G-6T79GN6MRF"
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
