/**
 * API client — thin wrapper over fetch.
 * All endpoints proxy to /api (forwarded by Vite dev server to FastAPI on :8000).
 */

const BASE = '/api'

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
}
