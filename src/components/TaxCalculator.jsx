import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function TaxCalculator({ getAuthHeaders, showToast }) {
  const [profile, setProfile] = useState({
    financialYear: '2025-26',
    grossSalary: 0,
    otherIncome: 0,
    deduction80C: 0,
    deduction80D: 0,
    deduction80CCD: 0,
    section24: 0,
    hraRentPaid: 0,
    hraBasicSalary: 0,
    hraCityType: 'metro',
    hraReceived: 0
  });

  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('income'); // 'income', 'deductions', 'hra'

  const fetchProfileAndCalculate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tax/profile`, { headers: getAuthHeaders() });
      if (res.ok) {
        const profileData = await res.json();
        setProfile({
          financialYear: profileData.financialYear || '2025-26',
          grossSalary: profileData.grossSalary || 0,
          otherIncome: profileData.otherIncome || 0,
          deduction80C: profileData.deduction80C || 0,
          deduction80D: profileData.deduction80D || 0,
          deduction80CCD: profileData.deduction80CCD || 0,
          section24: profileData.section24 || 0,
          hraRentPaid: profileData.hraRentPaid || 0,
          hraBasicSalary: profileData.hraBasicSalary || 0,
          hraCityType: profileData.hraCityType || 'metro',
          hraReceived: profileData.hraReceived || 0,
          auto80C: profileData.auto80C || 0,
          auto80D: profileData.auto80D || 0,
          auto80CCD: profileData.auto80CCD || 0,
          autoSec24: profileData.autoSec24 || 0,
          autoHraRent: profileData.autoHraRent || 0
        });

        // Trigger calculation
        const calcRes = await fetch(`${API_URL}/api/tax/calculate`, { headers: getAuthHeaders() });
        if (calcRes.ok) {
          const calcData = await calcRes.json();
          setCalculation(calcData);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading calculator data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCalculate();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'financialYear' || name === 'hraCityType' ? value : Number(value)
    }));
  };

  const handleSaveAndCalculate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/tax/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        showToast('Tax profile updated successfully!');
        // Recalculate
        const calcRes = await fetch(`${API_URL}/api/tax/calculate`, { headers: getAuthHeaders() });
        if (calcRes.ok) {
          const calcData = await calcRes.json();
          setCalculation(calcData);
        }
      } else {
        showToast('Failed to save tax profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    }
  };

  if (loading && !calculation) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading tax engine...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Financial Year selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>💸 Tax Planner & Calculator</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Compare Old vs New Regimes and identify opportunities to save.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ margin: 0 }}>Financial Year:</label>
          <select 
            name="financialYear" 
            className="form-select" 
            style={{ padding: '0.5rem 2rem 0.5rem 1rem', fontSize: '0.875rem' }}
            value={profile.financialYear}
            onChange={(e) => {
              handleInputChange(e);
              // Trigger auto-save to immediately update FY calculations
              setTimeout(() => {
                document.getElementById('tax-form-btn')?.click();
              }, 100);
            }}
          >
            <option value="2025-26">FY 2025-26 (Budget 2025)</option>
            <option value="2024-25">FY 2024-25 (Budget 2024)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '2rem' }}>
        
        {/* Left Side: Interactive Input Form */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '1.5rem',
            paddingBottom: '0.25rem'
          }}>
            {[
              { id: 'income', label: '💼 Income' },
              { id: 'hra', label: '🏠 HRA Claim' },
              { id: 'deductions', label: '🛡️ Deductions' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: activeSubTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottom: activeSubTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveAndCalculate}>
            
            {activeSubTab === 'income' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Gross Salary (Annual)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>₹{profile.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="number" 
                    name="grossSalary" 
                    className="form-input" 
                    value={profile.grossSalary || ''} 
                    onChange={handleInputChange} 
                    placeholder="Enter annual base + allowances"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Other Income / Capital Gains</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>₹{profile.otherIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="number" 
                    name="otherIncome" 
                    className="form-input" 
                    value={profile.otherIncome || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g. savings interest, rental income"
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'hra' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-primary-glow)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.4'
                }}>
                  ℹ️ HRA claims apply only to the <strong>Old Regime</strong>. Tagging expense transactions as 'hra' automatically contributes to the Rent Paid amount.
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Annual Rent Paid</label>
                  <input 
                    type="number" 
                    name="hraRentPaid" 
                    className="form-input" 
                    value={profile.hraRentPaid || ''} 
                    onChange={handleInputChange} 
                    placeholder="Annual rent amount"
                  />
                  {profile.autoHraRent > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      ✓ Auto-detected from expenses: ₹{profile.autoHraRent.toLocaleString('en-IN')} (added to calculation)
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Annual HRA Allowance Received</label>
                  <input 
                    type="number" 
                    name="hraReceived" 
                    className="form-input" 
                    value={profile.hraReceived || ''} 
                    onChange={handleInputChange} 
                    placeholder="From salary structure details"
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Annual Basic Salary</label>
                    <input 
                      type="number" 
                      name="hraBasicSalary" 
                      className="form-input" 
                      value={profile.hraBasicSalary || ''} 
                      onChange={handleInputChange} 
                      placeholder="Basic Salary"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">City Type</label>
                    <select 
                      name="hraCityType" 
                      className="form-select" 
                      value={profile.hraCityType}
                      onChange={handleInputChange}
                    >
                      <option value="metro">Metro (50% Basic)</option>
                      <option value="non-metro">Non-Metro (40% Basic)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'deductions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-primary-glow)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.4'
                }}>
                  ℹ️ Standard deductions do not apply under the New Regime. Tagged expenses are automatically merged here.
                </div>

                {/* 80C */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Section 80C (Max 1.5L)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PPF, ELSS, Insurance, School fees</span>
                  </div>
                  <input 
                    type="number" 
                    name="deduction80C" 
                    className="form-input" 
                    value={profile.deduction80C || ''} 
                    onChange={handleInputChange} 
                    placeholder="Self-invested amount"
                  />
                  {profile.auto80C > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      ✓ Auto-detected from expenses: ₹{profile.auto80C.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* 80D */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Section 80D (Max 25k/50k)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Health Insurance premium</span>
                  </div>
                  <input 
                    type="number" 
                    name="deduction80D" 
                    className="form-input" 
                    value={profile.deduction80D || ''} 
                    onChange={handleInputChange} 
                    placeholder="Self-invested amount"
                  />
                  {profile.auto80D > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      ✓ Auto-detected from expenses: ₹{profile.auto80D.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* 80CCD */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Section 80CCD(1B) NPS (Max 50k)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>National Pension System</span>
                  </div>
                  <input 
                    type="number" 
                    name="deduction80CCD" 
                    className="form-input" 
                    value={profile.deduction80CCD || ''} 
                    onChange={handleInputChange} 
                  />
                  {profile.auto80CCD > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      ✓ Auto-detected from expenses: ₹{profile.auto80CCD.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Section 24 */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Section 24(b) Home Loan (Max 2L)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Home loan interest paid</span>
                  </div>
                  <input 
                    type="number" 
                    name="section24" 
                    className="form-input" 
                    value={profile.section24 || ''} 
                    onChange={handleInputChange} 
                  />
                  {profile.autoSec24 > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      ✓ Auto-detected from expenses: ₹{profile.autoSec24.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button 
              id="tax-form-btn"
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              💾 Save & Calculate Tax
            </button>
          </form>
        </div>

        {/* Right Side: Detailed Comparison Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Recommendation Banner */}
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem',
            borderLeft: '4px solid var(--color-success)',
            background: 'rgba(16, 185, 129, 0.04)'
          }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-success)' }}>
              🎯 Recommended Action
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
              {calculation?.recommendation?.text}
            </p>
          </div>

          {/* Slabs breakdown details */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Tax Breakdown Comparison
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Calculation Item</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Old Regime</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>New Regime</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Gross Income</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{calculation?.oldRegime?.grossIncome.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{calculation?.newRegime?.grossIncome.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Standard Deduction</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>- ₹{calculation?.oldRegime?.standardDeduction.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>- ₹{calculation?.newRegime?.standardDeduction.toLocaleString('en-IN')}</td>
                </tr>
                {calculation?.oldRegime?.hraExemption > 0 && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>HRA Exemption</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>- ₹{calculation?.oldRegime?.hraExemption.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>Not Allowed</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Investments (80C, 80D, NPS)</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    - ₹{(
                      (calculation?.oldRegime?.capped80C || 0) + 
                      (calculation?.oldRegime?.capped80D || 0) + 
                      (calculation?.oldRegime?.capped80CCD || 0)
                    ).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>Not Allowed</td>
                </tr>
                {calculation?.oldRegime?.cappedSection24 > 0 && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Home Loan Interest (Sec 24)</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>- ₹{calculation?.oldRegime?.cappedSection24.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>Not Allowed</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: '600' }}>
                  <td style={{ padding: '0.75rem 0' }}>Taxable Net Income</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.oldRegime?.taxableIncome).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.newRegime?.taxableIncome).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Base Slab Tax</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.oldRegime?.baseTax).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.newRegime?.baseTax).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--color-success)' }}>
                  <td style={{ padding: '0.75rem 0' }}>87A Rebate / Relief</td>
                  <td style={{ textAlign: 'right' }}>- ₹{Math.round(calculation?.oldRegime?.rebate || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    - ₹{Math.round((calculation?.newRegime?.rebate || 0) + (calculation?.newRegime?.marginalRelief || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>Health & Education Cess (4%)</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.oldRegime?.cess).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>₹{Math.round(calculation?.newRegime?.cess).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: 'none', fontSize: '1.0625rem', fontWeight: '800' }}>
                  <td style={{ padding: '1rem 0' }}>Final Tax Payable</td>
                  <td style={{ textAlign: 'right', color: calculation?.recommendation?.regime === 'old' ? 'var(--color-success)' : 'inherit', padding: '1rem 0' }}>
                    ₹{Math.round(calculation?.oldRegime?.finalTax).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', color: calculation?.recommendation?.regime === 'new' ? 'var(--color-success)' : 'inherit', padding: '1rem 0' }}>
                    ₹{Math.round(calculation?.newRegime?.finalTax).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Slabs detail breakdown drawer */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              ℹ️ FY {profile.financialYear} Slab Configurations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <p>
                <strong>New Regime (Default):</strong> Slabs feature 0% up to {profile.financialYear === '2025-26' ? '4 Lakhs' : '3 Lakhs'}, and rebates protect incomes up to {profile.financialYear === '2025-26' ? '12 Lakhs' : '7 Lakhs'} from net tax liabilities.
              </p>
              <p>
                <strong>Old Regime:</strong> Exemption limit is 2.5 Lakhs. Rebate protects taxable income up to 5 Lakhs (giving ₹12,500 rebate).
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default TaxCalculator;
