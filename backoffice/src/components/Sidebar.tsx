"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            // Clear auth token
            localStorage.removeItem("firebase_token");
            // Force full reload to clear application state
            window.location.href = "/login";
        }
    };

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 transition-colors duration-200 h-full">
            <div className="flex flex-col px-6 py-4 border-b border-gray-200 bg-gray-50 gap-1">
                <div className="flex items-center">
                    <span className="material-icons-outlined text-yellow-500 mr-2 text-2xl">bolt</span>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Sencker</span>
                </div>
                <div className="flex flex-col ml-1">
                    <span className="text-xs font-semibold text-gray-900">Admin User</span>
                    <span className="text-[10px] text-gray-500">admin@sencker.com</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Backoffice
                </div>

                <Link
                    href="/"
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive("/")
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                >
                    <span className={`material-icons-outlined mr-3 ${isActive("/") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                        }`}>dashboard</span>
                    Dashboard
                </Link>

                <Link
                    href="/organizations"
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive("/organizations")
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                >
                    <span className={`material-icons-outlined mr-3 ${isActive("/organizations") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                        }`}>corporate_fare</span>
                    Organizations
                </Link>

                <Link
                    href="/subscriptions"
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive("/subscriptions")
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                >
                    <span className={`material-icons-outlined mr-3 ${isActive("/subscriptions") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                        }`}>card_membership</span>
                    Subscriptions
                </Link>

                <Link
                    href="/settings"
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive("/settings")
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                >
                    <span className={`material-icons-outlined mr-3 ${isActive("/settings") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                        }`}>settings</span>
                    Settings
                </Link>
            </nav>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounde-md"
                >
                    <span className="material-icons-outlined text-lg mr-2">logout</span>
                    <span className="text-sm font-medium">Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}
