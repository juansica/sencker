"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Subscription } from "@/services/api";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterPlan, setFilterPlan] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    useEffect(() => {
        loadSubscriptions();
    }, [filterPlan, filterStatus]);

    async function loadSubscriptions() {
        try {
            setLoading(true);
            const data = await api.getSubscriptions({
                plan_type: filterPlan || undefined,
                status: filterStatus || undefined,
            });
            setSubscriptions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load subscriptions");
        } finally {
            setLoading(false);
        }
    }

    if (loading && subscriptions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
                <p className="text-gray-500 mt-1">Manage and monitor all subscription plans</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                    <option value="">All Plans</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paused">Paused</option>
                </select>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p>{error}</p>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscription ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period End</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">MP ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {subscriptions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No subscriptions found
                                </td>
                            </tr>
                        ) : (
                            subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 font-mono text-sm font-medium">
                                        {sub.id.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide inline-block ${sub.plan_type === "enterprise" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                            sub.plan_type === "pro" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                                sub.plan_type === "basic" ? "bg-green-50 text-green-700 border border-green-100" :
                                                    "bg-gray-100 text-gray-600 border border-gray-200"
                                            }`}>
                                            {sub.plan_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${sub.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                            sub.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                sub.status === "past_due" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                                                    "bg-red-50 text-red-700 border border-red-100"
                                            }`}>
                                            {sub.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        {sub.current_period_end
                                            ? new Date(sub.current_period_end).toLocaleDateString()
                                            : "—"
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                        {sub.mp_preapproval_id || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(sub.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
