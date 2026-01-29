/**
 * Plazos Page
 * Track deadlines and terms related to sentencias
 */

import { useState, useEffect } from 'react';
import { sentenciaApi, type Plazo } from '../services/api';
import './Pages.css';

interface EnrichedPlazo extends Plazo {
    sentenciaRol: string;
}

export function PlazosPage() {
    const [allPlazos, setAllPlazos] = useState<EnrichedPlazo[]>([]);
    const [filter, setFilter] = useState<'todos' | 'activos' | 'por_vencer' | 'vencidos'>('todos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const sentencias = await sentenciaApi.list();

            // Flatten plazos from all sentencias
            const flattened: EnrichedPlazo[] = sentencias.flatMap(s =>
                s.plazos.map(p => ({
                    ...p,
                    sentenciaRol: s.rol
                }))
            );

            setAllPlazos(flattened);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (estado: Plazo['estado']) => {
        switch (estado) {
            case 'pendiente': return 'info';
            case 'vencido': return 'danger';
            case 'cumplido': return 'success';
            case 'cancelado': return 'default';
            default: return 'default';
        }
    };

    const getDaysRemaining = (fechaVencimiento: string) => {
        const today = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diff = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const filteredPlazos = allPlazos.filter(p => {
        if (filter === 'todos') return true;

        const days = getDaysRemaining(p.fecha_vencimiento);

        if (filter === 'activos') return p.estado === 'pendiente';
        if (filter === 'por_vencer') return p.estado === 'pendiente' && days <= 7 && days >= 0;
        if (filter === 'vencidos') return p.estado === 'vencido' || (p.estado === 'pendiente' && days < 0);

        return true;
    });

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

            {loading ? (
                <div className="loading-state">Cargando plazos...</div>
            ) : filteredPlazos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <span className="empty-icon">📅</span>
                        <p>No hay plazos que coincidan con el filtro</p>
                        <p className="empty-hint">Los plazos se crean desde una Sentencia</p>
                    </div>
                </div>
            ) : (
                <div className="plazos-grid">
                    {filteredPlazos.map((plazo) => {
                        const daysRemaining = getDaysRemaining(plazo.fecha_vencimiento);
                        return (
                            <div key={plazo.id} className={`plazo-card ${getStatusColor(plazo.estado)}`}>
                                <div className="plazo-header">
                                    <span className="plazo-rol">{plazo.sentenciaRol}</span>
                                    <span className={`badge badge-${getStatusColor(plazo.estado)}`}>
                                        {plazo.estado}
                                    </span>
                                </div>
                                <div className="plazo-body">
                                    <h3 className="plazo-tipo">{plazo.tipo}</h3>
                                    <p className="plazo-descripcion">{plazo.descripcion}</p>
                                </div>
                                <div className="plazo-footer">
                                    <div className="plazo-dates">
                                        <span>Vence: {new Date(plazo.fecha_vencimiento).toLocaleDateString('es-CL')}</span>
                                    </div>
                                    <div className={`plazo-countdown ${daysRemaining <= 3 && daysRemaining >= 0 ? 'urgent' : ''}`}>
                                        {daysRemaining < 0 ? 'Vencido' : `${daysRemaining} días`}
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
