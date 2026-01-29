/**
 * API Service for Sencker Backoffice
 * 
 * Communicates with FastAPI backend at api.sencker.com
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface Organization {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user_count: number;
    subscription?: Subscription;
}

export interface OrganizationDetail extends Organization {
    users: UserSummary[];
    config?: OrganizationConfig;
}

export interface Subscription {
    id: string;
    plan_type: "free" | "basic" | "pro" | "enterprise";
    status: "pending" | "trialing" | "active" | "past_due" | "cancelled" | "paused";
    current_period_start?: string;
    current_period_end?: string;
    mp_preapproval_id?: string;
    created_at: string;
}

export interface UserSummary {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export interface OrganizationConfig {
    id: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    enabled_modules?: string[];
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: "pending" | "approved" | "rejected" | "refunded";
    payment_date: string;
    mp_payment_id?: string;
}

export interface DashboardStats {
    total_organizations: number;
    active_organizations: number;
    total_users: number;
    total_subscriptions: number;
    subscriptions_by_plan: Record<string, number>;
    subscriptions_by_status: Record<string, number>;
    recent_payments_total: number;
}

export interface CreateOrganizationData {
    name: string;
    slug: string;
    subdomain: string;
}

export interface UpdateOrganizationData {
    name?: string;
    slug?: string;
    subdomain?: string;
    is_active?: boolean;
}

// Helper function for API requests
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("firebase_token") : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// API Methods
export const api = {
    // Dashboard
    getDashboardStats: () =>
        apiRequest<DashboardStats>("/api/admin/dashboard/stats"),

    // Organizations
    getOrganizations: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
        const searchParams = new URLSearchParams();
        if (params?.skip) searchParams.set("skip", params.skip.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());
        if (params?.is_active !== undefined) searchParams.set("is_active", params.is_active.toString());
        return apiRequest<Organization[]>(`/api/admin/organizations?${searchParams}`);
    },

    getOrganization: (id: string) =>
        apiRequest<OrganizationDetail>(`/api/admin/organizations/${id}`),

    createOrganization: (data: CreateOrganizationData) =>
        apiRequest<Organization>("/api/admin/organizations", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateOrganization: (id: string, data: UpdateOrganizationData) =>
        apiRequest<Organization>(`/api/admin/organizations/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    deleteOrganization: (id: string) =>
        apiRequest<void>(`/api/admin/organizations/${id}`, {
            method: "DELETE",
        }),

    // Subscriptions
    getSubscriptions: (params?: { status?: string; plan_type?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.plan_type) searchParams.set("plan_type", params.plan_type);
        return apiRequest<Subscription[]>(`/api/admin/subscriptions?${searchParams}`);
    },

    updateSubscription: (orgId: string, data: { plan_type?: string; status?: string }) =>
        apiRequest<Subscription>(`/api/admin/organizations/${orgId}/subscription`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    // Organization Config
    updateOrganizationConfig: (orgId: string, data: Partial<OrganizationConfig>) =>
        apiRequest<OrganizationConfig>(`/api/admin/organizations/${orgId}/config`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    // Payments
    getOrganizationPayments: (orgId: string) =>
        apiRequest<Payment[]>(`/api/admin/organizations/${orgId}/payments`),
};
