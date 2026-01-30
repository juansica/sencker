/**
 * Dashboard Page
 * Main dashboard with overview stats
 */

import './Pages.css';

import { useState, useEffect } from 'react';
import { sentenciaApi, type DashboardLegalStats } from '../services/api';
import './Pages.css';

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardLegalStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const data = await sentenciaApi.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        } finally {
            setLoading(false);
        }
    }

    const displayStats = stats || {
        total_sentencias: 0,
        total_plazos_activos: 0,
        plazos_vencidos: 0,
        plazos_proximos: 0
    };

    if (loading) {
        return <div className="page"><div className="loading-state">Cargando tablero...</div></div>;
    }

    return (
        <div className="page">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Resumen general de actividad legal</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-content">
                        <span className="stat-value">{displayStats.total_sentencias}</span>
                        <span className="stat-label">Causas Registradas</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <span className="stat-value">{displayStats.total_plazos_activos}</span>
                        <span className="stat-label">Plazos Pendientes</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <span className="stat-value">{displayStats.plazos_vencidos}</span>
                        <span className="stat-label">Plazos Vencidos</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">🔜</div>
                    <div className="stat-content">
                        <span className="stat-value">{displayStats.plazos_proximos}</span>
                        <span className="stat-label">Vencen en 7 días</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Resumen de Estado</h3>
                </div>
                <div className="empty-state">
                    {displayStats.total_sentencias > 0 ? (
                        <div style={{ textAlign: 'left', width: '100%' }}>
                            <p>Tienes <strong>{displayStats.total_sentencias}</strong> causas activas.</p>
                            <p>Atención requerida en <strong>{displayStats.plazos_vencidos}</strong> plazos vencidos.</p>
                        </div>
                    ) : (
                        <div>
                            <span className="empty-icon">📭</span>
                            <p>No hay actividad reciente. Comienza registrando una sentencia.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
