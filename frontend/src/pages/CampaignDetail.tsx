import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../api'
import {
  formatINR, pct, outletIcon, stateBadgeClass, formatDate, COVERAGE,
} from '../utils'

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

  async function act(fn: () => Promise<unknown>, msg: string) {
    setBusy(true)
    setActionMsg('')
    try {
      await fn()
      setActionMsg(msg)
      await load()
    } catch (e: unknown) {
      setActionMsg(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleInvest(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !investorId || !investAmount) return
    await act(
      () => api.invest(id, investorId, Number(investAmount)),
      `Investment of ${formatINR(Number(investAmount))} confirmed!`
    )
    setInvestAmount('')
  }

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!campaign) return null

  const progress = pct(Number(campaign.total_raised), Number(campaign.target_amount))
  const isLive = campaign.state === 'live'
  const isActive = campaign.state === 'active'
  const isFunded = campaign.state === 'funded'
  const isActionable = ['active', 'funded'].includes(campaign.state)

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(-1)}>← Back to campaigns</button>

      <div className="detail-layout">
        {/* ── Main column ───────────────────────────────────────────────── */}
        <div>
          {/* Header */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{outletIcon(campaign.outlet_type)}</span>
            <div style={{ flex: 1 }}>
              <h1 className="page-title" style={{ marginBottom: 6 }}>{campaign.title}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={stateBadgeClass(campaign.state)}>{campaign.state.replace('_', ' ')}</span>
                <span className="badge badge-neutral">{campaign.outlet_type}</span>
                <span className="badge badge-neutral">{campaign.city}</span>
                <span className="badge badge-insured">✓ Insured</span>
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

          {/* Prediction panel */}
          {prediction && (
            <div className="section">
              <div className="section-title">AI Prediction</div>
              <div className="prediction-panel">
                <div className="prediction-title">MiroFish Scenario Analysis</div>
                <div className="prediction-grid">
                  <div className="prediction-item">
                    <div className="prediction-item-label">Funding Success</div>
                    <div className="prediction-item-value">{(prediction.funding_success_probability * 100).toFixed(0)}%</div>
                  </div>
                  <div className="prediction-item">
                    <div className="prediction-item-label">Loss Likelihood</div>
                    <div className="prediction-item-value">{(prediction.loss_event_likelihood * 100).toFixed(0)}%</div>
                  </div>
                  <div className="prediction-item prediction-sentiment">
                    <div className="prediction-item-label">Investor Sentiment</div>
                    <div className="prediction-item-value" style={{ fontSize: 18 }}>
                      {prediction.sample_investor_sentiment}
                    </div>
                  </div>
                </div>
                {prediction.scenario_summary && (
                  <p style={{ fontSize: 13, opacity: 0.8, marginTop: 12, lineHeight: 1.6 }}>{prediction.scenario_summary}</p>
                )}
                <div className="prediction-source">Source: {prediction.source}</div>
              </div>
            </div>
          )}

          {/* Coverage */}
          <div className="section">
            <div className="section-title">Insurance Coverage</div>
            <div className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Insured Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)' }}>{formatINR(campaign.insured_amount)}</div>
                </div>
                {policy && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Policy Number</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{policy.policy_number}</div>
                    <span className="badge badge-success" style={{ marginTop: 4 }}>{policy.status}</span>
                  </div>
                )}
              </div>
              <ul className="coverage-list">
                {COVERAGE.map(c => <li key={c}>{c}</li>)}
              </ul>
              {policy && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                  Premium: {formatINR(policy.premium_amount)} · Rate: {(policy.base_rate * 100).toFixed(2)}%
                  · Valid till {policy.expiry_date}
                </div>
              )}
            </div>
          </div>

          {/* Claims */}
          {claims.length > 0 && (
            <div className="section">
              <div className="section-title">Claims</div>
              {claims.map(cl => (
                <div key={cl.id} className="card card-body" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{cl.claim_number}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loss type: {cl.loss_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-warn">{cl.status}</span>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Loss: {formatINR(cl.loss_amount)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risk disclosure */}
          <div className="risk-disclosure">
            <strong>⚠️ Risk Disclosure</strong>
            This is a simulation for learning. No real money is involved. In a real launch,
            investing in a local business can result in loss of the full amount. Insurance reduces
            some risks but does not guarantee returns. Past performance does not predict future results.
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="section">
              <div className="section-title">Premium Invoices</div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Invoice #</th><th>Amount</th><th>Status</th><th>Due Date</th></tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.invoice_number}</td>
                        <td>{formatINR(inv.amount)}</td>
                        <td><span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'overdue' ? 'badge-danger' : 'badge-warn'}`}>{inv.status}</span></td>
                        <td>{inv.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="section">
            <div className="section-title">Timeline</div>
            {timeline.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No events yet.</p>
            ) : (
              <div className="timeline">
                {[...timeline].reverse().map(ev => (
                  <div className="timeline-item" key={ev.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-time">{formatDate(ev.created_at)}</div>
                    <div className="timeline-event">{ev.event_type.replace(/_/g, ' ')}</div>
                    {ev.payload && Object.keys(ev.payload).length > 0 && (
                      <div className="timeline-payload">
                        {Object.entries(ev.payload)
                          .slice(0, 4)
                          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="sidebar">
          {/* Action feedback */}
          {actionMsg && (
            <div className={`alert ${actionMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>
              {actionMsg}
            </div>
          )}

          {/* Violations */}
          <div className="card card-body">
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Safety Checker</div>
            {violations.length === 0 ? (
              <div className="no-violations">✓ All rules pass</div>
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
                  <label className="form-label">Investor</label>
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
                    className="form-control"
                    type="number"
                    min={campaign.min_investment}
                    max={campaign.max_investment ?? undefined}
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    placeholder={`Min ₹${campaign.min_investment}`}
                    required
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                  {busy ? 'Processing…' : 'Invest Now'}
                </button>
              </form>
            </div>
          )}

          {/* Workflow actions */}
          {id && (
            <div className="card card-body">
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Workflow Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campaign.state === 'draft' && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => act(() => api.submitUnderwriting(id), 'Submitted for underwriting')}>
                    Submit for Underwriting
                  </button>
                )}
                {campaign.state === 'underwriting' && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => act(() => api.approveUnderwriting(id), 'Underwriting approved — campaign is now Live')}>
                    Approve Underwriting
                  </button>
                )}
                {isLive && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => act(() => api.markFunded(id), 'Campaign marked Funded, policy issued, invoice created')}>
                    Mark as Funded
                  </button>
                )}
                {isFunded && (
                  <button className="btn btn-success" disabled={busy} onClick={() => act(() => api.payPremium(id), 'Premium paid — campaign is now Active')}>
                    Pay Premium (→ Active)
                  </button>
                )}
                {isActive && (
                  <>
                    <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act(() => api.releaseTranche(id, 1), 'Tranche 1 (50%) released')}>
                      Release Tranche 1 (50%)
                    </button>
                    <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act(() => api.releaseTranche(id, 2), 'Tranche 2 (25%) released')}>
                      Release Tranche 2 (25%)
                    </button>
                    <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act(() => api.releaseTranche(id, 3), 'Tranche 3 (25%) released')}>
                      Release Tranche 3 (25%)
                    </button>
                  </>
                )}
                {isActionable && (
                  <button className="btn btn-danger" disabled={busy} onClick={() => act(() => api.simulateLoss(id, 'fire', 500000), 'Loss simulated — claim opened')}>
                    🔥 Simulate Loss (Fire ₹5L)
                  </button>
                )}
                {isLive && (
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act(() => api.failCampaign(id), 'Campaign failed — all investments refunded')}>
                    Fail Campaign
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
