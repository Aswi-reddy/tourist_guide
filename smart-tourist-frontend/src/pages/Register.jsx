import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Auth.css';

function Register({ onRegisterSuccess, onLoginClick }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register(form.name, form.email, form.password, form.phone);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onRegisterSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🎉 Create Account</h2>
        {error && <p className="error">⚠️ {error}</p>}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="name"
            placeholder="👤 Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="📧 Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="🔒 Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
            minLength="6"
          />
          <input
            type="tel"
            name="phone"
            placeholder="📱 Phone Number (optional)"
            value={form.phone}
            onChange={handleChange}
          />
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🚀 Register'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onLoginClick}
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
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
