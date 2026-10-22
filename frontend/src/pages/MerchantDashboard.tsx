import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { formatINR, outletIcon, stateBadgeClass, pct } from '../utils'

const OUTLET_TYPES = ['cafe', 'gym', 'bakery', 'salon', 'restaurant']
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad']

export default function MerchantDashboard() {
  const navigate = useNavigate()
  const [merchants, setMerchants] = useState<api.Merchant[]>([])
  const [selectedMerchantId, setSelectedMerchantId] = useState('')
  const [campaigns, setCampaigns] = useState<api.Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'campaigns' | 'create'>('campaigns')

  // Create form state
  const [form, setForm] = useState({
    title: '',
    story: '',
    outlet_type: 'cafe',
    target_amount: '',
    min_investment: '1000',
    max_investment: '',
    insured_amount: '',
    area_sqft: '0',
    has_fire_safety_cert: false,
    city: 'Mumbai',
  })

  const loadMerchants = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.listMerchants()
      setMerchants(d.merchants)
      if (d.merchants.length > 0 && !selectedMerchantId) {
        setSelectedMerchantId(d.merchants[0].id)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load merchants')
    } finally {
      setLoading(false)
    }
  }, [selectedMerchantId])

  const loadCampaigns = useCallback(async () => {
    if (!selectedMerchantId) return
    try {
      const d = await api.getMerchantCampaigns(selectedMerchantId)
      setCampaigns(d.campaigns)
    } catch (_) {
      setCampaigns([])
    }
  }, [selectedMerchantId])

  useEffect(() => { loadMerchants() }, [loadMerchants])
  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  function field(key: keyof typeof form, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMerchantId) return
    setBusy(true)
    setMsg('')
    try {
      const payload: api.CreateCampaignPayload = {
        merchant_id: selectedMerchantId,
        title: form.title,
        story: form.story,
        outlet_type: form.outlet_type,
        target_amount: Number(form.target_amount),
        min_investment: Number(form.min_investment),
        max_investment: form.max_investment ? Number(form.max_investment) : null,
        insured_amount: form.insured_amount ? Number(form.insured_amount) : null,
        area_sqft: Number(form.area_sqft),
        has_fire_safety_cert: form.has_fire_safety_cert,
        city: form.city,
      }
      const d = await api.createCampaign(payload)
      setMsg('Campaign created! Redirecting to underwriting…')
      await loadCampaigns()
      setTab('campaigns')
      setTimeout(() => navigate(`/campaigns/${d.campaign.id}`), 1200)
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'Failed'}`)
    } finally {
      setBusy(false)
    }
  }

  async function act(fn: () => Promise<unknown>, successMsg: string) {
    setBusy(true)
    setMsg('')
    try {
      await fn()
      setMsg(successMsg)
      await loadCampaigns()
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const selectedMerchant = merchants.find(m => m.id === selectedMerchantId)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Merchant Dashboard</h1>
        <p className="page-subtitle">Create campaigns, track underwriting, release funds, and simulate events.</p>
      </div>

      {/* Merchant selector */}
      <div className="card card-body" style={{ marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Acting as merchant</label>
          <select className="form-control" value={selectedMerchantId} onChange={e => setSelectedMerchantId(e.target.value)}>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name} — {m.city}</option>)}
          </select>
        </div>
        {selectedMerchant && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingTop: 20 }}>
            {selectedMerchant.email} · {selectedMerchant.city}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <button className={`filter-btn${tab === 'campaigns' ? ' active' : ''}`} onClick={() => setTab('campaigns')}>
          My Campaigns ({campaigns.length})
        </button>
        <button className={`filter-btn${tab === 'create' ? ' active' : ''}`} onClick={() => setTab('create')}>
          + Create Campaign
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      {tab === 'campaigns' ? (
        loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start raising funds from your community.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('create')}>
              Create Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campaigns.map(c => (
              <MerchantCampaignRow
                key={c.id}
                campaign={c}
                busy={busy}
                onView={() => navigate(`/campaigns/${c.id}`)}
                onAct={act}
              />
            ))}
          </div>
        )
      ) : (
        <div className="card card-body" style={{ maxWidth: 680 }}>
          <div className="section-title">New Campaign</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Campaign Title</label>
              <input className="form-control" value={form.title} onChange={e => field('title', e.target.value)} placeholder="e.g. Brew House – Koramangala Outlet" required />
            </div>
            <div className="form-group">
              <label className="form-label">Campaign Story</label>
              <textarea className="form-control" value={form.story} onChange={e => field('story', e.target.value)} rows={4} placeholder="Tell investors about your outlet, plans, and why they should back you…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Outlet Type</label>
                <select className="form-control" value={form.outlet_type} onChange={e => field('outlet_type', e.target.value)}>
                  {OUTLET_TYPES.map(t => <option key={t} value={t}>{outletIcon(t)} {t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-control" value={form.city} onChange={e => field('city', e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Amount (₹)</label>
                <input className="form-control" type="number" value={form.target_amount} onChange={e => field('target_amount', e.target.value)} placeholder="5000000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Insured Amount (₹)</label>
                <input className="form-control" type="number" value={form.insured_amount} onChange={e => field('insured_amount', e.target.value)} placeholder="Same as target if blank" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Min Investment (₹)</label>
                <input className="form-control" type="number" value={form.min_investment} onChange={e => field('min_investment', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Investment (₹)</label>
                <input className="form-control" type="number" value={form.max_investment} onChange={e => field('max_investment', e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area (sq ft)</label>
                <input className="form-control" type="number" value={form.area_sqft} onChange={e => field('area_sqft', e.target.value)} />
                <div className="form-hint">+10% premium if over 2000 sq ft</div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 18 }}>
                <label className="form-check" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.has_fire_safety_cert} onChange={e => field('has_fire_safety_cert', e.target.checked)} />
                  <span>Has Fire Safety Certificate</span>
                </label>
                <div className="form-hint" style={{ marginTop: 4 }}>(-20% premium)</div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? 'Creating…' : 'Create Campaign'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function MerchantCampaignRow({
  campaign: c,
  busy,
  onView,
  onAct,
}: {
  campaign: api.Campaign
  busy: boolean
  onView: () => void
  onAct: (fn: () => Promise<unknown>, msg: string) => void
}) {
  const progress = pct(Number(c.total_raised), Number(c.target_amount))

  return (
    <div className="card card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{outletIcon(c.outlet_type)}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{c.title}</span>
            <span className={stateBadgeClass(c.state)}>{c.state.replace('_', ' ')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Target: {formatINR(c.target_amount)} · Raised: {formatINR(c.total_raised)} · Released: {formatINR(c.total_released)}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onView}>View Detail →</button>
      </div>

      <div className="progress-track" style={{ marginTop: 12, height: 6 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="action-strip">
        {c.state === 'draft' && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAct(() => api.submitUnderwriting(c.id), 'Submitted for underwriting')}>
            Submit for Underwriting
          </button>
        )}
        {c.state === 'underwriting' && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAct(() => api.approveUnderwriting(c.id), 'Underwriting approved')}>
            Approve
          </button>
        )}
        {c.state === 'live' && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAct(() => api.markFunded(c.id), 'Marked as Funded')}>
            Mark Funded
          </button>
        )}
        {c.state === 'funded' && (
          <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onAct(() => api.payPremium(c.id), 'Premium paid → Active')}>
            Pay Premium
          </button>
        )}
        {c.state === 'active' && (
          <>
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onAct(() => api.releaseTranche(c.id, 1), 'Tranche 1 released')}>
              Release T1
            </button>
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onAct(() => api.releaseTranche(c.id, 2), 'Tranche 2 released')}>
              Release T2
            </button>
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onAct(() => api.releaseTranche(c.id, 3), 'Tranche 3 released')}>
              Release T3
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => onAct(() => api.simulateLoss(c.id, 'fire', 500000), 'Loss simulated')}>
              🔥 Simulate Loss
            </button>
          </>
        )}
        {['funded', 'active'].includes(c.state) && (
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => onAct(() => api.simulateLoss(c.id, 'fire', 500000), 'Loss simulated')}>
            🔥 Simulate Loss
          </button>
        )}
        {c.state === 'live' && (
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => onAct(() => api.failCampaign(c.id), 'Campaign failed, all refunded')}>
            Fail Campaign
          </button>
        )}
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onAct(() => api.pauseCampaign(c.id), 'Campaign paused')}>
          Pause
        </button>
      </div>
    </div>
  )
}
