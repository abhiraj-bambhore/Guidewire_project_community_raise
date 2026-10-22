-- Protected Community Raise – Initial Migration
-- Run once against your Supabase project.

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMs ────────────────────────────────────────────────────────────────────
CREATE TYPE outlet_type AS ENUM ('cafe','gym','bakery','salon','restaurant');
CREATE TYPE campaign_state AS ENUM (
  'draft','underwriting','live','funded','active',
  'under_claim','failed','paused','declined'
);
CREATE TYPE policy_status AS ENUM ('pending','in_force','cancelled','lapsed','declined');
CREATE TYPE invoice_status AS ENUM ('unpaid','paid','overdue');
CREATE TYPE claim_status AS ENUM ('open','reserved','paid','closed');
CREATE TYPE violation_severity AS ENUM ('warning','critical');

-- ─── Merchants ────────────────────────────────────────────────────────────────
CREATE TABLE merchants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  gst_number      TEXT,
  city            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Campaigns ────────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id             UUID REFERENCES merchants(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  story                   TEXT,
  outlet_type             outlet_type NOT NULL,
  state                   campaign_state NOT NULL DEFAULT 'draft',
  target_amount           NUMERIC(15,2) NOT NULL,
  min_investment          NUMERIC(15,2) NOT NULL DEFAULT 1000,
  max_investment          NUMERIC(15,2),
  total_raised            NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_held              NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_released          NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_refunded          NUMERIC(15,2) NOT NULL DEFAULT 0,
  insured_amount          NUMERIC(15,2) NOT NULL,
  area_sqft               NUMERIC(10,2) NOT NULL DEFAULT 0,
  has_fire_safety_cert    BOOLEAN NOT NULL DEFAULT FALSE,
  city                    TEXT NOT NULL,
  deadline                TIMESTAMPTZ,
  holding_account_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Investors ────────────────────────────────────────────────────────────────
CREATE TABLE investors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  phone      TEXT,
  city       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Investments ──────────────────────────────────────────────────────────────
CREATE TABLE investments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  investor_id   UUID REFERENCES investors(id) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | refunded
  refunded_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Escrow Receipts ──────────────────────────────────────────────────────────
CREATE TABLE escrow_receipts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id),
  amount        NUMERIC(15,2) NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Fund Releases ────────────────────────────────────────────────────────────
CREATE TABLE releases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  tranche     INT NOT NULL,            -- 1=50%, 2=25%, 3=25%
  amount      NUMERIC(15,2) NOT NULL,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  note        TEXT
);

-- ─── Refunds ──────────────────────────────────────────────────────────────────
CREATE TABLE refunds (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id),
  investor_id   UUID REFERENCES investors(id),
  amount        NUMERIC(15,2) NOT NULL,
  refunded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Events ─────────────────────────────────────────────────────────────
CREATE TABLE audit_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  actor       TEXT NOT NULL DEFAULT 'system',
  event_type  TEXT NOT NULL,
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ════════════════════════════════════════════════════
--     GUIDEWIRE MODULES
-- ─── ════════════════════════════════════════════════════

-- ─── PolicyCenter ─────────────────────────────────────────────────────────────
CREATE TABLE pc_policies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id         UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  policy_number       TEXT UNIQUE NOT NULL,
  status              policy_status NOT NULL DEFAULT 'pending',
  outlet_type         outlet_type NOT NULL,
  insured_amount      NUMERIC(15,2) NOT NULL,
  premium_amount      NUMERIC(15,2) NOT NULL,
  base_rate           NUMERIC(6,4) NOT NULL,
  coverage_details    JSONB DEFAULT '{}',
  underwriting_notes  TEXT,
  underwriting_decision TEXT,         -- 'approved' | 'manual_review' | 'declined'
  effective_date      DATE,
  expiry_date         DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pc_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id   UUID REFERENCES pc_policies(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,   -- quote_requested | policy_issued | policy_cancelled | lapsed
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BillingCenter ────────────────────────────────────────────────────────────
CREATE TABLE bc_invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id     UUID REFERENCES pc_policies(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount        NUMERIC(15,2) NOT NULL,
  status        invoice_status NOT NULL DEFAULT 'unpaid',
  due_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bc_payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES bc_invoices(id) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL,
  paid_at       TIMESTAMPTZ DEFAULT NOW(),
  note          TEXT
);

-- ─── ClaimCenter ──────────────────────────────────────────────────────────────
CREATE TABLE cc_claims (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id      UUID REFERENCES pc_policies(id) ON DELETE CASCADE,
  campaign_id    UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  claim_number   TEXT UNIQUE NOT NULL,
  status         claim_status NOT NULL DEFAULT 'open',
  loss_type      TEXT NOT NULL,         -- fire | equipment | business_interruption | liability
  loss_amount    NUMERIC(15,2) NOT NULL,
  reserve_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  narrative      TEXT,
  opened_at      TIMESTAMPTZ DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cc_reserves (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id   UUID REFERENCES cc_claims(id) ON DELETE CASCADE,
  amount     NUMERIC(15,2) NOT NULL,
  set_at     TIMESTAMPTZ DEFAULT NOW(),
  note       TEXT
);

CREATE TABLE cc_claim_payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id      UUID REFERENCES cc_claims(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL,
  recipient     TEXT NOT NULL DEFAULT 'holding_account',
  paid_at       TIMESTAMPTZ DEFAULT NOW(),
  note          TEXT
);

-- ─── Safety Checker Violations ────────────────────────────────────────────────
CREATE TABLE checker_violations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  rule_number INT NOT NULL,
  rule_name   TEXT NOT NULL,
  description TEXT,
  ai_explanation TEXT,
  severity    violation_severity NOT NULL DEFAULT 'critical',
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  injected    BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE if created by "Inject fault"
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_investments_campaign ON investments(campaign_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_escrow_campaign ON escrow_receipts(campaign_id);
CREATE INDEX idx_releases_campaign ON releases(campaign_id);
CREATE INDEX idx_refunds_campaign ON refunds(campaign_id);
CREATE INDEX idx_audit_campaign ON audit_events(campaign_id);
CREATE INDEX idx_pc_policies_campaign ON pc_policies(campaign_id);
CREATE INDEX idx_bc_invoices_campaign ON bc_invoices(campaign_id);
CREATE INDEX idx_cc_claims_campaign ON cc_claims(campaign_id);
CREATE INDEX idx_violations_campaign ON checker_violations(campaign_id);
CREATE INDEX idx_violations_resolved ON checker_violations(resolved);

-- ─── Triggers: keep campaigns.updated_at fresh ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pc_policies_updated_at
  BEFORE UPDATE ON pc_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cc_claims_updated_at
  BEFORE UPDATE ON cc_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
