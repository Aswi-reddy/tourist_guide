import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Auth.css';

function Login({ onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🔐 Welcome Back</h2>
        {error && <p className="error">⚠️ {error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="📧 Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="🔒 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>
        <p>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
