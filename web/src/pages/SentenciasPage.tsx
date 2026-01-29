/**
 * Sentencias Page
 * Register and track court sentences
 */

import { useState, useEffect } from 'react';
import { sentenciaApi, scraperApi, type Sentencia } from '../services/api';
import './Pages.css';

export function SentenciasPage() {
    const [sentencias, setSentencias] = useState<Sentencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [rolSearch, setRolSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSentencias();
    }, []);

    async function loadSentencias() {
        try {
            setLoading(true);
            const data = await sentenciaApi.list();
            setSentencias(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar sentencias');
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSearching(true);

        try {
            // 1. Iniciar tarea de scraping
            // Import scraperApi dynamically or assume it's imported
            const task = await scraperApi.run('civil', rolSearch);

            // 2. Polling para esperar resultado
            const checkStatus = async () => {
                const status = await scraperApi.getStatus(task.id);

                if (status.status === 'completed') {
                    // Éxito: recargar tabla y cerrar modal
                    await loadSentencias();
                    setSearching(false);
                    setShowForm(false);
                    setRolSearch('');
                } else if (status.status === 'failed') {
                    setError(`Error en búsqueda: ${status.error}`);
                    setSearching(false);
                } else {
                    // Seguir esperando
                    setTimeout(checkStatus, 1000);
                }
            };

            checkStatus();

        } catch (err) {
            console.error(err);
            setError('Error al iniciar búsqueda en PJUD.');
            setSearching(false);
        }
    };

    const handleDelete = async (id: string, rol: string) => {
        if (!confirm(`¿Estás seguro que deseas eliminar la Sentencia ${rol}?`)) return;

        try {
            await sentenciaApi.delete(id);
            setSentencias(sentencias.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            setError('Error al eliminar la sentencia.');
        }
    };

    return (
        <div className="page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Sentencias</h1>
                        <p>Registro y seguimiento de sentencias judiciales</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        + Nueva Sentencia
                    </button>
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    {error} <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Nueva Sentencia</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSearch} className="form">
                            <div className="form-group">
                                <label>ROL de la Causa</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={rolSearch}
                                        onChange={(e) => setRolSearch(e.target.value)}
                                        placeholder="ej: C-1234-2024"
                                        required
                                        disabled={searching}
                                    />
                                </div>
                                <p className="help-text">Ingresa el ROL. Buscaremos los datos automáticamente en el Poder Judicial.</p>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={searching}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={searching}>
                                    {searching ? 'Buscando en PJUD...' : 'Buscar y Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">Cargando sentencias...</div>
            ) : sentencias.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <span className="empty-icon">⚖️</span>
                        <p>No hay sentencias registradas</p>
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            Registrar Primera Sentencia
                        </button>
                    </div>
                </div>
            ) : (
                <div className="table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ROL</th>
                                <th>Tribunal</th>
                                <th>Materia</th>
                                <th>Estado</th>
                                <th>Plazos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sentencias.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-mono">{s.rol}</td>
                                    <td>{s.tribunal}</td>
                                    <td>{s.materia || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${s.estado}`}>
                                            {s.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {s.plazos?.length > 0 ? (
                                            <span className="badge badge-warning">{s.plazos.length} plazos</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Sin plazos</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn-icon" title="Ver detalles">👁️</button>
                                        <button className="btn-icon" title="Agregar plazo">📅</button>
                                        <button
                                            className="btn-icon btn-danger"
                                            title="Eliminar sentencia"
                                            onClick={() => handleDelete(s.id, s.rol)}
                                            style={{ color: '#dc3545', marginLeft: '8px' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
