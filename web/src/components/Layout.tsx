/**
 * Sidebar Layout Component
 * Main layout with left navigation sidebar
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import './Layout.css';

export type PageType = 'dashboard' | 'sentencias' | 'plazos';

interface LayoutProps {
    children: ReactNode;
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
    userEmail: string;
    onLogout: () => void;
}

interface NavItem {
    id: PageType;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sentencias', label: 'Sentencias', icon: '⚖️' },
    { id: 'plazos', label: 'Plazos', icon: '📅' },
];

export function Layout({ children, currentPage, onNavigate, userEmail, onLogout }: LayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-branding">
                        <h1 className="sidebar-logo">
                            {isSidebarCollapsed ? '🔍' : '🔍 Sencker'}
                        </h1>
                        {!isSidebarCollapsed && (
                            <span className="user-email-header" title={userEmail}>{userEmail}</span>
                        )}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expandir' : 'Colapsar'}
                    >
                        {isSidebarCollapsed ? '→' : '←'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                            title={item.label}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="logout-btn"
                        onClick={onLogout}
                        title="Cerrar sesión"
                    >
                        {isSidebarCollapsed ? '🚪' : 'Cerrar sesión'}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
