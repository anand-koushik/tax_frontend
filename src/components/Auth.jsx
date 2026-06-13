import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function Auth({ setToken, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        showToast(isLogin ? `Welcome back, ${data.user.name}!` : 'Account created successfully!');
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    // Attempt registration first in case demo account doesn't exist, then login
    const demoPayload = {
      name: 'Demo User',
      email: 'demo@indian-tax-planner.in',
      password: 'demouser123'
    };

    try {
      // 1. Try to register (will fail if exists, which is fine)
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPayload)
      });

      // 2. Log in
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoPayload.email, password: demoPayload.password })
      });
      const loginData = await loginRes.json();

      if (loginRes.ok) {
        setToken(loginData.token);
        showToast('Logged in with Demo Account!');
      } else {
        showToast(loginData.error || 'Demo login failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Demo login failed to connect', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '1.5rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '3rem',
            lineHeight: 1,
            marginBottom: '0.5rem'
          }}>🇮🇳</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem'
          }}>TaxExpense</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {isLogin ? 'Sign in to review and plan taxes' : 'Create an account to start planning'}
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: isLogin ? 'var(--color-primary)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: !isLogin ? 'var(--color-primary)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <input 
                type="text" 
                placeholder="Enter name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. name@domain.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          margin: '1.5rem 0'
        }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
          <span style={{ padding: '0 10px' }}>OR TEST DIRECTLY</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
        </div>

        {/* Demo Button */}
        <button 
          onClick={handleDemoLogin}
          className="btn btn-secondary"
          style={{
            width: '100%',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            color: 'var(--color-primary)',
            height: '46px'
          }}
          disabled={loading}
        >
          ⚡ Quick Demo Login
        </button>
      </div>
    </div>
  );
}

export default Auth;
