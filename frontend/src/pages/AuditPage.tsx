import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { formatDate } from '../utils'

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
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Audit &amp; Safety Checker</h1>
        <p className="page-subtitle">Real-time business rule enforcement and event timeline.</p>
      </div>

      {/* Summary stats */}
      <div className="stats-row" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Active Violations</div>
          <div className={`stat-value ${hasViolations ? 'danger' : 'success'}`}>{violationCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Campaigns</div>
          <div className="stat-value">{campaigns.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Events Logged</div>
          <div className="stat-value">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Checker Status</div>
          <div className={`stat-value ${hasViolations ? 'danger' : 'success'}`}>{hasViolations ? '⚠ Issues' : '✓ Clean'}</div>
        </div>
      </div>

      {/* Campaign filter + actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ flex: '0 1 280px' }}>
          <select className="form-control" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}>
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {selectedCampaign !== 'all' && (
          <>
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act(() => api.runChecker(selectedCampaign), 'Checker ran successfully')}>
              Run Checker
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act(() => api.injectFault(selectedCampaign), 'Fault injected — Rule 1 violation added')}>
              ⚡ Inject Fault
            </button>
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act(() => api.fixFaults(selectedCampaign), 'Injected faults fixed and checker re-ran')}>
              ✓ Fix Faults
            </button>
          </>
        )}
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => load()}>
          ↻ Refresh
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
          Rule Checks {hasViolations ? `🔴 (${violationCount})` : '✅'}
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
  1: 'Confirmed investments equal escrow receipts',
  2: 'Funded or Active campaign must have an in-force policy',
  3: 'No fund release before first premium is paid',
  4: 'Claim payments go only to the holding account',
  5: 'Cancelled or lapsed policy forces campaign to Paused',
  6: 'Held + released + refunded equals total invested',
  7: 'Investment limits respected and total raised never exceeds target',
  8: 'Failed campaigns fully refunded',
}

function ViolationsPanel({ violations }: { violations: api.Violation[] }) {
  // Show all 8 rules with status
  const violatedRules = new Set(violations.map(v => v.rule_number))

  return (
    <div>
      {/* Rule status grid */}
      <div className="section-title" style={{ marginBottom: 14 }}>Rule Status</div>
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
              <span style={{ fontSize: 16, flexShrink: 0 }}>{violated ? '🔴' : '✅'}</span>
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
        <div className="no-violations">
          <span>✅ All 8 rules are passing — no violations found.</span>
        </div>
      ) : (
        <>
          <div className="section-title" style={{ marginBottom: 14 }}>Active Violations</div>
          <div className="violations-list">
            {violations.map(v => (
              <div key={v.id} className={`violation-card ${v.resolved ? 'resolved' : ''}`}>
                <div className="violation-rule">
                  {v.injected ? '⚡ INJECTED — ' : ''}Rule {v.rule_number}: {v.rule_name}
                </div>
                <div className="violation-desc">{v.description}</div>
                {v.ai_explanation && (
                  <div className="violation-ai">AI: {v.ai_explanation}</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  {formatDate(v.created_at)} · {v.severity}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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
        <div className="empty-icon">📋</div>
        <h3>No events yet</h3>
        <p>Events are logged as campaigns progress through their lifecycle.</p>
      </div>
    )
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Time</th><th>Campaign</th><th>Event</th><th>Actor</th><th>Details</th></tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr
              key={ev.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/campaigns/${ev.campaign_id}`)}
            >
              <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(ev.created_at)}</td>
              <td>
                {ev.campaign_title && (
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{ev.campaign_title}</span>
                )}
              </td>
              <td>
                <span className="badge badge-brand">{ev.event_type.replace(/_/g, ' ')}</span>
              </td>
              <td style={{ fontSize: 13 }}>{ev.actor}</td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ev.payload && Object.keys(ev.payload).length > 0
                  ? Object.entries(ev.payload)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
