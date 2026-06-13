import React, { useState, useEffect } from 'react';
import Auth from './components/Auth.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import TaxCalculator from './components/TaxCalculator.jsx';
import ExpenseTracker from './components/ExpenseTracker.jsx';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // Set up API Authorization Header
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Display status notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Validate session on load/token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Session expired or token invalid
        setToken('');
      }
    } catch (err) {
      console.error('Error checking user profile:', err);
      setToken('');
    }
  };

  const handleLogout = () => {
    setToken('');
    showToast('Logged out successfully');
  };

  // If loading user data and token exists, show loading indicator
  if (token && !user) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(99,102,241,0.1)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading secure session...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {token && user ? (
        <>
          <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
          <main className="container animate-fade-in" style={{ flex: 1 }}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                getAuthHeaders={getAuthHeaders} 
                showToast={showToast} 
                setActiveTab={setActiveTab} 
              />
            )}
            {activeTab === 'tax-planner' && (
              <TaxCalculator 
                getAuthHeaders={getAuthHeaders} 
                showToast={showToast} 
              />
            )}
            {activeTab === 'expense-tracker' && (
              <ExpenseTracker 
                getAuthHeaders={getAuthHeaders} 
                showToast={showToast} 
              />
            )}
          </main>
        </>
      ) : (
        <Auth setToken={setToken} showToast={showToast} />
      )}

      {/* Toast Alert Notice */}
      {toast && (
        <div className={`toast-notice toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem',
        borderTop: '1px solid var(--border-glass)',
        marginTop: 'auto'
      }}>
        Indian Tax Expense Planner v2 &copy; {new Date().getFullYear()} - Professional MERN Application
      </footer>
    </div>
  );
}

export default App;
