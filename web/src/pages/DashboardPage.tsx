/**
 * Dashboard Page
 * Main dashboard with overview stats
 */

import './Pages.css';

export function DashboardPage() {
    return (
        <div className="page">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Resumen general de actividad</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-content">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Sentencias</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Plazos Activos</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Plazos por Vencer</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Plazos Cumplidos</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Actividad Reciente</h3>
                </div>
                <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <p>No hay actividad reciente</p>
                </div>
            </div>
        </div>
    );
}
