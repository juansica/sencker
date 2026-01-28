/**
 * Sentencias Page
 * Register and track court sentences
 */

import { useState } from 'react';
import './Pages.css';

interface Sentencia {
    id: string;
    rol: string;
    tribunal: string;
    materia: string;
    fechaSentencia: string;
    estado: 'pendiente' | 'notificada' | 'ejecutoriada';
    notas: string;
}

export function SentenciasPage() {
    const [sentencias, setSentencias] = useState<Sentencia[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        rol: '',
        tribunal: '',
        materia: '',
        fechaSentencia: '',
        notas: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newSentencia: Sentencia = {
            id: Date.now().toString(),
            ...formData,
            estado: 'pendiente',
        };

        setSentencias([newSentencia, ...sentencias]);
        setFormData({ rol: '', tribunal: '', materia: '', fechaSentencia: '', notas: '' });
        setShowForm(false);
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

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Registrar Sentencia</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ROL</label>
                                    <input
                                        type="text"
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                        placeholder="C-1234-2024"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tribunal</label>
                                    <input
                                        type="text"
                                        value={formData.tribunal}
                                        onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })}
                                        placeholder="1° Juzgado Civil de Santiago"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Materia</label>
                                    <input
                                        type="text"
                                        value={formData.materia}
                                        onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                                        placeholder="Cobro de pesos"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Sentencia</label>
                                    <input
                                        type="date"
                                        value={formData.fechaSentencia}
                                        onChange={(e) => setFormData({ ...formData, fechaSentencia: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    placeholder="Notas adicionales..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {sentencias.length === 0 ? (
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
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sentencias.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-mono">{s.rol}</td>
                                    <td>{s.tribunal}</td>
                                    <td>{s.materia}</td>
                                    <td>{new Date(s.fechaSentencia).toLocaleDateString('es-CL')}</td>
                                    <td>
                                        <span className={`badge badge-${s.estado}`}>
                                            {s.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon" title="Ver detalles">👁️</button>
                                        <button className="btn-icon" title="Agregar plazo">📅</button>
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
