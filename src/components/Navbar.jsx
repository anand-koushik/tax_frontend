import React from 'react';

function Navbar({ user, activeTab, setActiveTab, handleLogout }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(11, 15, 25, 0.75)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-glass)'
    }}>
      <div className="container" style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer' 
          }}
        >
          <span style={{ fontSize: '1.75rem' }}>🇮🇳</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            TaxExpense
          </span>
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--color-primary)',
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>v2</span>
        </div>

        {/* Tab Navigation Links */}
        <nav style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.02)'
        }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'tax-planner', label: '💸 Tax Planner' },
            { id: 'expense-tracker', label: '🧾 Expenses' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Session Profile & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontSize: '0.8125rem'
          }}>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>
              {user ? user.name : 'User'}
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              {user ? user.email : ''}
            </span>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{
              padding: '0.5rem 0.875rem',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              color: 'var(--color-danger)',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
