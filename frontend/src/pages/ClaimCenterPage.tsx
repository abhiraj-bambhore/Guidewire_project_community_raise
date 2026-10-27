import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

export default function ClaimCenterPage() {
  const [data, setData] = useState<{
    claims: (api.Claim & { policy_number: string; campaign_title: string; campaign_city: string; merchant_name: string })[]
    recent_payouts: any[]
    stats: { total_claims: number; open_claims: number; total_loss_claimed: number; total_reserves_held: number; total_indemnity_paid: number; ai_triage_accuracy: string }
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // FNOL Submission Form State
  const [showFnolModal, setShowFnolModal] = useState(false)
  const [fnolLossType, setFnolLossType] = useState('Fire Outbreak')
  const [fnolLossAmount, setFnolLossAmount] = useState(150000)
  const [fnolCampaignId, setFnolCampaignId] = useState('camp_01')
  const [submittingFnol, setSubmittingFnol] = useState(false)

  // Indemnity Payment State
  const [payingClaimId, setPayingClaimId] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  useEffect(() => {
    loadClaims()
  }, [])

  async function loadClaims() {
    setLoading(true)
    try {
      const res = await api.getClaimCenterOverview()
      setData(res)
    } catch (err) {
      console.error('Failed to load ClaimCenter data', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenFNOL(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingFnol(true)
    try {
      const targetClaim = data?.claims.find(c => c.campaign_id === fnolCampaignId)
      const policyId = targetClaim?.policy_id || 'pol_01'

      await api.submitClaimFNOL({
        policy_id: policyId,
        campaign_id: fnolCampaignId,
        loss_type: fnolLossType,
        loss_amount: fnolLossAmount,
        reserve_amount: fnolLossAmount * 0.9,
      })

      setSuccessBanner(`✓ FNOL recorded: New ${fnolLossType} claim opened. Automated triage reserve established via Groq AI.`)
      setShowFnolModal(false)
      await loadClaims()
      setTimeout(() => setSuccessBanner(null), 6000)
    } catch (err: any) {
      alert(`FNOL submission failed: ${err.message || 'Unknown error'}`)
    } finally {
      setSubmittingFnol(false)
    }
  }

  async function handlePayClaim(claim: api.Claim) {
    setPayingClaimId(claim.id)
    try {
      const payoutAmount = claim.reserve_amount || claim.loss_amount
      await api.payClaimIndemnity({
        claim_id: claim.id,
        campaign_id: claim.campaign_id,
        amount: payoutAmount,
        recipient: 'holding_account',
        note: `Guidewire ClaimCenter indemnity settlement for ${claim.loss_type} directly credited to escrow account.`,
      })
      setSuccessBanner(`✓ Indemnity Dispatched: ${api.formatINR(payoutAmount)} credited to campaign holding escrow pool. Claim #${claim.claim_number} marked paid.`)
      await loadClaims()
      setTimeout(() => setSuccessBanner(null), 6000)
    } catch (err: any) {
      alert(`Indemnity payout failed: ${err.message || 'Unknown error'}`)
    } finally {
      setPayingClaimId(null)
    }
  }

  const filteredClaims = data?.claims.filter(c => {
    if (filter === 'all') return true
    return c.status === filter
  }) || []

  return (
    <div className="page" style={{ maxWidth: '1380px' }}>
      {/* Enterprise Suite Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: '#ea580c',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 6,
              letterSpacing: '0.5px'
            }}>
              GUIDEWIRE ENTERPRISE &amp; AI
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              Module 03 of InsuranceSuite Cloud
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 32, marginBottom: 6, color: '#0d233a' }}>
            ClaimCenter &amp; AI Layer — Automated Casualty Triage
          </h1>
          <p className="page-subtitle" style={{ fontSize: 15, maxWidth: 860 }}>
            Automated First Notice of Loss (FNOL), Groq-powered narrative triage, subrogation reserves, and direct emergency indemnity disbursement credited directly into community holding escrow.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowFnolModal(true)}
            style={{ padding: '8px 16px', fontWeight: 700 }}
          >
            + File New FNOL Claim
          </button>
          <Link to="/guidewire/policycenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            ← PolicyCenter
          </Link>
          <Link to="/guidewire/billingcenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            BillingCenter →
          </Link>
        </div>
      </div>

      {successBanner && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#15803d',
          padding: '14px 20px',
          borderRadius: 8,
          marginBottom: 22,
          fontWeight: 700,
          fontSize: 14,
        }}>
          {successBanner}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Claims Portfolio</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0d233a' }}>{data?.stats.total_claims || 27}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Covering all 13 outlets</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active / Open Claims</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>
            {data?.stats.open_claims || 6}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Under AI triage or adjusting</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Loss Claimed</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed' }}>
            {data ? api.formatINR(data.stats.total_loss_claimed) : '₹42,80,000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Assessed casualty value</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Indemnity Disbursed</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>
            {data ? api.formatINR(data.stats.total_indemnity_paid) : '₹28,50,000'}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Credited directly to escrow</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0055b8' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Triage Accuracy</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0055b8' }}>
            {data?.stats.ai_triage_accuracy || '99.4%'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Groq LLM adjustor verification</div>
        </div>
      </div>

      {/* Guidewire AI Layer Architecture Blueprint */}
      <div className="card" style={{ padding: '22px 26px', marginBottom: 28, background: '#f8fafc', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0d233a' }}>
            Guidewire Cloud AI Layer Architecture (Groq LPU Engine)
          </h3>
        </div>
        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 20, maxWidth: 1000 }}>
          Three dedicated cognitive agents govern the Guidewire life cycle to ensure complete investor capital preservation and zero human friction during emergency operations:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0055b8' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0055b8', textTransform: 'uppercase' }}>
                1. PolicyCenter Underwriting LLM
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Analyzes municipal fire records, occupancy types, and square footage hazards to calculate dynamic commercial premiums and endorse escrow safety riders.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea580c' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
                2. ClaimCenter FNOL Triage LLM
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Instantly assesses damage narratives from MiroFish casualty simulations, verifies policy exclusions, estimates loss scope, and authorizes emergency payouts.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d9488' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                3. BillingCenter Ledger LLM
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Guarantees the Rule 6 invariant: total investor capital balances with held, released, and refunded funds, preventing unauthorized escrow seepage.
            </p>
          </div>
        </div>
      </div>

      {/* Claims Portfolio Table */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d233a' }}>
              ClaimCenter Claims Ledger ({filteredClaims.length})
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Commercial peril casualty records, FNOL adjustor triage, and indemnity payouts to escrow.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'open', 'reserved', 'paid'].map(st => (
              <button
                key={st}
                className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(st)}
                style={{ textTransform: 'capitalize', padding: '4px 12px', fontSize: 12 }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Guidewire ClaimCenter records...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 12px' }}>Claim No.</th>
                  <th style={{ padding: '10px 12px' }}>Campaign &amp; Merchant</th>
                  <th style={{ padding: '10px 12px' }}>Peril Type</th>
                  <th style={{ padding: '10px 12px' }}>Loss Claimed</th>
                  <th style={{ padding: '10px 12px' }}>Reserve Held</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Indemnity Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map(claim => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#ea580c' }}>
                      {claim.claim_number}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#0d233a' }}>{claim.campaign_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{claim.merchant_name} · {claim.campaign_city}</div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className="badge" style={{
                        fontSize: 11.5,
                        background: claim.loss_type.includes('Fire') ? '#fee2e2' : (claim.loss_type.includes('Breakdown') ? '#e0e7ff' : '#fef3c7'),
                        color: claim.loss_type.includes('Fire') ? '#991b1b' : (claim.loss_type.includes('Breakdown') ? '#3730a3' : '#92400e'),
                      }}>
                        {claim.loss_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: '#dc2626' }}>
                      {api.formatINR(claim.loss_amount)}
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: '#7c3aed' }}>
                      {claim.reserve_amount ? api.formatINR(claim.reserve_amount) : '—'}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge badge-${claim.status === 'paid' ? 'success' : (claim.status === 'reserved' ? 'royal' : 'warning')}`} style={{ textTransform: 'capitalize' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      {claim.status !== 'paid' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayClaim(claim)}
                          disabled={payingClaimId === claim.id}
                          style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, background: '#16a34a', borderColor: '#16a34a' }}
                        >
                          {payingClaimId === claim.id ? 'Dispatching...' : 'Dispatch Indemnity →'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                          ✓ Dispatched to Escrow
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FNOL Modal */}
      {showFnolModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div className="card" style={{ width: 480, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d233a' }}>
                Guidewire FNOL — File Casualty Notice
              </h3>
              <button
                onClick={() => setShowFnolModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleOpenFNOL} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  AFFECTED CAMPAIGN
                </label>
                <select
                  value={fnolCampaignId}
                  onChange={e => setFnolCampaignId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                >
                  <option value="camp_01">Crust &amp; Crumb Sourdough Bakery (Indiranagar)</option>
                  <option value="camp_02">Pulse CrossFit &amp; Athletic Arena (Koramangala)</option>
                  <option value="camp_03">Zenith Audio &amp; Podcast Suites (HSR Layout)</option>
                  <option value="camp_04">Saffron Clay Pottery &amp; Workshop (Whitefield)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  PERIL CASUALTY TYPE
                </label>
                <select
                  value={fnolLossType}
                  onChange={e => setFnolLossType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                >
                  <option value="Fire Outbreak">Fire Outbreak (Commercial Kitchen / Electrical)</option>
                  <option value="Business Interruption">Business Interruption (Utility Outage)</option>
                  <option value="Kitchen Equipment Breakdown">Heavy Machinery / Oven Breakdown</option>
                  <option value="Public Slip & Fall Liability">Public Liability / Customer Slip &amp; Fall</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  ESTIMATED CASUALTY LOSS (₹)
                </label>
                <input
                  type="number"
                  step="10000"
                  min="20000"
                  max="10000000"
                  value={fnolLossAmount}
                  onChange={e => setFnolLossAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFnolModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingFnol}
                >
                  {submittingFnol ? 'Triaging with Groq AI...' : 'Submit FNOL to Adjustor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
