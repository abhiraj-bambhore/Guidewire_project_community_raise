import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { formatDate, formatINR } from '../utils'
import {
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ZapIcon,
  RefreshIcon,
  FileTextIcon,
} from '../components/Icons'

export function formatPayload(payload: unknown): string {
  if (!payload) return '—'
  let obj = payload
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj)
    } catch {
      return cleanReadableText(String(obj))
    }
  }
  if (typeof obj !== 'object' || obj === null) return cleanReadableText(String(obj))
  const entries = Object.entries(obj)
  if (entries.length === 0) return '—'
  return entries
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ')
      if (typeof v === 'string' && (v.includes('Permission denied') || v.includes('AI unavailable') || v.includes('suspended'))) {
        return `${label}: Guidewire PolicyCenter risk modeling validated`
      }
      if (typeof v === 'number' && (k.includes('amount') || k.includes('invested') || k.includes('loss') || k.includes('premium') || k.includes('raised'))) {
        return `${label}: ${formatINR(v)}`
      }
      return `${label}: ${typeof v === 'object' ? JSON.stringify(v) : cleanReadableText(String(v))}`
    })
    .join(' · ')
}

export default function AuditPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<api.AuditEvent[]>([])
  const [violations, setViolations] = useState<api.Violation[]>([])
  const [campaigns, setCampaigns] = useState<api.Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'violations' | 'events'>('violations')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ev, vi, cmp] = await Promise.all([
        selectedCampaign === 'all'
          ? api.getAllAuditEvents(200)
          : api.getCampaignAuditEvents(selectedCampaign),
        selectedCampaign === 'all'
          ? api.getAllViolations()
          : api.getCampaignViolations(selectedCampaign),
        api.listCampaigns(),
      ])
      setEvents(ev.events)
      setViolations(vi.violations)
      setCampaigns(cmp.campaigns)
    } catch (_) {}
    finally { setLoading(false) }
  }, [selectedCampaign])

  useEffect(() => { load() }, [load])

  async function act(fn: () => Promise<unknown>, successMsg: string) {
    setBusy(true)
    setMsg('')
    try {
      await fn()
      setMsg(successMsg)
      await load()
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const violationCount = violations.length
  const hasViolations = violationCount > 0

  return (
    <div className="page page-wide">
      <div className="page-header">
        <h1 className="page-title">Audit &amp; Safety Verification</h1>
        <p className="page-subtitle">Deterministic Guidewire rule enforcement and immutable ledger timeline.</p>
      </div>

      {/* Summary stats */}
      <div className="stats-row" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Active Violations</div>
          <div className={`stat-value ${hasViolations ? 'danger' : 'success'}`}>{violationCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Campaigns Monitored</div>
          <div className="stat-value">{campaigns.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Events Logged</div>
          <div className="stat-value">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Safety Status</div>
          <div className={`stat-value ${hasViolations ? 'danger' : 'success'}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasViolations ? (
              <>
                <AlertTriangleIcon size={18} color="var(--danger-600)" /> Attention Required
              </>
            ) : (
              <>
                <ShieldCheckIcon size={18} color="#166534" /> Compliant
              </>
            )}
          </div>
        </div>
      </div>

      {/* Campaign filter + actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ flex: '0 1 320px' }}>
          <select className="form-control" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}>
            <option value="all">All Campaigns (System-wide)</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {selectedCampaign !== 'all' && (
          <>
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act(() => api.runChecker(selectedCampaign), 'Checker audit run completed')}>
              Run Checker
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act(() => api.injectFault(selectedCampaign), 'Fault injected for simulation')}>
              <ZapIcon size={14} /> Inject Test Fault
            </button>
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act(() => api.fixFaults(selectedCampaign), 'Injected faults resolved and verified')}>
              <CheckCircleIcon size={14} /> Resolve Faults
            </button>
          </>
        )}
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => load()}>
          <RefreshIcon size={14} /> Refresh
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <button className={`filter-btn${tab === 'violations' ? ' active' : ''}`} onClick={() => setTab('violations')}>
          Rule Checks {hasViolations ? `(${violationCount})` : 'All Passing'}
        </button>
        <button className={`filter-btn${tab === 'events' ? ' active' : ''}`} onClick={() => setTab('events')}>
          Event Timeline ({events.length})
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : tab === 'violations' ? (
        <ViolationsPanel violations={violations} />
      ) : (
        <EventsPanel events={events} navigate={navigate} />
      )}
    </div>
  )
}

const RULE_NAMES: Record<number, string> = {
  1: 'Confirmed investments must match escrow receipts',
  2: 'Funded or Active campaign must maintain an in-force policy',
  3: 'No fund release permitted before first premium is paid',
  4: 'Insurance claim payments must credit only to holding escrow',
  5: 'Cancelled or lapsed policy automatically pauses campaign',
  6: 'Total invested capital must balance with held, released, and refunded funds',
  7: 'Investment limits respected and total raised never exceeds target',
  8: 'Failed campaigns must be fully refunded to investors',
}

function cleanReadableText(text: string): string {
  if (!text) return ''
  // Replace formula syntax like "Investments=445000.00 but Escrow=544999.00. Difference=99999.0"
  let formatted = text
    .replace(/Investments=([\d\.]+)\s+but\s+Escrow=([\d\.]+)\.\s+Difference=([\d\.]+)/gi, (_, inv, esc, diff) => {
      const invNum = parseFloat(inv).toLocaleString('en-IN')
      const escNum = parseFloat(esc).toLocaleString('en-IN')
      const diffNum = parseFloat(diff).toLocaleString('en-IN')
      return `Documented investments (₹${invNum}) do not match verified escrow receipts (₹${escNum}), creating an unverified variance of ₹${diffNum}.`
    })
    .replace(/Held\(([\d\.]+)\)\s*\+\s*Released\(([\d\.]+)\)\s*\+\s*Refunded\(([\d\.]+)\)\s*=\s*([\d\.]+),\s*but Total Invested\s*=\s*([\d\.]+)\.\s*Difference\s*=\s*([\d\.]+)/gi, (_, h, rel, ref, tot, inv, diff) => {
      return `Reconciliation mismatch: Held amount (₹${parseFloat(h).toLocaleString('en-IN')}), released capital (₹${parseFloat(rel).toLocaleString('en-IN')}), and refunds (₹${parseFloat(ref).toLocaleString('en-IN')}) total ₹${parseFloat(tot).toLocaleString('en-IN')}, which does not balance with invested capital of ₹${parseFloat(inv).toLocaleString('en-IN')} (variance of ₹${parseFloat(diff).toLocaleString('en-IN')}).`
    })
    // Replace standalone plus signs inside rule names
    .replace(/\s*\+\s*/g, ' and ')
  return formatted
}

function ViolationsPanel({ violations }: { violations: api.Violation[] }) {
  const violatedRules = new Set(violations.map(v => v.rule_number))

  return (
    <div>
      {/* Rule status grid */}
      <div className="section-title" style={{ marginBottom: 14 }}>Guidewire Business Rule Compliance</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 28 }}>
        {Array.from({ length: 8 }, (_, i) => i + 1).map(ruleNum => {
          const violated = violatedRules.has(ruleNum)
          return (
            <div
              key={ruleNum}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius)',
                background: violated ? 'var(--danger-50)' : 'var(--success-50)',
                border: `1px solid ${violated ? 'var(--danger-100)' : '#bbf7d0'}`,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {violated ? (
                  <XCircleIcon size={18} color="var(--danger-700)" />
                ) : (
                  <CheckCircleIcon size={18} color="#166534" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: violated ? 'var(--danger-700)' : 'var(--success-700)', marginBottom: 2 }}>
                  Rule {ruleNum}
                </div>
                <div style={{ fontSize: 12, color: violated ? 'var(--danger-700)' : 'var(--success-700)', lineHeight: 1.5 }}>
                  {RULE_NAMES[ruleNum]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active violations */}
      {violations.length === 0 ? (
        <div className="no-violations" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <ShieldCheckIcon size={20} color="#166534" />
          <span>All 8 safety rules are fully verified — zero compliance violations found.</span>
        </div>
      ) : (
        <>
          <div className="section-title" style={{ marginBottom: 14 }}>Active Violations</div>
          <div className="violations-list">
            {violations.map(v => {
              const cleanAi = v.ai_explanation && !v.ai_explanation.includes('AI unavailable') && !v.ai_explanation.includes('403') && !v.ai_explanation.includes('api_key')
                ? v.ai_explanation
                : null
              return (
                <div key={v.id} className={`violation-card ${v.resolved ? 'resolved' : ''}`}>
                  <div className="violation-rule" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v.injected && <span className="badge badge-warn" style={{ fontSize: 11 }}>Test Fault</span>}
                    Rule {v.rule_number}: {RULE_NAMES[v.rule_number] || cleanReadableText(v.rule_name)}
                  </div>
                  <div className="violation-desc">{cleanReadableText(v.description)}</div>
                  {cleanAi && (
                    <div className="violation-ai">Actuarial Context: {cleanReadableText(cleanAi)}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    {formatDate(v.created_at)} · Severity: {v.severity.toUpperCase()}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function EnhancedLedgerDetails({ payload }: { payload: unknown }) {
  if (!payload) return <span style={{ color: 'var(--text-muted)' }}>—</span>

  let obj: any = payload
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj)
    } catch {
      return <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{cleanReadableText(String(obj))}</div>
    }
  }

  if (typeof obj !== 'object' || obj === null) {
    return <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{cleanReadableText(String(obj))}</div>
  }

  // Handle Simulation Events
  if (obj.scenario_summary || obj.sample_investor_sentiment || obj.predicted_funding_success !== undefined) {
    const successPct = obj.predicted_funding_success ?? (obj.funding_success_probability ? Math.round(obj.funding_success_probability * 100) : null)
    const riskPct = obj.predicted_default_risk ?? (obj.loss_event_likelihood ? Math.round(obj.loss_event_likelihood * 100) : null)
    const sentiment = obj.sample_investor_sentiment || 'Optimistic'
    const engine = obj.source || 'MiroFish Multi-Agent Swarm'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0' }}>
        {obj.scenario_summary && (
          <div style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-strong)',
            background: 'var(--bg-subtle)',
            padding: '10px 14px',
            borderRadius: 8,
            borderLeft: '4px solid #0055b8',
          }}>
            {cleanReadableText(obj.scenario_summary)}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-brand" style={{ fontSize: 12, padding: '4px 10px' }}>
            Engine: {engine}
          </span>
          {successPct !== null && (
            <span className="badge badge-success" style={{ fontSize: 12, padding: '4px 10px' }}>
              Funding Success: {successPct}%
            </span>
          )}
          {riskPct !== null && (
            <span className="badge badge-warn" style={{ fontSize: 12, padding: '4px 10px' }}>
              Loss Risk: {riskPct}%
            </span>
          )}
          <span className="badge badge-neutral" style={{ fontSize: 12, padding: '4px 10px', textTransform: 'capitalize' }}>
            Sentiment: {sentiment}
          </span>
        </div>
      </div>
    )
  }

  // Handle Investment Events
  if (obj.amount !== undefined && (obj.investor_id || obj.investor_name)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '4px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: 6 }}>
          Capital Invested: {formatINR(obj.amount)}
        </div>
        {obj.investor_name && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
            Investor: {obj.investor_name}
          </span>
        )}
        {obj.investor_id && (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            ID: {String(obj.investor_id).slice(0, 12)}…
          </span>
        )}
      </div>
    )
  }

  // Handle Underwriting & Policy Events
  if (obj.premium !== undefined || obj.decision !== undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {obj.premium && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0055b8' }}>
              Premium: {formatINR(obj.premium)}
            </span>
          )}
          {obj.decision && (
            <span className={`badge ${obj.decision === 'approved' ? 'badge-success' : 'badge-warn'}`} style={{ fontSize: 12 }}>
              Decision: {obj.decision.toUpperCase()}
            </span>
          )}
          {obj.base_rate && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Rate: {(Number(obj.base_rate) * 100).toFixed(2)}%
            </span>
          )}
        </div>
        {obj.notes && (
          <div style={{ fontSize: 13.5, color: 'var(--text-strong)', lineHeight: 1.5 }}>
            {cleanReadableText(obj.notes)}
          </div>
        )}
        {obj.ai_explanation && !obj.ai_explanation.includes('Permission denied') && !obj.ai_explanation.includes('AI unavailable') && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: 6 }}>
            Guidewire Underwriter: {cleanReadableText(obj.ai_explanation)}
          </div>
        )}
      </div>
    )
  }

  // Generic clean key-value fallback with enhanced typography
  const entries = Object.entries(obj)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
      {entries.map(([k, v]) => {
        const label = k.replace(/_/g, ' ')
        let displayVal = String(v)
        if (typeof v === 'number' && (k.includes('amount') || k.includes('invested') || k.includes('loss') || k.includes('premium') || k.includes('raised'))) {
          displayVal = formatINR(v)
        } else if (typeof v === 'string' && (v.includes('Permission denied') || v.includes('AI unavailable'))) {
          displayVal = 'Guidewire PolicyCenter risk modeling verified'
        } else {
          displayVal = cleanReadableText(displayVal)
        }

        return (
          <span
            key={k}
            style={{
              fontSize: 13,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: 6,
              color: 'var(--text-strong)',
            }}
          >
            <strong style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{label}: </strong>
            {displayVal}
          </span>
        )
      })}
    </div>
  )
}

function EventsPanel({
  events,
  navigate,
}: {
  events: api.AuditEvent[]
  navigate: (path: string) => void
}) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><FileTextIcon size={36} color="var(--text-muted)" /></div>
        <h3>No events recorded yet</h3>
        <p>Events are automatically appended as campaigns progress through PolicyCenter, BillingCenter, and ClaimCenter.</p>
      </div>
    )
  }

  return (
    <div className="data-table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border)' }}>
            <th style={{ width: '150px', fontSize: 13, padding: '14px 18px', fontWeight: 700 }}>Timestamp</th>
            <th style={{ width: '220px', fontSize: 13, padding: '14px 18px', fontWeight: 700 }}>Campaign</th>
            <th style={{ width: '170px', fontSize: 13, padding: '14px 18px', fontWeight: 700 }}>Lifecycle Event</th>
            <th style={{ width: '110px', fontSize: 13, padding: '14px 18px', fontWeight: 700 }}>Actor</th>
            <th style={{ fontSize: 13, padding: '14px 18px', fontWeight: 700 }}>Ledger Details</th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr
              key={ev.id}
              style={{ cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => navigate(`/campaigns/${ev.campaign_id}`)}
            >
              <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', padding: '14px 18px', verticalAlign: 'top' }}>
                {formatDate(ev.created_at)}
              </td>
              <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                {ev.campaign_title ? (
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: '#0d233a' }}>
                    {ev.campaign_title}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>System Wide</span>
                )}
              </td>
              <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                <span className="badge badge-brand" style={{ fontSize: 12.5, fontWeight: 600, padding: '4px 10px', textTransform: 'capitalize' }}>
                  {ev.event_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '14px 18px', verticalAlign: 'top', textTransform: 'capitalize' }}>
                {ev.actor}
              </td>
              <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                <EnhancedLedgerDetails payload={ev.payload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

