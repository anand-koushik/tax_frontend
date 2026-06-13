import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function ExpenseTracker({ getAuthHeaders, showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [taxCategory, setTaxCategory] = useState('none');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTax, setFilterTax] = useState('all');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/expenses`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      } else {
        showToast('Failed to load expenses', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount) {
      showToast('Please enter description and amount', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          description,
          amount: Number(amount),
          category,
          taxCategory,
          date: new Date(date).toISOString()
        })
      });

      if (res.ok) {
        showToast('Expense added successfully!');
        // Reset form
        setDescription('');
        setAmount('');
        setCategory('Food');
        setTaxCategory('none');
        setDate(new Date().toISOString().split('T')[0]);
        // Refresh list
        fetchExpenses();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add expense', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        showToast('Expense deleted');
        fetchExpenses();
      } else {
        showToast('Failed to delete expense', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    }
  };

  // Filtered list and totals calculations
  const filteredExpenses = expenses.filter(exp => {
    const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
    const matchTax = filterTax === 'all' || exp.taxCategory === filterTax;
    return matchCategory && matchTax;
  });

  const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categories = [
    'Food', 'Rent / Housing', 'Utilities', 'Travel / Commute', 
    'Entertainment', 'Tax Investment', 'Medical', 'Other'
  ];

  const taxCategories = [
    { value: 'none', label: 'None (Regular Expense)' },
    { value: '80C', label: 'Section 80C (PPF, ELSS, School Fees)' },
    { value: '80D', label: 'Section 80D (Health Insurance)' },
    { value: '80CCD', label: 'Section 80CCD (Voluntary NPS)' },
    { value: 'section24', label: 'Section 24(b) (Home Loan Interest)' },
    { value: 'hra', label: 'HRA Rent Paid (House Rent)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>🧾 Expense Tracker & Analyzer</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Log your expenses and tag tax-saving investments to sync them dynamically with your Tax Calculator.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Left: Input Form */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem', color: '#fff' }}>
            Add New Transaction
          </h3>

          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. HDFC Health Premium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Transaction Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Expense Category</label>
              <select 
                className="form-select" 
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  // Auto-suggest tax categories based on typical categories
                  if (e.target.value === 'Medical') setTaxCategory('80D');
                  else if (e.target.value === 'Rent / Housing') setTaxCategory('hra');
                  else if (e.target.value === 'Tax Investment') setTaxCategory('80C');
                  else setTaxCategory('none');
                }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tax Deduction Category Tag</label>
              <select 
                className="form-select" 
                value={taxCategory}
                onChange={(e) => setTaxCategory(e.target.value)}
              >
                {taxCategories.map(tc => <option key={tc.value} value={tc.value}>{tc.label}</option>)}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Tagging links this expense to the calculator to deduct from taxable income in the Old Regime.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              ➕ Log Transaction
            </button>
          </form>
        </div>

        {/* Right: History List & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Filters Panel */}
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Filter Category</span>
                <select 
                  className="form-select" 
                  style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.8125rem' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Filter Tax Tag</span>
                <select 
                  className="form-select" 
                  style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.8125rem' }}
                  value={filterTax}
                  onChange={(e) => setFilterTax(e.target.value)}
                >
                  <option value="all">All Tax Tags</option>
                  <option value="none">Regular Expenses Only</option>
                  <option value="80C">Section 80C</option>
                  <option value="80D">Section 80D</option>
                  <option value="80CCD">Section 80CCD</option>
                  <option value="section24">Section 24(b)</option>
                  <option value="hra">HRA Rent Paid</option>
                </select>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>SUM TOTAL</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                ₹{totalFilteredAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* History List */}
          <div className="glass-panel" style={{ padding: '2rem', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Transaction Log
            </h3>

            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: 'auto' }}>Loading transactions...</p>
            ) : filteredExpenses.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: 'auto', fontSize: '0.875rem' }}>
                No matching transactions found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {filteredExpenses.map(exp => (
                  <div 
                    key={exp._id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9375rem' }}>{exp.description}</span>
                        <span style={{
                          fontSize: '0.6875rem',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--color-text-secondary)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>{exp.category}</span>
                        {exp.taxCategory !== 'none' && (
                          <span style={{
                            fontSize: '0.6875rem',
                            background: 'var(--color-success-glow)',
                            color: 'var(--color-success)',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>🛡️ {exp.taxCategory}</span>
                        )}
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <span style={{ fontWeight: '800', color: '#fff' }}>
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                      <button 
                        onClick={() => handleDeleteExpense(exp._id)}
                        style={{
                          background: 'transparent',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontSize: '1.125rem',
                          lineHeight: 1,
                          padding: '0.25rem',
                          transition: 'color 0.15s ease'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'var(--color-danger)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--color-text-muted)'}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default ExpenseTracker;
