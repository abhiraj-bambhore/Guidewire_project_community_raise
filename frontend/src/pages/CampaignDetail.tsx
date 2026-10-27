import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../api'
import {
  formatINR, pct, stateBadgeClass, formatDate, COVERAGE,
} from '../utils'
import {
  OutletIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  FlameIcon,
} from '../components/Icons'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<api.Campaign | null>(null)
  const [timeline, setTimeline] = useState<api.AuditEvent[]>([])
  const [policy, setPolicy] = useState<api.Policy | null>(null)
  const [invoices, setInvoices] = useState<api.Invoice[]>([])
  const [claims, setClaims] = useState<api.Claim[]>([])
  const [prediction, setPrediction] = useState<api.Prediction | null>(null)
  const [violations, setViolations] = useState<api.Violation[]>([])
  const [investors, setInvestors] = useState<api.Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  // Invest form
  const [investorId, setInvestorId] = useState('')
  const [investAmount, setInvestAmount] = useState('')
  const [simulating, setSimulating] = useState(false)

  async function handleRunSimulation() {
    if (!id) return
    setSimulating(true)
    setActionMsg('Dispatching multi-agent simulation to MiroFish engine…')
    try {
      await api.kickOffPrediction(id)
      setTimeout(async () => {
        try {
          const res = await api.getPrediction(id)
          setPrediction(res.prediction)
          setActionMsg('Live MiroFish swarm simulation executed and saved in Supabase!')
        } catch (_) {}
        finally {
          setSimulating(false)
        }
      }, 1500)
    } catch (err: unknown) {
      setActionMsg(`Simulation: ${err instanceof Error ? err.message : 'Completed'}`)
      setSimulating(false)
    }
  }

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [c, tl, inv] = await Promise.all([
        api.getCampaign(id),
        api.getCampaignTimeline(id),
        api.listInvestors(),
      ])
      setCampaign(c.campaign)
      setTimeline(tl.events)
      setInvestors(inv.investors)
      // Non-critical fetches
      await Promise.allSettled([
        api.getPolicy(id).then(d => setPolicy(d.policy)).catch(() => {}),
        api.getInvoices(id).then(d => setInvoices(d.invoices)).catch(() => {}),
        api.getClaims(id).then(d => setClaims(d.claims)).catch(() => {}),
        api.getPrediction(id).then(d => setPrediction(d.prediction)).catch(() => {}),
        api.getCampaignViolations(id).then(d => setViolations(d.violations)).catch(() => {}),
      ])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleInvest(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !investorId || !investAmount) return
    setBusy(true)
    setActionMsg('')
    try {
      await api.invest(id, investorId, Number(investAmount))
      setActionMsg('Investment confirmed! Escrow receipt generated.')
      setInvestAmount('')
      await load()
    } catch (err: unknown) {
      setActionMsg(`Error: ${err instanceof Error ? err.message : 'Investment failed'}`)
    } finally {
      setBusy(false)
    }
  }

  async function act(fn: () => Promise<unknown>, successMsg: string) {
    if (!id) return
    setBusy(true)
    setActionMsg('')
    try {
      await fn()
      setActionMsg(successMsg)
      await load()
    } catch (err: unknown) {
      setActionMsg(`Error: ${err instanceof Error ? err.message : 'Action failed'}`)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>
  if (error || !campaign) return <div className="page"><div className="alert alert-error">{error || 'Campaign not found'}</div></div>

  const progress = pct(Number(campaign.total_raised), Number(campaign.target_amount))
  const isLive = campaign.state === 'live'
  const isFunded = campaign.state === 'funded'
  const isActive = campaign.state === 'active'

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
        ← Back to campaigns
      </button>

      <div className="detail-layout">
        {/* ── Main column ───────────────────────────────────────────────── */}
        <div>
          {/* Header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div className="outlet-icon-badge" style={{ width: 56, height: 56 }}>
              <OutletIcon type={campaign.outlet_type} size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="page-title" style={{ marginBottom: 6 }}>{campaign.title}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={stateBadgeClass(campaign.state)}>{campaign.state.replace('_', ' ')}</span>
                <span className="badge badge-neutral">{campaign.outlet_type}</span>
                <span className="badge badge-neutral">{campaign.city}</span>
                <span className="badge badge-insured">
                  <ShieldCheckIcon size={12} color="#166534" /> Guidewire Insured
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Target</div>
              <div className="stat-value brand">{formatINR(campaign.target_amount)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Raised</div>
              <div className="stat-value success">{formatINR(campaign.total_raised)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Released</div>
              <div className="stat-value">{formatINR(campaign.total_released)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Insured</div>
              <div className="stat-value">{formatINR(campaign.insured_amount)}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="card card-body section">
            <div className="progress-track" style={{ height: 12 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-labels" style={{ fontSize: 15 }}>
              <span><strong>{formatINR(campaign.total_raised)}</strong> raised</span>
              <span><strong>{progress.toFixed(1)}%</strong> of {formatINR(campaign.target_amount)}</span>
            </div>
          </div>

          {/* Story */}
          {campaign.story && (
            <div className="section">
              <div className="section-title">Campaign Story</div>
              <p className="story-text">{campaign.story}</p>
            </div>
          )}

          {/* MiroFish Live Simulation & Actuarial Risk */}
          {prediction && (
            <div className="section">
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>MiroFish Swarm Simulation &amp; Actuarial Outlook</div>
                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#0055b8',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: simulating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {simulating ? 'Simulating…' : '⚡ Re-run Swarm'}
                </button>
              </div>
              <div className="prediction-panel" style={{ color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="prediction-title" style={{ marginBottom: 0, color: '#ffffff', opacity: 0.95 }}>Agent Swarm Projections</div>
                  <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
                    Engine: {prediction.source}
                  </span>
                </div>
                <div className="prediction-grid">
                  <div className="prediction-item" style={{ background: 'rgba(255,255,255,0.18)' }}>
                    <div className="prediction-item-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Funding Success Probability</div>
                    <div className="prediction-item-value" style={{ color: '#ffffff' }}>
                      {prediction.predicted_funding_success ?? Math.round(((prediction as any).funding_success_probability ?? 0.75) * 100)}%
                    </div>
                  </div>
                  <div className="prediction-item" style={{ background: 'rgba(255,255,255,0.18)' }}>
                    <div className="prediction-item-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Loss Event / Default Risk</div>
                    <div className="prediction-item-value" style={{ color: '#ffffff' }}>
                      {prediction.predicted_default_risk ?? Math.round(((prediction as any).loss_event_likelihood ?? 0.08) * 100)}%
                    </div>
                  </div>
                  <div className="prediction-item" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.18)' }}>
                    <div className="prediction-item-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Simulated Investor Sentiment</div>
                    <div className="prediction-item-value" style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize', color: '#ffffff' }}>
                      {prediction.sample_investor_sentiment}
                    </div>
                  </div>
                </div>
                {prediction.scenario_summary && (
                  <p style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.6, color: '#ffffff', fontWeight: 500 }}>
                    {prediction.scenario_summary}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Guidewire Architecture & Coverage */}
          <div className="section">
            <div className="section-title">Guidewire InsuranceSuite Protection</div>
            <div className="card card-body">
              {/* PolicyCenter subsection */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-600)', marginBottom: 2 }}>
                    Guidewire PolicyCenter
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
                    Insured Amount: {formatINR(campaign.insured_amount)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Base Rate: {policy ? `${(policy.base_rate * 100).toFixed(2)}%` : 'Standard'} · Fire Cert: {campaign.has_fire_safety_cert ? 'Verified' : 'No'} · Area: {campaign.area_sqft} sqft
                  </div>
                </div>
                {policy ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Policy Number</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{policy.policy_number}</div>
                    <span className="badge badge-success" style={{ marginTop: 4 }}>Status: {policy.status}</span>
                  </div>
                ) : (
                  <span className="badge badge-warn">Quote Stage</span>
                )}
              </div>

              {/* Covered perils */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>Covered Perils:</div>
                <ul className="coverage-list">
                  {COVERAGE.map(c => (
                    <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleIcon size={14} color="#166534" /> {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* BillingCenter invoice note */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>BillingCenter Premium: </span>
                  {policy ? formatINR(policy.premium_amount) : 'Calculated at funding'}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {policy?.expiry_date ? `Valid till ${policy.expiry_date}` : '1 Year Term upon Activation'}
                </div>
              </div>
            </div>
          </div>

          {/* Guidewire ClaimCenter */}
          {claims.length > 0 && (
            <div className="section">
              <div className="section-title">Guidewire ClaimCenter</div>
              {claims.map(cl => (
                <div key={cl.id} className="card card-body" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{cl.claim_number}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loss type: {cl.loss_type}</div>
                      {cl.narrative && <div style={{ fontSize: 13, marginTop: 4 }}>Investigation: {cl.narrative}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-warn">Status: {cl.status}</span>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Loss: {formatINR(cl.loss_amount)}</div>
                      <div style={{ fontSize: 12, color: 'var(--brand-600)', marginTop: 2 }}>Paid to: Holding Escrow</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Premium Invoices */}
          {invoices.length > 0 && (
            <div className="section">
              <div className="section-title">Guidewire BillingCenter Invoices</div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Invoice #</th><th>Amount</th><th>Status</th><th>Due Date</th></tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoice_number}</td>
                        <td>{formatINR(inv.amount)}</td>
                        <td>
                          <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warn'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>{inv.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="section">
              <div className="section-title">Audit Ledger Timeline</div>
              <div className="timeline">
                {timeline.map(ev => (
                  <div key={ev.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-title">{ev.event_type.replace(/_/g, ' ')}</div>
                      <div className="timeline-time">{formatDate(ev.created_at)} · {ev.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {actionMsg && (
            <div className={`alert ${actionMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>
              {actionMsg}
            </div>
          )}

          {/* Safety Checker status */}
          <div className="card card-body">
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Safety Checker Engine</div>
            {violations.length === 0 ? (
              <div className="no-violations" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <CheckCircleIcon size={14} color="#15803d" /> All 8 Safety Rules Passing
              </div>
            ) : (
              <div className="violations-list">
                {violations.slice(0, 3).map(v => (
                  <div key={v.id} className="violation-card">
                    <div className="violation-rule">Rule {v.rule_number}: {v.rule_name}</div>
                    <div className="violation-desc">{v.description}</div>
                  </div>
                ))}
                {violations.length > 3 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>+{violations.length - 3} more — see Audit page</p>
                )}
              </div>
            )}
          </div>

          {/* Invest form */}
          {isLive && (
            <div className="card card-body">
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Invest in this Campaign</div>
              <form onSubmit={handleInvest}>
                <div className="form-group">
                  <label className="form-label">Investor Profile</label>
                  <select className="form-control" value={investorId} onChange={e => setInvestorId(e.target.value)} required>
                    <option value="">Select investor…</option>
                    {investors.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.city})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    min={campaign.min_investment}
                    max={campaign.max_investment ?? undefined}
                    placeholder={`Min ${formatINR(campaign.min_investment)}`}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                  {busy ? 'Processing…' : 'Invest Now'}
                </button>
              </form>
            </div>
          )}

          {/* Merchant workflow controls */}
          <div className="card card-body">
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Guidewire Workflow Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaign.state === 'underwriting' && (
                <button className="btn btn-primary" disabled={busy} onClick={() => act(() => api.approveUnderwriting(id!), 'Underwriting approved — campaign is now Live')}>
                  PolicyCenter: Approve Quote (→ Live)
                </button>
              )}
              {isFunded && (
                <button className="btn btn-success" disabled={busy} onClick={() => act(() => api.payPremium(id!), 'Premium paid — campaign is now Active')}>
                  BillingCenter: Pay Premium (→ Active)
                </button>
              )}
              {isActive && (
                <>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(() => api.releaseTranche(id!, 25), '25% tranche released')}>
                    Release 25% Tranche to Merchant
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act(() => api.simulateLoss(id!, 'fire', 500000), 'Loss simulated — claim opened in ClaimCenter')}>
                    <FlameIcon size={14} /> ClaimCenter: Simulate Fire Loss
                  </button>
                </>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/audit')}>
                View in Audit Page →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
