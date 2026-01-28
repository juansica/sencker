/**
 * Dashboard Component
 * Main user interface after login
 */

import { useState, useEffect, useCallback } from 'react';
import { scraperApi } from '../services/api';
import type { ScrapingTask, User } from '../services/api';
import './Dashboard.css';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
    const [tasks, setTasks] = useState<ScrapingTask[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load task history
    const loadTasks = useCallback(async () => {
        try {
            const { tasks } = await scraperApi.getHistory();
            setTasks(tasks);
        } catch (err) {
            console.error('Failed to load tasks:', err);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Poll for active task status
    useEffect(() => {
        if (!activeTaskId) return;

        const interval = setInterval(async () => {
            try {
                const task = await scraperApi.getStatus(activeTaskId);

                // Update task in list
                setTasks(prev =>
                    prev.map(t => t.id === task.id ? task : t)
                );

                // Stop polling if completed
                if (task.status === 'completed' || task.status === 'failed') {
                    setActiveTaskId(null);
                    setIsRunning(false);
                }
            } catch (err) {
                console.error('Failed to get task status:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [activeTaskId]);

    const handleRunScraper = async () => {
        setIsRunning(true);
        setError(null);

        try {
            const task = await scraperApi.run('civil');
            setTasks(prev => [task, ...prev]);
            setActiveTaskId(task.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start scraper');
            setIsRunning(false);
        }
    };

    const getStatusBadge = (status: ScrapingTask['status']) => {
        const badges = {
            pending: '⏳ Pendiente',
            running: '🔄 Ejecutando',
            completed: '✅ Completado',
            failed: '❌ Error',
        };
        return badges[status];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('es-CL');
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-brand">
                    <h1>🔍 Sencker</h1>
                    <span className="header-subtitle">PJUD Scraper</span>
                </div>
                <div className="header-user">
                    <span className="user-email">{user.email}</span>
                    <button onClick={onLogout} className="logout-button">
                        Cerrar sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Scraper Panel */}
                <section className="scraper-panel">
                    <h2>Ejecutar Scraping</h2>
                    <p className="panel-description">
                        Inicia una nueva tarea de scraping en el sitio del Poder Judicial de Chile.
                    </p>

                    {error && <div className="panel-error">{error}</div>}

                    <button
                        onClick={handleRunScraper}
                        disabled={isRunning}
                        className="run-button"
                    >
                        {isRunning ? '🔄 Ejecutando...' : '▶️ Iniciar Scraping Civil'}
                    </button>
                </section>

                {/* Task History */}
                <section className="task-history">
                    <h2>Historial de Tareas</h2>

                    {tasks.length === 0 ? (
                        <p className="no-tasks">No hay tareas aún. ¡Inicia tu primer scraping!</p>
                    ) : (
                        <div className="task-list">
                            {tasks.map(task => (
                                <div key={task.id} className={`task-card task-${task.status}`}>
                                    <div className="task-header">
                                        <span className="task-type">{task.task_type.toUpperCase()}</span>
                                        <span className={`task-status status-${task.status}`}>
                                            {getStatusBadge(task.status)}
                                        </span>
                                    </div>
                                    <div className="task-body">
                                        <p className="task-date">
                                            Creado: {formatDate(task.created_at)}
                                        </p>
                                        {task.completed_at && (
                                            <p className="task-date">
                                                Completado: {formatDate(task.completed_at)}
                                            </p>
                                        )}
                                        {task.error && (
                                            <p className="task-error">{task.error}</p>
                                        )}
                                        {task.result && (
                                            <details className="task-result">
                                                <summary>Ver resultado</summary>
                                                <pre>{JSON.stringify(task.result, null, 2)}</pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
