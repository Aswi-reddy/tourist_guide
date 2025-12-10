import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard-new';
import './App.css';
import './pages/Dashboard-new.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear localStorage on app start to force fresh login
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentPage('login');
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  return (
    <div className="app">
      {isLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px'
        }}>
          Loading...
        </div>
      ) : !isAuthenticated ? (
        <>
          {currentPage === 'login' ? (
            <Login onLoginSuccess={handleLoginSuccess} onRegisterClick={() => setCurrentPage('register')} />
          ) : (
            <Register onRegisterSuccess={handleRegisterSuccess} onLoginClick={() => setCurrentPage('login')} />
          )}
        </>
      ) : (
        <Dashboard onLogout={() => {
          localStorage.clear();
          setIsAuthenticated(false);
          setCurrentPage('login');
        }} />
      )}
    </div>
  );
}

export default App;
