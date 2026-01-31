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
    progress_message: string | null;
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
    async run(taskType: string = 'civil', searchQuery?: string, searchParams?: any): Promise<ScrapingTask> {
        return apiRequest<ScrapingTask>('/api/scraper/run', {
            method: 'POST',
            body: JSON.stringify({
                task_type: taskType,
                search_query: searchQuery,
                search_params: searchParams
            }),
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

// ==========================================
// Sentencias & Plazos API
// ==========================================

export type SentenciaStatus = 'activa' | 'archivada' | 'suspendida';
export type PlazoStatus = 'pendiente' | 'cumplido' | 'vencido' | 'cancelado';

export interface Plazo {
    id: string;
    sentencia_id: string;
    descripcion: string;
    fecha_vencimiento: string;
    tipo: string;
    estado: PlazoStatus;
    is_fatal: boolean;
}

export interface Litigante {
    participante: string;  // DDO, DTE, AB
    rut?: string;
    tipo_persona?: string;  // Natural, Jurídica
    nombre: string;
}

export interface HistoriaItem {
    folio?: string;
    etapa?: string;
    tramite: string;
    descripcion: string;
    fecha: string;
    foja?: string;
}

export interface Cuaderno {
    id: string;
    nombre: string;
    header: any; // Contains Etapa, Estado, etc specific to this cuaderno
    litigantes: Litigante[];
    historia: HistoriaItem[];
}

export interface Sentencia {
    id: string;
    rol: string;
    tribunal: string;
    caratula?: string;
    materia?: string;
    estado: SentenciaStatus;
    url?: string | null;
    scraping_task_id?: string | null;
    fecha_ingreso?: string;
    // Detailed PJUD info
    estado_administrativo?: string;
    procedimiento?: string;
    ubicacion?: string;
    estado_procesal?: string;
    etapa?: string;
    litigantes?: Litigante[];
    historia?: HistoriaItem[];
    cuadernos?: Cuaderno[];
    // Timestamps
    updated_at?: string;
    // Related
    plazos: Plazo[];
}

export interface DashboardLegalStats {
    total_sentencias: number;
    total_plazos_activos: number;
    plazos_vencidos: number;
    plazos_proximos: number;
}

export const sentenciaApi = {
    async list(search?: string): Promise<Sentencia[]> {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiRequest<Sentencia[]>(`/api/sentencias${query}`);
    },

    async create(data: { rol: string; tribunal: string; materia?: string; fecha_ingreso?: string }): Promise<Sentencia> {
        return apiRequest<Sentencia>('/api/sentencias', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        await apiRequest(`/api/sentencias/${id}`, {
            method: 'DELETE',
        });
    },

    async addPlazo(sentenciaId: string, data: { descripcion: string; fecha_vencimiento: string; is_fatal: boolean }): Promise<Plazo> {
        return apiRequest<Plazo>(`/api/sentencias/${sentenciaId}/plazos`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getStats(): Promise<DashboardLegalStats> {
        return apiRequest<DashboardLegalStats>('/api/sentencias/stats');
    },

    async getLogs(id: string): Promise<any> {
        return apiRequest(`/api/sentencias/${id}/logs`);
    }
};
