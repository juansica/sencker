"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, OrganizationDetail, Payment } from "@/services/api";

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "payments" | "config">("overview");

    useEffect(() => {
        loadOrganization();
    }, [orgId]);

    async function loadOrganization() {
        try {
            setLoading(true);
            const [orgData, paymentsData] = await Promise.all([
                api.getOrganization(orgId),
                api.getOrganizationPayments(orgId).catch(() => []),
            ]);
            setOrganization(orgData);
            setPayments(paymentsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load organization");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleActive() {
        if (!organization) return;
        try {
            await api.updateOrganization(orgId, { is_active: !organization.is_active });
            loadOrganization();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update organization");
        }
    }

    async function handlePlanChange(plan: string) {
        try {
            await api.updateSubscription(orgId, { plan_type: plan });
            loadOrganization();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update plan");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="space-y-4">
                <Link href="/organizations" className="text-blue-500 hover:underline font-medium">← Back to Organizations</Link>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p>{error || "Organization not found"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link href="/organizations" className="text-gray-500 hover:text-gray-900 transition-colors text-sm mb-2 inline-flex items-center gap-1">
                        ← Back to Organizations
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {organization.name}
                        </h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${organization.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                            {organization.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <span className="text-blue-600 font-medium">{organization.subdomain}.sencker.com</span>
                        <span className="text-gray-300">•</span>
                        <span>Slug: {organization.slug}</span>
                    </p>
                </div>
                <button
                    onClick={handleToggleActive}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${organization.is_active
                        ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                        : "bg-white border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                >
                    {organization.is_active ? "Deactivate" : "Activate"}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    {(["overview", "users", "payments", "config"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 text-sm font-medium transition-colors capitalize border-b-2 ${activeTab === tab
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscription Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Subscription</h2>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                <span className="text-gray-500 font-medium">Current Plan</span>
                                <select
                                    value={organization.subscription?.plan_type || "free"}
                                    onChange={(e) => handlePlanChange(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                <span className="text-gray-500 font-medium">Status</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${organization.subscription?.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}>
                                    {organization.subscription?.status || "pending"}
                                </span>
                            </div>
                            {organization.subscription?.mp_preapproval_id && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">MercadoPago ID</span>
                                    <span className="text-gray-900 font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        {organization.subscription.mp_preapproval_id}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Statistics</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-3xl font-bold text-gray-900 mb-1">{organization.user_count}</p>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Users</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-3xl font-bold text-gray-900 mb-1">{payments.length}</p>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Payments</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {organization.users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No users in this organization
                                    </td>
                                </tr>
                            ) : (
                                organization.users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{user.full_name || "—"}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${user.role === "owner" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                                user.role === "admin" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                                    "bg-gray-100 text-gray-600 border border-gray-200"
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : "bg-red-50 text-red-700 border border-red-100"
                                                }`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "payments" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No payments recorded
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            ${payment.amount.toFixed(2)} {payment.currency}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${payment.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                payment.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                    "bg-red-50 text-red-700 border border-red-100"
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                                            {payment.mp_payment_id || "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "config" && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Branding & Configuration</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div
                                        className="w-10 h-10 rounded shadow-sm border border-gray-200"
                                        style={{ backgroundColor: organization.config?.primary_color || "#3b82f6" }}
                                    />
                                    <span className="text-gray-900 font-mono text-sm">{organization.config?.primary_color || "#3b82f6"}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div
                                        className="w-10 h-10 rounded shadow-sm border border-gray-200"
                                        style={{ backgroundColor: organization.config?.secondary_color || "#6b7280" }}
                                    />
                                    <span className="text-gray-900 font-mono text-sm">{organization.config?.secondary_color || "#6b7280"}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Modules</label>
                            <div className="flex flex-wrap gap-2">
                                {(organization.config?.enabled_modules || ["sentencias", "plazos"]).map((module) => (
                                    <span key={module} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium">
                                        {module}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
