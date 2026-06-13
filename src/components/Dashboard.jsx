import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function Dashboard({ getAuthHeaders, showToast, setActiveTab }) {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, expRes] = await Promise.all([
        fetch(`${API_URL}/api/tax/calculate`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/expenses`, { headers: getAuthHeaders() })
      ]);

      if (taxRes.ok && expRes.ok) {
        const taxData = await taxRes.json();
        const expData = await expRes.json();
        setData(taxData);
        setExpenses(expData);
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Gathering financial data...</p>
      </div>
    );
  }

  // Fallbacks if no data exists
  const oldRegimeTax = data?.oldRegime?.finalTax || 0;
  const newRegimeTax = data?.newRegime?.finalTax || 0;
  const grossSalary = data?.profile?.grossSalary || 0;
  const otherIncome = data?.profile?.otherIncome || 0;
  const totalIncome = grossSalary + otherIncome;
  const activeRegime = data?.recommendation?.regime || 'new';
  const taxLiability = activeRegime === 'old' ? oldRegimeTax : newRegimeTax;
  
  // Aggregate expenses
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group expenses by category
  const categoriesMap = {};
  expenses.forEach(exp => {
    categoriesMap[exp.category] = (categoriesMap[exp.category] || 0) + exp.amount;
  });
  const categoriesList = Object.entries(categoriesMap).map(([name, amount]) => ({ name, amount }));

  // Color assignments for expense categories
  const categoryColors = {
    'Food': '#6366f1',
    'Rent / Housing': '#10b981',
    'Utilities': '#f59e0b',
    'Travel / Commute': '#06b6d4',
    'Entertainment': '#ec4899',
    'Tax Investment': '#10b981',
    'Medical': '#ef4444',
    'Other': '#8b5cf6'
  };

  // Render SVG Donut Chart for expenses
  const renderDonutChart = () => {
    if (expenses.length === 0) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem'
        }}>
          No expenses recorded. Go to Expenses to add some!
        </div>
      );
    }

    let cumulativePercentage = 0;
    const slices = categoriesList.map((cat, idx) => {
      const percentage = (cat.amount / totalExpenses) * 100;
      const startPercentage = cumulativePercentage;
      cumulativePercentage += percentage;
      return {
        ...cat,
        startPercentage,
        percentage,
        color: categoryColors[cat.name] || '#64748b'
      };
    });

    // Drawing donut segments via SVG stroke-dasharray
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <svg width="180" height="180" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="18" />
          {slices.map((slice, idx) => {
            const strokeLength = (slice.percentage / 100) * circumference;
            const strokeOffset = circumference - ((slice.startPercentage / 100) * circumference);
            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="18"
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'all 0.5s ease' }}
              />
            );
          })}
          {/* Inside donut cutout displaying totals */}
          <circle cx="70" cy="70" r="38" fill="var(--bg-secondary)" />
          <text x="70" y="66" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8" fontWeight="600">TOTAL EXPENSES</text>
          <text x="70" y="82" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">₹{Math.round(totalExpenses).toLocaleString('en-IN')}</text>
        </svg>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{slice.name}</span>
              </div>
              <div style={{ fontWeight: '600' }}>
                ₹{slice.amount.toLocaleString('en-IN')} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({Math.round(slice.percentage)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render SVG Bar Chart comparing Regimes
  const renderTaxBarChart = () => {
    const maxVal = Math.max(oldRegimeTax, newRegimeTax, 10000); // Guard against zero divisions
    const oldBarHeight = (oldRegimeTax / maxVal) * 120;
    const newBarHeight = (newRegimeTax / maxVal) * 120;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          width: '100%',
          maxWidth: '300px',
          height: '140px',
          borderBottom: '2px solid rgba(255,255,255,0.08)',
          paddingBottom: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          {/* Old Regime Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', color: activeRegime === 'old' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              ₹{Math.round(oldRegimeTax).toLocaleString('en-IN')}
            </span>
            <div style={{
              width: '44px',
              height: `${oldBarHeight}px`,
              background: activeRegime === 'old' ? 'var(--gradient-success)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '6px 6px 0 0',
              boxShadow: activeRegime === 'old' ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          {/* New Regime Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', color: activeRegime === 'new' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              ₹{Math.round(newRegimeTax).toLocaleString('en-IN')}
            </span>
            <div style={{
              width: '44px',
              height: `${newBarHeight}px`,
              background: activeRegime === 'new' ? 'var(--gradient-success)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '6px 6px 0 0',
              boxShadow: activeRegime === 'new' ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '300px',
          fontSize: '0.8125rem',
          fontWeight: '600',
          color: 'var(--color-text-secondary)'
        }}>
          <span style={{ color: activeRegime === 'old' ? '#fff' : 'inherit' }}>Old Regime</span>
          <span style={{ color: activeRegime === 'new' ? '#fff' : 'inherit' }}>New Regime</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Cards (Gross Income, Total Expenses, Estimated Tax) */}
      <section className="grid-cols-3">
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '2.5rem', background: 'rgba(99,102,241,0.1)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>💸</div>
          <div>
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Income</h4>
            <p style={{ fontSize: '1.625rem', fontWeight: '800', marginTop: '0.25rem' }}>₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '2.5rem', background: 'rgba(239,68,68,0.1)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>🧾</div>
          <div>
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenses</h4>
            <p style={{ fontSize: '1.625rem', fontWeight: '800', marginTop: '0.25rem' }}>₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: '2.5rem', background: 'rgba(16,185,129,0.1)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>🛡️</div>
          <div>
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Tax</h4>
            <p style={{ fontSize: '1.625rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--color-success)' }}>₹{Math.round(taxLiability).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </section>

      {/* Regimes Recommendation Banner */}
      <section className="glass-panel" style={{
        padding: '1.5rem 2rem',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>💡</div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-success)' }}>Regime Recommendation</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>{data?.recommendation?.text}</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('tax-planner')}
          className="btn btn-primary"
          style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
        >
          Customize Calculator
        </button>
      </section>

      {/* Visual Analytics Row */}
      <section className="grid-cols-2">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            Expense Allocation
          </h3>
          {renderDonutChart()}
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            Regime Comparison (FY {data?.profile?.financialYear || '2025-26'})
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderTaxBarChart()}
          </div>
        </div>
      </section>

      {/* Tax Saving Tips / Recommendations */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
          ⚡ Tax-Saving Recommendations (Old Regime)
        </h3>
        
        {data?.suggestions && data.suggestions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {data.suggestions.map((sug, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-glow)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>{sug.section}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Tip #{idx + 1}</span>
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#fff' }}>{sug.title}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{sug.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Awesome! You have maximized all standard tax-saving categories (80C, 80D, 80CCD, Section 24).
          </p>
        )}
      </section>

    </div>
  );
}

export default Dashboard;
