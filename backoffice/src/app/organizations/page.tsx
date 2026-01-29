"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Organization, CreateOrganizationData } from "@/services/api";

const PLAN_PRICES: Record<string, string> = {
    free: "$0.00",
    basic: "$29.00",
    pro: "$99.00",
    enterprise: "$499.00",
};

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [planFilter, setPlanFilter] = useState("All Plans");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadOrganizations();
    }, []);

    async function loadOrganizations() {
        try {
            setLoading(true);
            const data = await api.getOrganizations();
            setOrganizations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load organizations");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(data: CreateOrganizationData) {
        try {
            await api.createOrganization(data);
            setShowCreateModal(false);
            loadOrganizations();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create organization");
        }
    }

    const filteredOrgs = organizations.filter(org => {
        // Search
        if (searchTerm && !org.name.toLowerCase().includes(searchTerm.toLowerCase()) && !org.slug.includes(searchTerm.toLowerCase())) {
            return false;
        }
        // Status
        if (statusFilter !== "All Statuses") {
            const isActive = statusFilter === "Active";
            if (org.is_active !== isActive) return false;
        }
        // Plan
        if (planFilter !== "All Plans") {
            const plan = org.subscription?.plan_type || "free";
            if (planFilter.toLowerCase() !== plan.toLowerCase()) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="bg-[#F9FAFB] py-8 px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm text-sm">
                            <span className="material-icons-outlined text-lg mr-2 text-gray-500">download</span>
                            Export
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-[#111827] border border-transparent rounded-md font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-slate-900 transition-colors shadow-sm text-sm"
                        >
                            <span className="material-icons-outlined text-lg mr-2">add</span>
                            New Organization
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-icons-outlined text-gray-400 text-lg">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-colors"
                            placeholder="Search organizations..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900 shadow-sm cursor-pointer appearance-none transition-colors min-w-[160px]"
                            >
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <span className="material-icons-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900 shadow-sm cursor-pointer appearance-none transition-colors min-w-[160px]"
                            >
                                <option>All Plans</option>
                                <option>Enterprise</option>
                                <option>Pro</option>
                                <option>Basic</option>
                                <option>Free</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <span className="material-icons-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto px-8 pb-8">
                <div className="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">
                                    Organization
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">
                                    Plan
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">
                                    Users
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No organizations found
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((org) => {
                                    const plan = org.subscription?.plan_type || "free";
                                    const price = PLAN_PRICES[plan] || "$0.00";
                                    const initials = org.name.substring(0, 2).toUpperCase();

                                    // Generate mock colors based on organization ID for avatar
                                    const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-teal-100 text-teal-600'];
                                    const colorClass = colors[org.id.charCodeAt(0) % colors.length];

                                    return (
                                        <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center font-bold`}>
                                                            {initials}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <Link href={`/organizations/${org.id}`} className="hover:underline">
                                                            <div className="text-sm font-semibold text-gray-900">{org.name}</div>
                                                        </Link>
                                                        <div className="text-xs text-gray-500">{org.slug}.sencker.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col items-start">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 uppercase ${plan === "enterprise" ? "bg-blue-100 text-blue-800" :
                                                            plan === "pro" ? "bg-purple-100 text-purple-800" :
                                                                plan === "basic" ? "bg-green-100 text-green-800" :
                                                                    "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {plan}
                                                    </span>
                                                    <div className="text-sm text-gray-900 font-medium">{price} <span className="text-gray-500 text-xs font-normal">/mo</span></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <span className="mr-2 font-medium">{org.user_count}</span> users
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">—</div>
                                                <div className="text-xs text-gray-500">No contact info</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${org.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {org.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Mock */}
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filteredOrgs.length > 0 ? 1 : 0}</span> to <span className="font-medium text-gray-900">{filteredOrgs.length}</span> of <span className="font-medium text-gray-900">{filteredOrgs.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button disabled className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateOrganizationModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreate}
                />
            )}
        </div>
    );
}

function CreateOrganizationModal({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (data: CreateOrganizationData) => void;
}) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [loading, setLoading] = useState(false);

    function handleNameChange(value: string) {
        setName(value);
        // Auto-generate slug from name
        const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        setSlug(generatedSlug);
        setSubdomain(generatedSlug);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !slug || !subdomain) return;

        setLoading(true);
        await onCreate({ name, slug, subdomain });
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Organization</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="e.g. Acme Inc"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="acme"
                            pattern="[a-z0-9-]+"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                className="flex-1 px-4 py-2 bg-white border border-gray-300 border-r-0 rounded-l-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="acme"
                                pattern="[a-z0-9-]+"
                                required
                            />
                            <span className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-r-lg text-gray-500 font-medium text-sm flex items-center">
                                .sencker.com
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name || !slug || !subdomain}
                            className="flex-1 px-4 py-2.5 bg-[#111827] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-sm hover:shadow"
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
