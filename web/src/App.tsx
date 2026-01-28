/**
 * Sencker App
 * Main application with sidebar navigation
 */

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Layout } from './components/Layout';
import type { PageType } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { SentenciasPage } from './pages/SentenciasPage';
import { PlazosPage } from './pages/PlazosPage';
import './App.css';

type AuthView = 'login' | 'register';

function App() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError
  } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Show main app if authenticated
  if (isAuthenticated && user) {
    return (
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userEmail={user.email || ''}
        onLogout={logout}
      >
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'sentencias' && <SentenciasPage />}
        {currentPage === 'plazos' && <PlazosPage />}
      </Layout>
    );
  }

  // Show auth forms
  const handleSwitchView = (view: AuthView) => {
    clearError();
    setAuthView(view);
  };

  if (authView === 'register') {
    return (
      <RegisterForm
        onRegister={register}
        onLoginWithGoogle={loginWithGoogle}
        onSwitchToLogin={() => handleSwitchView('login')}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  return (
    <LoginForm
      onLogin={login}
      onLoginWithGoogle={loginWithGoogle}
      onSwitchToRegister={() => handleSwitchView('register')}
      error={error}
      isLoading={isLoading}
    />
  );
}

export default App;
