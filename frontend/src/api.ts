/**
 * API client — thin wrapper over fetch.
 * All endpoints proxy to /api (forwarded by Vite dev server to FastAPI on :8000).
 */

const BASE = '/api'
export { formatINR } from './utils'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Campaigns ──────────────────────────────────────────────────────────────

export const listCampaigns = (state?: string) =>
  request<{ campaigns: Campaign[] }>(`/campaigns${state ? `?state=${state}` : ''}`)

export const getCampaign = (id: string) =>
  request<{ campaign: Campaign }>(`/campaigns/${id}`)

export const getCampaignTimeline = (id: string) =>
  request<{ events: AuditEvent[] }>(`/campaigns/${id}/timeline`)

export const getCampaignInvestments = (id: string) =>
  request<{ investments: Investment[] }>(`/campaigns/${id}/investments`)

export const createCampaign = (body: CreateCampaignPayload) =>
  request<{ campaign: Campaign }>('/campaigns', { method: 'POST', body: JSON.stringify(body) })

export const submitUnderwriting = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/underwrite`, { method: 'POST' })

export const approveUnderwriting = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/approve`, { method: 'POST' })

export const markFunded = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/fund`, { method: 'POST' })

export const payPremium = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/pay-premium`, { method: 'POST' })

export const releaseTranche = (id: string, tranche: number) =>
  request<{ result: unknown }>(`/campaigns/${id}/release/${tranche}`, { method: 'POST' })

export const invest = (id: string, investor_id: string, amount: number) =>
  request<{ investment: Investment }>(`/campaigns/${id}/invest`, {
    method: 'POST',
    body: JSON.stringify({ investor_id, amount }),
  })

export const simulateLoss = (id: string, loss_type: string, loss_amount: number) =>
  request<{ result: unknown }>(`/campaigns/${id}/simulate-loss`, {
    method: 'POST',
    body: JSON.stringify({ loss_type, loss_amount }),
  })

