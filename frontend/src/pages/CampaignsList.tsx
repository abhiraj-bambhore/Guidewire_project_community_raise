import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { formatINR, pct, outletIcon, stateBadgeClass, formatDateShort } from '../utils'

const STATES = ['all', 'draft', 'underwriting', 'live', 'funded', 'active', 'under_claim', 'failed', 'paused', 'declined']

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<api.Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError('')
    const state = filter === 'all' ? undefined : filter
    api.listCampaigns(state)
      .then(d => setCampaigns(d.campaigns))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Community Campaigns</h1>
          <p className="page-subtitle">Fund local businesses and watch your community grow.</p>
        </div>
      </div>

      <div className="filter-bar">
        {STATES.map(s => (
          <button
            key={s}
            className={`filter-btn${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>No campaigns found</h3>
          <p>Try changing the filter or create one from the Merchant dashboard.</p>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign: c, onClick }: { campaign: api.Campaign; onClick: () => void }) {
  const progress = pct(Number(c.total_raised), Number(c.target_amount))
  return (
    <div className="card campaign-card card-body" onClick={onClick}>
      <div className="campaign-card-header">
        <span style={{ fontSize: 28 }}>{outletIcon(c.outlet_type)}</span>
        <span className={stateBadgeClass(c.state)}>{c.state.replace('_', ' ')}</span>
      </div>

      <div className="campaign-tags">
        <span className="badge badge-neutral">{c.outlet_type}</span>
        <span className="badge badge-neutral">{c.city}</span>
        <span className="badge badge-insured">✓ Insured</span>
      </div>

      <div className="card-title">{c.title}</div>
      {c.merchant_name && <div className="card-meta">by {c.merchant_name}</div>}

      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-labels">
          <span><strong>{formatINR(c.total_raised)}</strong> raised</span>
          <span>{progress.toFixed(0)}% of {formatINR(c.target_amount)}</span>
        </div>
      </div>

      {c.deadline && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Deadline: {formatDateShort(c.deadline)}
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        Min: {formatINR(c.min_investment)}
        {c.max_investment ? ` · Max: ${formatINR(c.max_investment)}` : ''}
      </div>
    </div>
  )
}
