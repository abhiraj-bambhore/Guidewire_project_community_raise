import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { formatINR, outletIcon, stateBadgeClass, formatDate } from '../utils'

export default function MyInvestments() {
  const [investors, setInvestors] = useState<api.Investor[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [investments, setInvestments] = useState<api.Investment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.listInvestors().then(d => {
      setInvestors(d.investors)
      if (d.investors.length > 0) setSelectedId(d.investors[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError('')
    api.getInvestorInvestments(selectedId)
      .then(d => setInvestments(d.investments))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0)
  const active = investments.filter(i => i.status === 'confirmed').length
  const refunded = investments.filter(i => i.status === 'refunded').length

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Investments</h1>
        <p className="page-subtitle">Track your community investment portfolio.</p>
      </div>

      {/* Investor selector */}
      <div className="card card-body" style={{ maxWidth: 400, marginBottom: 28 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">View investments for</label>
          <select className="form-control" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {investors.map(i => (
              <option key={i.id} value={i.id}>{i.name} — {i.city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      {investments.length > 0 && (
        <div className="stats-row" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-label">Total Invested</div>
            <div className="stat-value brand">{formatINR(totalInvested)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value success">{active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Refunded</div>
            <div className="stat-value">{refunded}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Campaigns</div>
            <div className="stat-value">{investments.length}</div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : investments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>No investments yet</h3>
          <p>Browse campaigns and invest in a local business you believe in.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            Browse Campaigns
          </button>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Campaign State</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => (
                <tr
                  key={inv.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/campaigns/${inv.campaign_id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{inv.campaign_title ?? 'Campaign'}</div>
                  </td>
                  <td>
                    <span style={{ marginRight: 4 }}>{outletIcon(inv.outlet_type ?? '')}</span>
                    {inv.outlet_type}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatINR(inv.amount)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'confirmed' ? 'badge-success' : 'badge-neutral'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.campaign_state && (
                      <span className={stateBadgeClass(inv.campaign_state)}>
                        {inv.campaign_state.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="risk-disclosure" style={{ marginTop: 32 }}>
        <strong>⚠️ Risk Disclosure</strong>
        This is a simulation for learning. No real money is involved. In a real launch,
        investing in a local business can result in loss of the full amount. Insurance reduces
        some risks but does not guarantee returns.
      </div>
    </div>
  )
}