export const failCampaign = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/fail`, { method: 'POST' })

export const pauseCampaign = (id: string) =>
  request<{ result: unknown }>(`/campaigns/${id}/pause`, { method: 'POST' })

// ── Investments ────────────────────────────────────────────────────────────

export const getInvestorInvestments = (investorId: string) =>
  request<{ investments: Investment[] }>(`/investments/investor/${investorId}`)

// ── Merchants & Investors ──────────────────────────────────────────────────

export const listMerchants = () =>
  request<{ merchants: Merchant[] }>('/merchants')

export const getMerchantCampaigns = (id: string) =>
  request<{ campaigns: Campaign[] }>(`/merchants/${id}/campaigns`)

export const listInvestors = () =>
  request<{ investors: Investor[] }>('/merchants/investors/list')

// ── Guidewire ──────────────────────────────────────────────────────────────

export const getPolicy = (campaignId: string) =>
  request<{ policy: Policy }>(`/guidewire/policy/${campaignId}`)

export const getInvoices = (campaignId: string) =>
  request<{ invoices: Invoice[] }>(`/guidewire/invoices/${campaignId}`)

export const getClaims = (campaignId: string) =>
  request<{ claims: Claim[] }>(`/guidewire/claims/${campaignId}`)

export const getPolicyCenterOverview = () =>
  request<{
    policies: (Policy & { campaign_title: string; campaign_city: string; target_amount: number; total_raised: number; merchant_name: string })[]
    stats: { total_policies: number; in_force_policies: number; pending_policies: number; total_insured_sum: number; avg_base_rate: string }
  }>('/guidewire/policycenter/all')

export const calculatePolicyQuote = (body: { campaign_id: string; outlet_type: string; insured_amount: number; area_sqft: number; has_fire_safety_cert: boolean }) =>
  request<{ quote: any }>('/guidewire/policycenter/quote', { method: 'POST', body: JSON.stringify(body) })

export const getBillingCenterOverview = () =>
  request<{
    invoices: (Invoice & { policy_number: string; campaign_title: string; merchant_name: string })[]
    recent_payments: any[]
    escrow_ledger: { total_investor_capital: number; holding_escrow_pool: number; disbursed_merchant_capital: number; insurance_reserve_balance: number }
    stats: { total_invoices: number; total_billed: number; total_collected: number; total_outstanding: number; collection_rate: string }
  }>('/guidewire/billingcenter/all')

export const payBillingInvoice = (invoice_id: string, amount: number, note?: string) =>
  request<{ payment: any; status: string }>('/guidewire/billingcenter/pay', {
    method: 'POST',
    body: JSON.stringify({ invoice_id, amount, note }),
  })

export const getClaimCenterOverview = () =>
  request<{
    claims: (Claim & { policy_number: string; campaign_title: string; campaign_city: string; merchant_name: string })[]
    recent_payouts: any[]
    stats: { total_claims: number; open_claims: number; total_loss_claimed: number; total_reserves_held: number; total_indemnity_paid: number; ai_triage_accuracy: string }
  }>('/guidewire/claimcenter/all')

export const submitClaimFNOL = (body: { policy_id: string; campaign_id: string; loss_type: string; loss_amount: number; reserve_amount?: number }) =>
  request<{ claim: Claim }>('/guidewire/claimcenter/fnol', { method: 'POST', body: JSON.stringify(body) })

export const payClaimIndemnity = (body: { claim_id: string; campaign_id: string; amount: number; recipient?: string; note?: string }) =>
  request<{ payment: any }>('/guidewire/claimcenter/pay-claim', { method: 'POST', body: JSON.stringify(body) })

export const simulatePerilDamage = (campaignId: string, peril: string) =>
  request<{
    simulation: {
      incident_headline: string
      severity: string
      gross_loss_estimate: number
      indemnity_payout: number
      business_impact_days: number
      guidewire_claimcenter_action: string
      mirofish_swarm_reaction: string
    }
    claim: Claim
    payout: any
  }>(`/campaigns/${campaignId}/simulate-peril`, {
    method: 'POST',
    body: JSON.stringify({ peril }),
  })

export const getCampaignTrading = (campaignId: string) =>
  request<{
    share_price: number
    share_price_change_pct: number
    high_24h: number
    low_24h: number
    volume_24h: number
    total_shares: number
    chart_ticks: { time: string; price: number; volume: number }[]
    recent_trades: { id: string; investor_name: string; shares: number; price: number; type: 'buy' | 'sell'; time: string }[]
    groq_prediction: {
      predicted_target_share_price: number
      growth_percentage: string
      trading_sentiment: string
      target_completion_days: number
      liquidity_score: string
      ai_rationale: string
    }
  }>(`/campaigns/${campaignId}/trading`)

export const executeCampaignTrade = (campaignId: string, shares: number, investor_name: string) =>
  request<{ result: any; trade: any }>(`/campaigns/${campaignId}/trade`, {
    method: 'POST',
    body: JSON.stringify({ shares, investor_name }),
  })

export const getNetworkGraph = (campaignId?: string) =>
  request<{
    nodes: { id: string; name: string; type: string; category: string; group: number; val: number; details?: string }[]
    links: { source: string; target: string; label: string; strength: number }[]
  }>(`/campaigns/${campaignId || 'all'}/network-graph`)

// ── Checker ────────────────────────────────────────────────────────────────

export const getAllViolations = () =>
  request<{ violations: Violation[] }>('/checker/violations')

export const getCampaignViolations = (id: string) =>
  request<{ violations: Violation[] }>(`/checker/violations/${id}`)

export const runChecker = (id: string) =>
  request<{ violations: Violation[] }>(`/checker/run/${id}`, { method: 'POST' })

export const injectFault = (id: string) =>
  request<{ result: unknown }>(`/checker/inject-fault/${id}`, { method: 'POST' })

export const fixFaults = (id: string) =>
  request<{ fixed_count: number }>(`/checker/fix-faults/${id}`, { method: 'POST' })

// ── Audit ──────────────────────────────────────────────────────────────────

export const getAllAuditEvents = (limit?: number) =>
  request<{ events: AuditEvent[] }>(`/audit/events${limit ? `?limit=${limit}` : ''}`)

export const getCampaignAuditEvents = (id: string) =>
  request<{ events: AuditEvent[] }>(`/audit/events/${id}`)

// ── Predictions ────────────────────────────────────────────────────────────

export const getPrediction = (id: string) =>
  request<{ prediction: Prediction }>(`/predictions/${id}`)

export const kickOffPrediction = (id: string) =>
  request<{ status: { status: string; campaign_id?: string; message?: string } }>(`/predictions/${id}/kick-off`, { method: 'POST' })

export const getPredictionStatus = (id: string) =>
  request<{ status: { status: string; result?: Prediction; error?: string } }>(`/predictions/${id}/status`)

// ── Types ──────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  merchant_id: string
  merchant_name?: string
  title: string
  story: string
  outlet_type: string
  state: string
  target_amount: number
  min_investment: number
  max_investment: number | null
  total_raised: number
  total_held: number
  total_released: number
  total_refunded: number
  insured_amount: number
  area_sqft: number
  has_fire_safety_cert: boolean
  city: string
  deadline: string | null
  created_at: string
}

export interface CreateCampaignPayload {
  merchant_id: string
  title: string
  story: string
  outlet_type: string
  target_amount: number
  min_investment: number
  max_investment?: number | null
  insured_amount?: number | null
  area_sqft: number
  has_fire_safety_cert: boolean
  city: string
}

export interface Investment {
  id: string
  campaign_id: string
  investor_id: string
  investor_name?: string
  amount: number
  status: string
  refunded_at: string | null
  created_at: string
  campaign_title?: string
  campaign_state?: string
  outlet_type?: string
  target_amount?: number
  total_raised?: number
}

export interface Merchant {
  id: string
  name: string
  email: string
  city: string
  created_at: string
}

export interface Investor {
  id: string
  name: string
  email: string
  city: string
}

export interface Policy {
  id: string
  campaign_id: string
  policy_number: string
  status: string
  outlet_type: string
  insured_amount: number
  premium_amount: number
  base_rate: number
  coverage_details: string
  underwriting_decision: string
  effective_date: string
  expiry_date: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: string
  due_date: string
  created_at: string
}

export interface Claim {
  id: string
  claim_number: string
  status: string
  loss_type: string
  loss_amount: number
  reserve_amount: number
  narrative?: string | null
  opened_at: string
}

export interface Violation {
  id: string
  campaign_id: string
  rule_number: number
  rule_name: string
  description: string
  ai_explanation: string
  severity: string
  resolved: boolean
  injected: boolean
  created_at: string
}

export interface AuditEvent {
  id: string
  campaign_id: string
  actor: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
  campaign_title?: string
}

export interface Prediction {
  funding_success_probability: number
  loss_event_likelihood: number
  sample_investor_sentiment: string
  scenario_summary: string
  source: string
  mirofish_running: boolean
  predicted_funding_success?: number
  predicted_default_risk?: number
}

// ── Drafting Layer Types ──────────────────────────────────────────────────

export interface BehavioralTrend {
  label: string
  description: string
  color: string
  current: number
  change: number
  data: { day: string; value: number }[]
}

export interface SwarmSummary {
  total_drafts: number
  approved_count: number
  review_count: number
  declined_count: number
  avg_premium_rate: number
  total_insured_value: number
  swarm_consensus: number
  agent_confidence: number
  behavioral_sentiment: string
}

export interface OutletDistribution {
  outlet_type: string
  count: number
  total_target: number
}

export interface DraftCampaign extends Campaign {
  underwriting_preview: {
    base_rate: number
    premium_estimate: number
    decision: string
    coverage: string[]
  }
}

export interface InvestorCohort {
  name: string
  sentiment: number
  avg_pledge: number
  count: number
  color: string
}

export interface MiroFishAgent {
  agent: string
  score: number
  verdict: string
}

export interface CampaignBehaviors {
  campaign: Campaign
  underwriting_preview: {
    base_rate: number
    premium_estimate: number
    decision: string
    coverage: string[]
  }
  investor_cohorts: InvestorCohort[]
  mirofish_agents: MiroFishAgent[]
  risk_matrix: {
    fire_risk: number
    business_interruption_risk: number
    equipment_risk: number
    liability_risk: number
  }
}

// ── Drafting Layer API ────────────────────────────────────────────────────

export const getDraftingLayer = () =>
  request<{
    draft_campaigns: DraftCampaign[]
    behavioral_trends: Record<string, BehavioralTrend>
    swarm_summary: SwarmSummary
    outlet_distribution: OutletDistribution[]
  }>('/drafting')

export const getCampaignBehaviors = (campaignId: string) =>
  request<CampaignBehaviors>(`/drafting/campaign/${campaignId}/behaviors`)

