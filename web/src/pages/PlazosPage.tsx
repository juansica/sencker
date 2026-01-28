/**
 * Plazos Page
 * Track deadlines and terms related to sentencias
 */

import { useState } from 'react';
import './Pages.css';

interface Plazo {
    id: string;
    sentenciaRol: string;
    tipo: string;
    descripcion: string;
    fechaInicio: string;
    fechaVencimiento: string;
    estado: 'activo' | 'por_vencer' | 'vencido' | 'cumplido';
}

export function PlazosPage() {
    const [plazos, setPlazos] = useState<Plazo[]>([]);
    const [filter, setFilter] = useState<'todos' | 'activos' | 'por_vencer' | 'vencidos'>('todos');

    const getStatusColor = (estado: Plazo['estado']) => {
        switch (estado) {
            case 'activo': return 'info';
            case 'por_vencer': return 'warning';
            case 'vencido': return 'danger';
            case 'cumplido': return 'success';
            default: return 'default';
        }
    };

    const getDaysRemaining = (fechaVencimiento: string) => {
        const today = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diff = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Plazos</h1>
                        <p>Control de plazos y términos judiciales</p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
                    onClick={() => setFilter('todos')}
                >
                    Todos
                </button>
                <button
                    className={`filter-btn ${filter === 'activos' ? 'active' : ''}`}
                    onClick={() => setFilter('activos')}
                >
                    Activos
                </button>
                <button
                    className={`filter-btn ${filter === 'por_vencer' ? 'active' : ''}`}
                    onClick={() => setFilter('por_vencer')}
                >
                    ⚠️ Por Vencer
                </button>
                <button
                    className={`filter-btn ${filter === 'vencidos' ? 'active' : ''}`}
                    onClick={() => setFilter('vencidos')}
                >
                    🚨 Vencidos
                </button>
            </div>

            {plazos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <span className="empty-icon">📅</span>
                        <p>No hay plazos registrados</p>
                        <p className="empty-hint">Los plazos se crean desde una Sentencia</p>
                    </div>
                </div>
            ) : (
                <div className="plazos-grid">
                    {plazos.map((plazo) => {
                        const daysRemaining = getDaysRemaining(plazo.fechaVencimiento);
                        return (
                            <div key={plazo.id} className={`plazo-card ${getStatusColor(plazo.estado)}`}>
                                <div className="plazo-header">
                                    <span className="plazo-rol">{plazo.sentenciaRol}</span>
                                    <span className={`badge badge-${getStatusColor(plazo.estado)}`}>
                                        {plazo.estado.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="plazo-body">
                                    <h3 className="plazo-tipo">{plazo.tipo}</h3>
                                    <p className="plazo-descripcion">{plazo.descripcion}</p>
                                </div>
                                <div className="plazo-footer">
                                    <div className="plazo-dates">
                                        <span>Vence: {new Date(plazo.fechaVencimiento).toLocaleDateString('es-CL')}</span>
                                    </div>
                                    <div className={`plazo-countdown ${daysRemaining <= 3 ? 'urgent' : ''}`}>
                                        {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
