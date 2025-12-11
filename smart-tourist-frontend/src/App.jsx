import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard-new';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentPage('login');
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
      {!isAuthenticated ? (
        currentPage === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} onRegisterClick={() => setCurrentPage('register')} />
        ) : (
          <Register onRegisterSuccess={handleRegisterSuccess} onLoginClick={() => setCurrentPage('login')} />
        )
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
