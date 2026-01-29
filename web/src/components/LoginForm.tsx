/**
 * Login Form Component with Firebase
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import './AuthForms.css';

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onLoginWithGoogle: () => Promise<void>;
    onSwitchToRegister: () => void;
    error: string | null;
    isLoading: boolean;
}

export function LoginForm({ onLogin, onLoginWithGoogle, onSwitchToRegister, error, isLoading }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await onLogin(email, password);
    };

    const handleGoogleLogin = async () => {
        await onLoginWithGoogle();
    };

    return (
        <div className="auth-form-container">
            <div className="auth-form-card">
                <div className="auth-form-header">
                    <h1 className="auth-form-title">🔍 Sencker</h1>
                    <p className="auth-form-subtitle">Accede a tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>o</span>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="google-button"
                    disabled={isLoading}
                    type="button"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                </button>

                <div className="auth-form-footer">
                    <p>
                        ¿No tienes cuenta?{' '}
                        <button type="button" onClick={onSwitchToRegister} className="auth-link">
                            Regístrate
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
