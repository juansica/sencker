"use client";

import { useEffect, useState } from "react";
import { api, DashboardStats } from "@/services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadStats}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Mock data for demo when API is not connected
  const displayStats = stats || {
    total_organizations: 0,
    active_organizations: 0,
    total_users: 0,
    total_subscriptions: 0,
    subscriptions_by_plan: { free: 0, basic: 0, pro: 0, enterprise: 0 },
    subscriptions_by_status: { active: 0, past_due: 0, cancelled: 0 },
    recent_payments_total: 0,
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your Sencker platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Organizations"
          value={displayStats.total_organizations}
          subtitle={`${displayStats.active_organizations} active`}
          icon="🏢"
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={displayStats.total_users}
          subtitle="Across all organizations"
          icon="👥"
          color="green"
        />
        <StatCard
          title="Subscriptions"
          value={displayStats.total_subscriptions}
          subtitle={`${displayStats.subscriptions_by_status?.active || 0} active`}
          icon="💳"
          color="purple"
        />
        <StatCard
          title="Revenue (30d)"
          value={`$${displayStats.recent_payments_total.toFixed(2)}`}
          subtitle="From payments"
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Subscriptions by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Subscriptions by Plan</h2>
          <div className="space-y-4">
            {Object.entries(displayStats.subscriptions_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize font-medium">{plan}</span>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  <div className="w-48 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${displayStats.total_subscriptions > 0
                          ? (count / displayStats.total_subscriptions) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-gray-900 font-bold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Subscription Status</h2>
          <div className="space-y-4">
            {Object.entries(displayStats.subscriptions_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1">
                <span className="text-gray-600 capitalize font-medium">{status.replace("_", " ")}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                  status === "past_due" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  color: "blue" | "green" | "purple" | "yellow";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}
