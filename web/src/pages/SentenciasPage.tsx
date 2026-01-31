/**
 * Sentencias Page
 * Register and track court sentences
 */

import { useState, useEffect } from 'react';
import { scraperApi, sentenciaApi, type Sentencia } from '../services/api';
import { PJUD_CORTES } from '../data/pjud_courts';
import './Pages.css';

export function SentenciasPage() {
    const [sentencias, setSentencias] = useState<Sentencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false); // Form state
    const [rolInput, setRolInput] = useState('');
    const [yearInput, setYearInput] = useState(new Date().getFullYear().toString());
    const [selectedCorte, setSelectedCorte] = useState("0"); // "0" = Todos
    const [selectedTribunal, setSelectedTribunal] = useState("0"); // "0" = Todos
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCausa, setSelectedCausa] = useState<Sentencia | null>(null);
    const [detailTab, setDetailTab] = useState<'info' | 'litigantes' | 'historia'>('info');
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [activeCuadernoId, setActiveCuadernoId] = useState<string | null>(null);
    const [logsModal, setLogsModal] = useState<{ visible: boolean; logs: any | null }>({ visible: false, logs: null });

    useEffect(() => {
        loadSentencias();
    }, []);

    useEffect(() => {
        if (selectedCausa?.cuadernos && selectedCausa.cuadernos.length > 0) {
            setActiveCuadernoId(selectedCausa.cuadernos[0].id);
        } else {
            setActiveCuadernoId(null);
        }
    }, [selectedCausa]);

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

    const [progressMsg, setProgressMsg] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSearching(true);
        setProgressMsg('Iniciando búsqueda...');

        try {
            // 1. Iniciar tarea calculando query
            const query = `C-${rolInput}-${yearInput}`;

            const task = await scraperApi.run('civil', query, {
                corte_id: selectedCorte,
                tribunal_id: selectedTribunal
            });

            // 2. Polling para esperar resultado
            const checkStatus = async () => {
                const status = await scraperApi.getStatus(task.id);

                // Update progress message
                if (status.progress_message) {
                    setProgressMsg(status.progress_message);
                }

                if (status.status === 'completed') {
                    await loadSentencias();
                    setSearching(false);
                    setShowForm(false);
                    setRolInput('');
                    setYearInput(new Date().getFullYear().toString());
                    setSelectedCorte("0");
                    setSelectedTribunal("0");
                    setProgressMsg(null);
                } else if (status.status === 'failed') {
                    setError(`Error en búsqueda: ${status.error}`);
                    setSearching(false);
                    setProgressMsg(null);
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
            setProgressMsg(null);
        }
    };

    const handleDelete = async (id: string, rol: string) => {
        if (!confirm(`¿Estás seguro que deseas eliminar la Causa ${rol}?`)) return;

        try {
            await sentenciaApi.delete(id);
            setSentencias(sentencias.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            setError('Error al eliminar la causa.');
        }
    };



    // ... (keep handleDelete)

    const handleSync = async (causa: Sentencia) => {
        setSyncingId(causa.id);
        setError(null);
        // We can use a toast or small indicator for sync progress, but for now just use fetching

        try {
            // Start scraping with the same ROL
            const task = await scraperApi.run('civil', causa.rol, {
                corte_id: "0",
                tribunal_id: "0"
            });

            // Poll for completion
            const checkStatus = async () => {
                const status = await scraperApi.getStatus(task.id);

                if (status.status === 'completed') {
                    await loadSentencias();
                    setSyncingId(null);
                } else if (status.status === 'failed') {
                    setError(`Error al sincronizar: ${status.error}`);
                    setSyncingId(null);
                } else {
                    setTimeout(checkStatus, 1000);
                }
            };

            checkStatus();
        } catch (err) {
            console.error(err);
            setError('Error al sincronizar la causa.');
            setSyncingId(null);
        }
    };

    return (
        <div className="page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Causas</h1>
                        <p>Registro y seguimiento de causas judiciales</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        + Nueva Causa
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
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Corte</label>
                                <select
                                    className="form-control"
                                    value={selectedCorte}
                                    onChange={(e) => {
                                        setSelectedCorte(e.target.value);
                                        setSelectedTribunal("0");
                                    }}
                                >
                                    <option value="0">Todas las Cortes</option>
                                    {PJUD_CORTES.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Tribunal</label>
                                <select
                                    className="form-control"
                                    value={selectedTribunal}
                                    onChange={(e) => setSelectedTribunal(e.target.value)}
                                    disabled={selectedCorte === "0"}
                                >
                                    <option value="0">Todos los Tribunales</option>
                                    {selectedCorte !== "0" && PJUD_CORTES.find(c => c.id === selectedCorte)?.tribunales.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>ROL (Número)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 1234"
                                        value={rolInput}
                                        onChange={(e) => setRolInput(e.target.value)}
                                        required
                                        disabled={searching}
                                    />
                                </div>
                                <div className="form-group" style={{ width: '100px' }}>
                                    <label>Año</label>
                                    <input
                                        type="number"
                                        value={yearInput}
                                        onChange={(e) => setYearInput(e.target.value)}
                                        placeholder="Año"
                                        required
                                        disabled={searching}
                                        min="2000"
                                        max="2099"
                                    />
                                </div>
                            </div>
                            <p className="help-text">Ingresa el número y año del ROL. Buscaremos los datos automáticamente en el Poder Judicial.</p>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={searching}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={searching}>
                                    {searching ? 'Buscando...' : 'Buscar y Agregar'}
                                </button>
                            </div>

                            {searching && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center'
                                }}>
                                    <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                                    <p style={{ fontWeight: 500, color: '#495057' }}>{progressMsg || 'Conectando con PJUD...'}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>Esto puede tomar unos segundos.</p>
                                </div>
                            )}
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
                                <th>Última Sync</th>
                                <th>Plazos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sentencias.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-mono">
                                        {s.url ? (
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ textDecoration: 'underline', color: 'var(--primary)', fontWeight: 500 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {s.rol}
                                            </a>
                                        ) : (
                                            s.rol
                                        )}
                                    </td>
                                    <td>{s.tribunal}</td>
                                    <td>{s.materia || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${s.estado}`}>
                                            {s.estado}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {s.updated_at ? new Date(s.updated_at).toLocaleDateString('es-CL', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </td>
                                    <td>
                                        {s.plazos?.length > 0 ? (
                                            <span className="badge badge-warning">{s.plazos.length} plazos</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Sin plazos</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn-icon" title="Ver detalles" onClick={() => { setSelectedCausa(s); setDetailTab('info'); }}>👁️</button>
                                        <button
                                            className="btn-icon"
                                            title="Sincronizar (buscar actualizaciones)"
                                            onClick={() => handleSync(s)}
                                            disabled={syncingId === s.id}
                                            style={{ opacity: syncingId === s.id ? 0.5 : 1 }}
                                        >
                                            {syncingId === s.id ? '⏳' : '🔄'}
                                        </button>
                                        <button
                                            className="btn-icon"
                                            title="Ver logs del scraper"
                                            onClick={async () => {
                                                try {
                                                    const logs = await sentenciaApi.getLogs(s.id);
                                                    setLogsModal({ visible: true, logs });
                                                } catch (err) {
                                                    console.error(err);
                                                    setError('Error al cargar logs');
                                                }
                                            }}
                                        >
                                            📋
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            title="Eliminar causa"
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

            {selectedCausa && (() => {
                const activeCuaderno = selectedCausa.cuadernos?.find(c => c.id === activeCuadernoId);
                // Prefer cuaderno-specific info, fallback to top-level
                const info = activeCuaderno ? { ...selectedCausa, ...activeCuaderno.header } : selectedCausa;
                const litigantes = activeCuaderno ? activeCuaderno.litigantes : (selectedCausa.litigantes || []);
                const historia = activeCuaderno ? activeCuaderno.historia : (selectedCausa.historia || []);

                return (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                            <div className="modal-header">
                                <h2>Causa {selectedCausa.rol}</h2>
                                <button className="modal-close" onClick={() => setSelectedCausa(null)}>×</button>
                            </div>

                            {/* Cuaderno Selector */}
                            {selectedCausa.cuadernos && selectedCausa.cuadernos.length > 0 && (
                                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ fontWeight: 600, color: '#495057' }}>Cuaderno:</label>
                                    <select
                                        value={activeCuadernoId || ''}
                                        onChange={(e) => setActiveCuadernoId(e.target.value)}
                                        style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.95rem' }}
                                    >
                                        {selectedCausa.cuadernos.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                                <button
                                    className={`btn-secondary ${detailTab === 'info' ? 'btn-primary' : ''}`}
                                    onClick={() => setDetailTab('info')}
                                >
                                    📋 Información
                                </button>
                                <button
                                    className={`btn-secondary ${detailTab === 'litigantes' ? 'btn-primary' : ''}`}
                                    onClick={() => setDetailTab('litigantes')}
                                >
                                    👥 Litigantes
                                </button>
                                <button
                                    className={`btn-secondary ${detailTab === 'historia' ? 'btn-primary' : ''}`}
                                    onClick={() => setDetailTab('historia')}
                                >
                                    📜 Historia
                                </button>
                            </div>

                            {/* Tab Content */}
                            {detailTab === 'info' && (
                                <div className="detail-info">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><strong>ROL:</strong> {info.rol}</div>
                                        <div><strong>Tribunal:</strong> {info.tribunal}</div>
                                        <div><strong>Carátula:</strong> {info.caratula || info.caratulado || '-'}</div>
                                        <div><strong>Materia:</strong> {info.materia || '-'}</div>
                                        <div><strong>Estado:</strong> <span className={`badge badge-${selectedCausa.estado}`}>{selectedCausa.estado}</span></div>

                                        <div><strong>Procedimiento:</strong> {info.procedimiento || info.proc || '-'}</div>
                                        <div><strong>Etapa:</strong> {info.etapa || '-'}</div>
                                        <div><strong>Estado Procesal:</strong> {info.estado_procesal || info.estadoProc || '-'}</div>
                                        <div><strong>Ubicación:</strong> {info.ubicacion || '-'}</div>
                                        <div><strong>Estado Adm.:</strong> {info.estado_administrativo || info.estAdm || '-'}</div>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'litigantes' && (
                                <div className="detail-litigantes">
                                    {litigantes && litigantes.length > 0 ? (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Nombre</th>
                                                    <th>RUT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {litigantes.map((l, i) => (
                                                    <tr key={i}>
                                                        <td>{l.participante}</td>
                                                        <td>{l.nombre}</td>
                                                        <td>{l.rut || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p style={{ color: '#888' }}>No hay litigantes registrados {activeCuaderno ? 'en este cuaderno' : ''}</p>
                                    )}
                                </div>
                            )}

                            {detailTab === 'historia' && (
                                <div className="detail-historia">
                                    {historia && historia.length > 0 ? (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Trámite</th>
                                                    <th>Descripción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historia.map((h, i) => (
                                                    <tr key={i}>
                                                        <td>{h.fecha}</td>
                                                        <td>{h.tramite}</td>
                                                        <td>{h.descripcion}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p style={{ color: '#888' }}>No hay historial disponible {activeCuaderno ? 'en este cuaderno' : ''}</p>
                                    )}
                                </div>
                            )}

                            <div className="form-actions" style={{ marginTop: '16px' }}>
                                <button className="btn-secondary" onClick={() => setSelectedCausa(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {logsModal.visible && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h2>📋 Logs del Scraper</h2>
                            <button className="modal-close" onClick={() => setLogsModal({ visible: false, logs: null })}>×</button>
                        </div>

                        {logsModal.logs?.status === 'no_task' ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                <p>No hay logs disponibles para esta causa.</p>
                                <p style={{ fontSize: '0.9rem' }}>Esta causa no tiene un scraping task asociado.</p>
                            </div>
                        ) : logsModal.logs?.status === 'success' && logsModal.logs?.task ? (
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div>
                                        <strong>Estado:</strong>{' '}
                                        <span className={`badge badge-${logsModal.logs.task.status === 'completed' ? 'activa' : logsModal.logs.task.status === 'failed' ? 'archivada' : 'suspendida'}`}>
                                            {logsModal.logs.task.status}
                                        </span>
                                    </div>
                                    <div><strong>Query:</strong> {logsModal.logs.task.search_query || '-'}</div>
                                    <div><strong>Creado:</strong> {logsModal.logs.task.created_at ? new Date(logsModal.logs.task.created_at).toLocaleString('es-CL') : '-'}</div>
                                    <div><strong>Iniciado:</strong> {logsModal.logs.task.started_at ? new Date(logsModal.logs.task.started_at).toLocaleString('es-CL') : '-'}</div>
                                    <div><strong>Completado:</strong> {logsModal.logs.task.completed_at ? new Date(logsModal.logs.task.completed_at).toLocaleString('es-CL') : '-'}</div>
                                </div>

                                {logsModal.logs.task.progress_message && (
                                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
                                        <strong>Último mensaje:</strong> {logsModal.logs.task.progress_message}
                                    </div>
                                )}

                                {logsModal.logs.task.error && (
                                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#ffe7e7', borderRadius: '4px', border: '1px solid #ffb3b3' }}>
                                        <strong>Error:</strong> {logsModal.logs.task.error}
                                    </div>
                                )}

                                {logsModal.logs.task.result && (
                                    <div>
                                        <h3 style={{ marginBottom: '10px' }}>Resultado:</h3>
                                        <pre style={{
                                            backgroundColor: '#f5f5f5',
                                            padding: '15px',
                                            borderRadius: '4px',
                                            overflow: 'auto',
                                            maxHeight: '300px',
                                            fontSize: '0.85rem',
                                            color: '#333'
                                        }}>
                                            {JSON.stringify(logsModal.logs.task.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <div className="spinner"></div>
                                <p>Cargando logs...</p>
                            </div>
                        )}

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setLogsModal({ visible: false, logs: null })}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
