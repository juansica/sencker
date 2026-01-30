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
    { id: 'sentencias', label: 'Causas', icon: '⚖️' },
    { id: 'plazos', label: 'Plazos', icon: '📅' },
];

export function Layout({ children, currentPage, onNavigate, userEmail, onLogout }: LayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

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
                {/* Top bar with notifications */}
                <div className="top-bar">
                    <div className="top-bar-spacer"></div>
                    <button
                        className="notifications-btn"
                        onClick={() => setShowNotifications(true)}
                        title="Notificaciones"
                    >
                        🔔
                        <span className="notification-badge">3</span>
                    </button>
                </div>

                {children}
            </main>

            {/* Notifications Modal (placeholder) */}
            {showNotifications && (
                <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>🔔 Notificaciones</h2>
                            <button className="modal-close" onClick={() => setShowNotifications(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <p style={{ color: '#888', textAlign: 'center' }}>
                                Próximamente: Sistema de notificaciones
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
