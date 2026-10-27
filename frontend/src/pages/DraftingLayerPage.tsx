import { useState, useEffect } from 'react'
import * as api from '../api'
import { formatINR } from '../utils'
import { OutletIcon, ShieldCheckIcon, BuildingIcon } from '../components/Icons'

export default function DraftingLayerPage() {
  const [data, setData] = useState<{
    draft_campaigns: api.DraftCampaign[]
    behavioral_trends: Record<string, api.BehavioralTrend>
    swarm_summary: api.SwarmSummary
    outlet_distribution: api.OutletDistribution[]
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTrendKey, setActiveTrendKey] = useState<string>('investment_intent')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; x: number; y: number } | null>(null)

  // Drawer / modal for detailed campaign behavior inspection
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [campaignBehaviors, setCampaignBehaviors] = useState<api.CampaignBehaviors | null>(null)
  const [loadingBehaviors, setLoadingBehaviors] = useState(false)
  const [pledgeIntentSuccess, setPledgeIntentSuccess] = useState<string | null>(null)

  // Swarm live log ticker
  const [swarmLogs, setSwarmLogs] = useState<string[]>([
    'MiroFish Agent [Risk-α]: Verified Guidewire commercial fire risk rating on draft cohorts',
    'MiroFish Agent [Pulse-β]: Community investment sentiment trending +4.8% in Bengaluru region',
    'PolicyCenter Stream: Pre-underwriting quote engine processed 4 commercial profiles',
    'MiroFish Agent [Compliance-δ]: Coverage thresholds validated across municipal safety codes',
  ])

  useEffect(() => {
    loadDraftingData()
  }, [])

  // Live ticker simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const logs = [
        'MiroFish Agent [Pulse-β]: Student micro-investor cohort sentiment shifted +1.2%',
        'PolicyCenter Engine: Underwriting hazard clearance verified for draft bakery profile',
        'MiroFish Agent [Viability-γ]: Target capital ratio adjusted for seasonal footfall',
        'MiroFish Agent [Risk-α]: Peril loss index decreased -0.4% following sprinkler compliance check',
        'MiroFish Swarm: Backer interest signals received from 18 verified alumni nodes',
      ]
      const nextLog = logs[Math.floor(Math.random() * logs.length)]
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
      setSwarmLogs(prev => [`[${timestamp}] ${nextLog}`, ...prev.slice(0, 5)])
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  async function loadDraftingData() {
    setLoading(true)
    setError('')
    try {
      const res = await api.getDraftingLayer()
      setData(res)
      if (res.behavioral_trends && !res.behavioral_trends[activeTrendKey]) {
        const firstKey = Object.keys(res.behavioral_trends)[0]
        if (firstKey) setActiveTrendKey(firstKey)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load Drafting Layer data')
    } finally {
      setLoading(false)
    }
  }

  async function openCampaignDetail(id: string) {
    setSelectedCampaignId(id)
    setLoadingBehaviors(true)
    setPledgeIntentSuccess(null)
    try {
      const detail = await api.getCampaignBehaviors(id)
      setCampaignBehaviors(detail)
    } catch (err: any) {
      console.error('Failed to load campaign behaviors', err)
    } finally {
      setLoadingBehaviors(false)
    }
  }

  function handleSignalInterest(title: string) {
    setPledgeIntentSuccess(`Your early interest signal for "${title}" has been recorded into the MiroFish swarm! You will receive priority allocation upon live launch.`)
    setTimeout(() => setPledgeIntentSuccess(null), 5000)
  }

  // Active trend
  const currentTrend = data?.behavioral_trends?.[activeTrendKey]
  const trendPoints = currentTrend?.data || []

  // Filtered drafts
  const filteredDrafts = (data?.draft_campaigns || []).filter(c => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'approved') return c.underwriting_preview.decision === 'approved'
    if (selectedFilter === 'manual_review') return c.underwriting_preview.decision === 'manual_review'
    if (selectedFilter === 'declined') return c.underwriting_preview.decision === 'declined'
    return true
  })

  // SVG Chart Dimensions & Helpers
  const chartWidth = 720
  const chartHeight = 220
  const paddingX = 45
  const paddingY = 25
  const usableWidth = chartWidth - paddingX * 2
  const usableHeight = chartHeight - paddingY * 2

  const values = trendPoints.map(p => p.value)
  const minVal = values.length ? Math.floor(Math.min(...values) * 0.9) : 0
  const maxVal = values.length ? Math.ceil(Math.max(...values) * 1.1) : 100
  const valRange = Math.max(maxVal - minVal, 1)

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / Math.max(trendPoints.length - 1, 1)) * usableWidth
    const y = chartHeight - paddingY - ((val - minVal) / valRange) * usableHeight
    return { x, y }
  }

  const pathD = trendPoints.length > 0
    ? trendPoints.reduce((acc, point, idx) => {
        const { x, y } = getCoordinates(idx, point.value)
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
      }, '')
    : ''

  const areaD = pathD
    ? `${pathD} L ${paddingX + usableWidth} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`
    : ''

  const trendTabs = [
    { key: 'investment_intent', label: 'Investment Intent', icon: '📈' },
    { key: 'risk_perception', label: 'Risk Perception', icon: '🛡️' },
    { key: 'community_engagement', label: 'Community Buzz', icon: '👥' },
    { key: 'trust_confidence', label: 'Insurance Trust', icon: '🏛️' },
    { key: 'return_expectation', label: 'Return Sentiment', icon: '💎' },
  ]

  return (
    <div className="page page-wide" style={{ paddingBottom: '90px' }}>
      {/* ── Top Header Strip ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#eff6ff', borderRadius: '100px', border: '1px solid #bfdbfe', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0055b8', display: 'inline-block', animation: 'pulse 1.8s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0055b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Guidewire Underwriting • MiroFish Swarm Intelligence
            </span>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Customer Drafting Layer
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0055b8', background: '#dbeafe', padding: '3px 10px', borderRadius: '6px' }}>
              PRE-LAUNCH LAB
            </span>
          </h1>
          <p className="page-subtitle" style={{ maxWidth: '820px' }}>
            Inspect upcoming community campaigns in their draft & underwriting states. Explore real-time Guidewire actuarial previews and customer behavioral trendlines modeled by the MiroFish multi-agent swarm.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadDraftingData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#334155',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
            </svg>
            Sync Telemetry
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner-wrap" style={{ minHeight: '380px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* ── Executive Swarm Summary Row ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #0055b8' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Drafts In Underwriting
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0d233a', marginTop: '6px' }}>
                {data?.swarm_summary?.total_drafts ?? 0}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ color: '#15803d', fontWeight: 600 }}>● {data?.swarm_summary?.approved_count ?? 0} Approved</span>
                <span style={{ color: '#b45309', fontWeight: 600 }}>● {data?.swarm_summary?.review_count ?? 0} Review</span>
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                MiroFish Swarm Consensus
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                {data?.swarm_summary?.swarm_consensus ?? 72.4}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Agent Confidence: <strong style={{ color: '#0f172a' }}>{data?.swarm_summary?.agent_confidence ?? 84.1}%</strong>
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Avg Guidewire Base Rate
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
                {data?.swarm_summary?.avg_premium_rate ?? 0.44}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Actuarial Peril Premium Model
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #ea580c' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total Insured Exposure
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d233a', marginTop: '8px' }}>
                {formatINR(data?.swarm_summary?.total_insured_value ?? 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Commercial Coverage Requested
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Swarm Sentiment State
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0055b8', marginTop: '10px', lineHeight: 1.3 }}>
                "{data?.swarm_summary?.behavioral_sentiment ?? 'Bullish on Community Funding'}"
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Continuous Social & Risk Inference
              </div>
            </div>
          </div>

          {/* ── Live MiroFish Swarm Event Ticker ──────────────────────────────── */}
          <div style={{ background: '#0d233a', color: '#94a3b8', padding: '10px 18px', borderRadius: '10px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              MIROFISH SWARM TELEMETRY:
            </div>
            <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12.5px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', flex: 1 }}>
              {swarmLogs[0]}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {/* ── Section: MiroFish Behavioral Trend Analysis (Graphs) ──────────── */}
          <div className="card" style={{ marginBottom: '32px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 85, 184, 0.08)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0d233a' }}>
                    Customer Behavioral Trends Across Swarm Agents
                  </h2>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '100px' }}>
                    14-Day Simulation Window
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Select a behavioral category below to inspect trend trajectory, volatility, and backer perception data synthesized from MiroFish agent interactions.
                </p>
              </div>

              {/* Trend Selector Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {trendTabs.map(tab => {
                  const isActive = activeTrendKey === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTrendKey(tab.key)
                        setHoveredPoint(null)
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '20px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        border: isActive ? '1.5px solid #0055b8' : '1px solid #cbd5e1',
                        background: isActive ? '#eff6ff' : '#ffffff',
                        color: isActive ? '#0055b8' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chart Body Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0', borderBottom: '1px solid var(--border)' }}>
              {/* Primary Interactive SVG Graph */}
              <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border)', background: '#ffffff', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                      {currentTrend?.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#0d233a' }}>
                        {currentTrend?.current ?? 68.5}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '100px',
                          background: (currentTrend?.change ?? 0) >= 0 ? '#dcfce7' : '#fee2e2',
                          color: (currentTrend?.change ?? 0) >= 0 ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {(currentTrend?.change ?? 0) >= 0 ? `+${currentTrend?.change}%` : `${currentTrend?.change}%`} (14d)
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right', maxWidth: '280px' }}>
                    {currentTrend?.description}
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={currentTrend?.color || '#0055b8'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={currentTrend?.color || '#0055b8'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Guideline lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pctStep, idx) => {
                      const y = chartHeight - paddingY - pctStep * usableHeight
                      const labelVal = Math.round(minVal + pctStep * valRange)
                      return (
                        <g key={idx}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.2"
                            strokeDasharray={pctStep === 0 ? undefined : '4 4'}
                          />
                          <text
                            x={paddingX - 8}
                            y={y + 4}
                            fontSize="10"
                            fill="#94a3b8"
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            {labelVal}
                          </text>
                        </g>
                      )
                    })}

                    {/* Area fill */}
                    {areaD && <path d={areaD} fill="url(#trendGradient)" />}

                    {/* Main Trend Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={currentTrend?.color || '#0055b8'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Interactive Data Nodes */}
                    {trendPoints.map((point, idx) => {
                      const { x, y } = getCoordinates(idx, point.value)
                      const isHovered = hoveredPoint?.day === point.day
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke={currentTrend?.color || '#0055b8'}
                            strokeWidth={isHovered ? 3 : 2}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={() => setHoveredPoint({ day: point.day, value: point.value, x, y })}
                          />
                          {/* X-axis day labels (alternate for clean spacing) */}
                          {idx % 2 === 0 && (
                            <text
                              x={x}
                              y={chartHeight - 6}
                              fontSize="10"
                              fill="#94a3b8"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {point.day}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </svg>

                  {/* Tooltip Overlay */}
                  {hoveredPoint && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                        top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                        transform: 'translate(-50%, -120%)',
                        background: '#0d233a',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                      }}
                    >
                      <div style={{ color: '#93c5fd', fontSize: '10px' }}>{hoveredPoint.day}</div>
                      <div>
                        Score: <strong>{hoveredPoint.value}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swarm Multi-Agent Reasoning Panel */}
              <div style={{ padding: '24px 20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '18px' }}>🤖</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0d233a' }}>
                      MiroFish Agent Verdicts
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: '#334155' }}>Risk Analyst α</strong>
                        <span style={{ color: '#059669', fontWeight: 700 }}>78.4 / 100</span>
                      </div>
                      <div className="progress-track" style={{ height: '5px' }}>
                        <div className="progress-fill" style={{ width: '78.4%', background: '#059669' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Low peril default correlation across bakery & salon types.</div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: '#334155' }}>Community Pulse β</strong>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>82.1 / 100</span>
                      </div>
                      <div className="progress-track" style={{ height: '5px' }}>
                        <div className="progress-fill" style={{ width: '82.1%', background: '#2563eb' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Strong repeat customer footfall signaled on social graphs.</div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: '#334155' }}>Guidewire Compliance δ</strong>
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>91.0 / 100</span>
                      </div>
                      <div className="progress-track" style={{ height: '5px' }}>
                        <div className="progress-fill" style={{ width: '91%', background: '#7c3aed' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>100% adherence to Commercial Peril Rating schedules.</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af' }}>
                  💡 <strong>Investor Tip:</strong> Campaigns with &gt;75% Swarm Consensus qualify for accelerated Guidewire PolicyCenter auto-binding.
                </div>
              </div>
            </div>

            {/* Investor Cohort Sentiment Breakdown */}
            <div style={{ padding: '20px 24px', background: '#fafbfc' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
                Investor Cohort Behavioral Sentiment Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: '13.5px' }}>🎓 Alumni Backers</span>
                    <span style={{ fontWeight: 800, color: '#0d233a', fontSize: '14px' }}>74%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Avg Pledge Intent: ₹12,500</div>
                  <div className="progress-track" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-fill" style={{ width: '74%', background: '#7c3aed' }} />
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '13.5px' }}>🎒 Student Micro-Pledgers</span>
                    <span style={{ fontWeight: 800, color: '#0d233a', fontSize: '14px' }}>68%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Avg Pledge Intent: ₹2,400</div>
                  <div className="progress-track" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-fill" style={{ width: '68%', background: '#dc2626' }} />
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#0055b8', fontSize: '13.5px' }}>🏪 Local Retail Patrons</span>
                    <span style={{ fontWeight: 800, color: '#0d233a', fontSize: '14px' }}>82%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Avg Pledge Intent: ₹7,800</div>
                  <div className="progress-track" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-fill" style={{ width: '82%', background: '#0055b8' }} />
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#ea580c', fontSize: '13.5px' }}>🏛️ Faculty & Sponsors</span>
                    <span style={{ fontWeight: 800, color: '#0d233a', fontSize: '14px' }}>88%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Avg Pledge Intent: ₹25,000</div>
                  <div className="progress-track" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-fill" style={{ width: '88%', background: '#ea580c' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Customer Draft Pipeline with Guidewire Previews ────────── */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d233a' }}>
                Pre-Launch Campaigns in Drafting & Underwriting
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Examine preliminary Guidewire underwriting terms, peril quotes, and customer behavioral metrics before campaigns go live.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All Drafts' },
                { id: 'approved', label: 'Underwriting Approved' },
                { id: 'manual_review', label: 'In Review' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedFilter === f.id ? '#0055b8' : '#cbd5e1',
                    background: selectedFilter === f.id ? '#0055b8' : '#ffffff',
                    color: selectedFilter === f.id ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Draft Campaign Grid */}
          {filteredDrafts.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div className="empty-icon"><BuildingIcon size={40} color="var(--text-muted)" /></div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>No campaigns matching filter</h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
                All campaigns have cleared the drafting layer or switch filters to see other states.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredDrafts.map(c => {
                const quote = c.underwriting_preview
                const isApproved = quote.decision === 'approved'
                const isReview = quote.decision === 'manual_review'

                return (
                  <div
                    key={c.id}
                    className="card campaign-card"
                    style={{
                      borderTop: `4px solid ${isApproved ? '#16a34a' : isReview ? '#f59e0b' : '#dc2626'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="card-body">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div className="outlet-icon-badge">
                            <OutletIcon type={c.outlet_type} size={22} color="#0055b8" />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0055b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {c.outlet_type} • {c.city}
                            </div>
                            <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0d233a', lineHeight: 1.3 }}>
                              {c.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '100px',
                            textTransform: 'uppercase',
                            background: isApproved ? '#dcfce7' : isReview ? '#fef3c7' : '#fee2e2',
                            color: isApproved ? '#15803d' : isReview ? '#b45309' : '#b91c1c',
                            border: `1px solid ${isApproved ? '#bbf7d0' : isReview ? '#fde68a' : '#fecaca'}`,
                          }}
                        >
                          {quote.decision.replace('_', ' ')}
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.story || 'Pre-launch draft undergoing Guidewire commercial peril underwriting inspection.'}
                      </p>

                      {/* Guidewire Underwriting Policy Quote Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '12px 14px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#0055b8', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                          <ShieldCheckIcon size={14} color="#0055b8" />
                          Guidewire PolicyCenter Quote Preview
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Underwriting Rate</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d233a' }}>
                              {quote.base_rate}% <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 400 }}>p.a.</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Est. Annual Premium</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d233a' }}>
                              {formatINR(quote.premium_estimate)}
                            </div>
                          </div>
                        </div>

                        {/* Covered Perils Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {quote.coverage.slice(0, 3).map((cov, i) => (
                            <span key={i} style={{ fontSize: '10.5px', background: '#eff6ff', color: '#1e40af', padding: '2px 7px', borderRadius: '4px', fontWeight: 500 }}>
                              ✓ {cov}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Capital Metrics */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px' }}>Target Raise: </span>
                          <strong style={{ color: '#0f172a' }}>{formatINR(c.target_amount)}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px' }}>Area: </span>
                          <strong style={{ color: '#0f172a' }}>{c.area_sqft || 1200} sq.ft</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ padding: '12px 20px', background: '#fafbfc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openCampaignDetail(c.id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #0055b8',
                          background: '#ffffff',
                          color: '#0055b8',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Deep-Dive Behaviors 🔍
                      </button>

                      <button
                        onClick={() => handleSignalInterest(c.title)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#0055b8',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0, 85, 184, 0.25)',
                        }}
                      >
                        Back Early ⚡
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Toast Alert for Early Backer Action */}
          {pledgeIntentSuccess && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                maxWidth: '460px',
                background: '#0d233a',
                color: '#ffffff',
                borderLeft: '5px solid #22c55e',
                borderRadius: '8px',
                padding: '16px 20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                fontSize: '13.5px',
                zIndex: 9999,
                animation: 'slideUp 0.3s ease',
              }}
            >
              <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: '4px' }}>✓ Backer Intent Captured!</div>
              <div style={{ color: '#e2e8f0' }}>{pledgeIntentSuccess}</div>
            </div>
          )}

          {/* ── Modal / Drawer: Granular Campaign Behaviors ───────────────────── */}
          {selectedCampaignId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
              }}
              onClick={() => setSelectedCampaignId(null)}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '780px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  padding: '28px',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedCampaignId(null)}
                  style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>

                {loadingBehaviors ? (
                  <div className="spinner-wrap" style={{ minHeight: '300px' }}>
                    <div className="spinner" />
                  </div>
                ) : campaignBehaviors ? (
                  <div>
                    {/* Modal Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0055b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Guidewire Underwriting & MiroFish Swarm Diagnostic
                      </span>
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0d233a', marginBottom: '10px' }}>
                      {campaignBehaviors.campaign.title}
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '22px' }}>
                      {campaignBehaviors.campaign.outlet_type.toUpperCase()} in {campaignBehaviors.campaign.city} • Target: {formatINR(campaignBehaviors.campaign.target_amount)}
                    </p>

                    {/* Underwriting Breakdown Card */}
                    <div style={{ background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '14px' }}>
                          🏛️ Guidewire PolicyCenter Decision: <span style={{ textTransform: 'uppercase' }}>{campaignBehaviors.underwriting_preview.decision}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#0055b8', fontSize: '16px' }}>
                          Rate: {campaignBehaviors.underwriting_preview.base_rate}%
                        </div>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                        Estimated Commercial Premium: <strong>{formatINR(campaignBehaviors.underwriting_preview.premium_estimate)}</strong>. Coverage applies across Fire, Business Interruption, Machinery Breakdown, and Third-Party Bodily Liability.
                      </div>
                    </div>

                    {/* Risk Peril Matrix */}
                    <div style={{ marginBottom: '22px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Peril Probability Breakdown (Actuarial Model)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span>Fire & Explosion Risk:</span>
                            <strong>{campaignBehaviors.risk_matrix.fire_risk}%</strong>
                          </div>
                          <div className="progress-track" style={{ height: '5px', marginTop: '6px' }}>
                            <div className="progress-fill" style={{ width: `${campaignBehaviors.risk_matrix.fire_risk}%`, background: '#dc2626' }} />
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span>Business Interruption:</span>
                            <strong>{campaignBehaviors.risk_matrix.business_interruption_risk}%</strong>
                          </div>
                          <div className="progress-track" style={{ height: '5px', marginTop: '6px' }}>
                            <div className="progress-fill" style={{ width: `${campaignBehaviors.risk_matrix.business_interruption_risk}%`, background: '#f59e0b' }} />
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span>Equipment Failure:</span>
                            <strong>{campaignBehaviors.risk_matrix.equipment_risk}%</strong>
                          </div>
                          <div className="progress-track" style={{ height: '5px', marginTop: '6px' }}>
                            <div className="progress-fill" style={{ width: `${campaignBehaviors.risk_matrix.equipment_risk}%`, background: '#2563eb' }} />
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span>Public Liability Peril:</span>
                            <strong>{campaignBehaviors.risk_matrix.liability_risk}%</strong>
                          </div>
                          <div className="progress-track" style={{ height: '5px', marginTop: '6px' }}>
                            <div className="progress-fill" style={{ width: `${campaignBehaviors.risk_matrix.liability_risk}%`, background: '#059669' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MiroFish Agent Consensus Specific to Campaign */}
                    <div style={{ marginBottom: '22px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        MiroFish Agent Diagnostic Scores
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                        {campaignBehaviors.mirofish_agents.map((ag, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{ag.agent}</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0055b8', margin: '4px 0' }}>{ag.score}%</div>
                            <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 600 }}>{ag.verdict}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Modal Action CTA */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                      <button
                        onClick={() => {
                          handleSignalInterest(campaignBehaviors.campaign.title)
                          setSelectedCampaignId(null)
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 18px',
                          borderRadius: '8px',
                          background: '#0055b8',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 85, 184, 0.3)',
                        }}
                      >
                        Signal Priority Backer Interest ⚡
                      </button>
                      <button
                        onClick={() => setSelectedCampaignId(null)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
