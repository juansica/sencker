/**
 * Sencker API Service
 * Handles all communication with the FastAPI backend using Firebase auth
 */

import { firebaseAuth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Request helper with Firebase token
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await firebaseAuth.getIdToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Types
export interface User {
    id: string;
    email: string;
    full_name: string | null;
    firebase_uid: string;
    is_active: boolean;
    created_at: string;
}

export interface ScrapingTask {
    id: string;
    task_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    search_query: string | null;
    result: Record<string, unknown> | null;
    error: string | null;
    screenshot_path: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
}

// Auth API (uses Firebase, just sync user with backend)
export const authApi = {
    async getMe(): Promise<User> {
        return apiRequest<User>('/api/auth/me');
    },
};

// Scraper API
export const scraperApi = {
    async run(taskType: string = 'civil', searchQuery?: string): Promise<ScrapingTask> {
        return apiRequest<ScrapingTask>('/api/scraper/run', {
            method: 'POST',
            body: JSON.stringify({ task_type: taskType, search_query: searchQuery }),
        });
    },

    async getStatus(taskId: string): Promise<ScrapingTask> {
        return apiRequest<ScrapingTask>(`/api/scraper/status/${taskId}`);
    },

    async getHistory(skip: number = 0, limit: number = 20): Promise<{ tasks: ScrapingTask[]; total: number }> {
        return apiRequest(`/api/scraper/history?skip=${skip}&limit=${limit}`);
    },

    async deleteTask(taskId: string): Promise<void> {
        return apiRequest(`/api/scraper/${taskId}`, { method: 'DELETE' });
    },
};

// Health check
export const checkHealth = async (): Promise<boolean> => {
    try {
        await apiRequest('/api/health');
        return true;
    } catch {
        return false;
    }
};
