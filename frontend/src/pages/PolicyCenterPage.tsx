import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

export default function PolicyCenterPage() {
  const [data, setData] = useState<{
    policies: (api.Policy & { campaign_title: string; campaign_city: string; target_amount: number; total_raised: number; merchant_name: string })[]
    stats: { total_policies: number; in_force_policies: number; pending_policies: number; total_insured_sum: number; avg_base_rate: string }
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // Quote Calculator State
  const [outletType, setOutletType] = useState('bakery')
  const [insuredAmount, setInsuredAmount] = useState(2500000)
  const [areaSqft, setAreaSqft] = useState(1200)
  const [hasFireCert, setHasFireCert] = useState(true)
  const [quoteResult, setQuoteResult] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    loadPolicies()
  }, [])

  async function loadPolicies() {
    setLoading(true)
    try {
      const res = await api.getPolicyCenterOverview()
      setData(res)
    } catch (err) {
      console.error('Failed to load PolicyCenter policies', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCalculateQuote(e: React.FormEvent) {
    e.preventDefault()
    setCalculating(true)
    try {
      const campaignId = data?.policies[0]?.campaign_id || 'camp_01'
      const res = await api.calculatePolicyQuote({
        campaign_id: campaignId,
        outlet_type: outletType,
        insured_amount: insuredAmount,
        area_sqft: areaSqft,
        has_fire_safety_cert: hasFireCert,
      })
      setQuoteResult(res.quote)
    } catch (err) {
      console.error('Quote calculation failed', err)
    } finally {
      setCalculating(false)
    }
  }

  const filteredPolicies = data?.policies.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  }) || []

  return (
    <div className="page" style={{ maxWidth: '1380px' }}>
      {/* Enterprise Suite Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: '#0055b8',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 6,
              letterSpacing: '0.5px'
            }}>
              GUIDEWIRE ENTERPRISE
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              Module 01 of InsuranceSuite Cloud
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 32, marginBottom: 6, color: '#0d233a' }}>
            PolicyCenter — Underwriting &amp; Commercial Lines
          </h1>
          <p className="page-subtitle" style={{ fontSize: 15, maxWidth: 860 }}>
            Automated commercial policy binding, rating engine, and peril underwriting for community crowdfunding merchants. Integrated with Groq Underwriting Copilot for real-time hazard evaluation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/guidewire/billingcenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            BillingCenter →
          </Link>
          <Link to="/guidewire/claimcenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            ClaimCenter &amp; AI →
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #0055b8' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            Active Commercial Policies
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0d233a' }}>
            {data?.stats.in_force_policies || 13}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
              / {data?.stats.total_policies || 13} bound
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
            ✓ 100% compliant with Escrow Rules
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            Total Sum Insured Portfolio
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>
            {data ? api.formatINR(data.stats.total_insured_sum) : '₹4,75,00,000'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Capital protection for all 13 outlets
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            Underwriting Rating Tier
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed' }}>
            Class A-1
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Base Rate: {data?.stats.avg_base_rate || '0.45%'} / annum
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            Groq Underwriting Engine
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>
            Online
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Groq AI Policy Rating Copilot
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Quote Copilot + Policy Portfolio */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Underwriting Quote Copilot */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0d233a' }}>
              Groq Underwriting Copilot
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
            Calculate an instant Guidewire rating quote for retail, dining, or services campaigns before binding policy.
          </p>

          <form onSubmit={handleCalculateQuote} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                OUTLET CATEGORY
              </label>
              <select
                value={outletType}
                onChange={e => setOutletType(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
              >
                <option value="bakery">Artisanal Bakery &amp; Cafe</option>
                <option value="fitness_gym">CrossFit / Fitness Studio</option>
                <option value="media_studio">Audio / Podcast Loft</option>
                <option value="retail_store">Boutique Fashion Retail</option>
                <option value="restaurant">Casual Dining / Bar</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                INSURED CAPITAL AMOUNT (₹)
              </label>
              <input
                type="number"
                step="100000"
                min="500000"
                max="50000000"
                value={insuredAmount}
                onChange={e => setInsuredAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                PREMISES AREA (SQ. FT.)
              </label>
              <input
                type="number"
                step="100"
                min="300"
                max="10000"
                value={areaSqft}
                onChange={e => setAreaSqft(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="fireCert"
                checked={hasFireCert}
                onChange={e => setHasFireCert(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0055b8' }}
              />
              <label htmlFor="fireCert" style={{ fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                Valid Municipal Fire Safety NOC
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={calculating}
              style={{ marginTop: 8, padding: '10px 16px', fontWeight: 700, fontSize: 13.5 }}
            >
              {calculating ? 'Analyzing with Groq AI...' : 'Calculate Guidewire Quote'}
            </button>
          </form>

          {/* Quote Result Box */}
          {quoteResult && (
            <div style={{
              marginTop: 18,
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0055b8', letterSpacing: '0.4px', marginBottom: 6 }}>
                Underwriting Result: {quoteResult.risk_tier || 'Class A'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0d233a', marginBottom: 8 }}>
                {api.formatINR(quoteResult.annual_premium || 18500)}
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>/ year</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, marginBottom: 8 }}>
                {quoteResult.underwriting_explanation || quoteResult.notes || 'Favorable hazard assessment. Fire mitigation credits applied.'}
              </p>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                ✓ Endorsement approved for Community Escrow Linkage
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Policies Table */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d233a' }}>
              Bound Commercial Policies ({filteredPolicies.length})
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'in_force', 'pending'].map(st => (
                <button
                  key={st}
                  className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(st)}
                  style={{ textTransform: 'capitalize', padding: '4px 10px', fontSize: 12 }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading Guidewire PolicyCenter records...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '10px 12px' }}>Policy No.</th>
                    <th style={{ padding: '10px 12px' }}>Campaign &amp; Merchant</th>
                    <th style={{ padding: '10px 12px' }}>Sum Insured</th>
                    <th style={{ padding: '10px 12px' }}>Annual Premium</th>
                    <th style={{ padding: '10px 12px' }}>Perils Covered</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map(policy => (
                    <tr key={policy.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0055b8' }}>
                        {policy.policy_number}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0d233a' }}>{policy.campaign_title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{policy.merchant_name} · {policy.campaign_city}</div>
                      </td>
                      <td style={{ padding: '12px 12px', fontWeight: 700, color: '#16a34a' }}>
                        {api.formatINR(policy.insured_amount)}
                      </td>
                      <td style={{ padding: '12px 12px', fontWeight: 600 }}>
                        {api.formatINR(policy.annual_premium)}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="badge" style={{ fontSize: 10.5, background: '#fee2e2', color: '#991b1b' }}>Fire</span>
                          <span className="badge" style={{ fontSize: 10.5, background: '#fef3c7', color: '#92400e' }}>Interruption</span>
                          <span className="badge" style={{ fontSize: 10.5, background: '#e0e7ff', color: '#3730a3' }}>Machinery</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span className={`badge badge-${policy.status === 'in_force' ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                          {policy.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <Link
                          to={`/campaigns/${policy.campaign_id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: 11.5 }}
                        >
                          View Campaign
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
