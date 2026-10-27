# Protected Community Raise: Guidewire InsuranceSuite & MiroFish Swarm Platform

[![Guidewire PolicyCenter](https://img.shields.io/badge/Guidewire-PolicyCenter%20%7C%20BillingCenter%20%7C%20ClaimCenter-0055b8?style=for-the-badge)](https://www.guidewire.com/)
[![MiroFish Swarm](https://img.shields.io/badge/MiroFish-Multi--Agent%20Swarm%20Intelligence-7c3aed?style=for-the-badge)](./mirofish)
[![FastAPI](https://img.shields.io/badge/FastAPI-Async%20Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React%2019-Vite%20%2B%20TypeScript-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

> **Protected Community Raise** is a community crowdfunding platform engineered with **Guidewire-style property & casualty insurance protection**, an interactive **Customer Drafting Layer**, and the **MiroFish multi-agent swarm intelligence engine**. It enables local brick-and-mortar merchants (cafes, bakeries, gyms, salons, restaurants) to raise compliant expansion capital directly from their own customers, while systematically eliminating backer capital loss from commercial disasters.

---

## 📌 Table of Contents

1. [Elaborated Problem Statement](#-elaborated-problem-statement)
   - [The Honeycomb Credit Vision for India](#the-honeycomb-credit-vision-for-india)
   - [The Fatal Vulnerability: Unmitigated Peril Risk](#the-fatal-vulnerability-unmitigated-peril-risk)
   - [The Concurrency & Ledger Integrity Dilemma](#the-concurrency--ledger-integrity-dilemma)
   - [The Three-Pillar Solution](#the-three-pillar-solution)
2. [High-Level Architecture & Block Diagrams](#-high-level-architecture--block-diagrams)
   - [System Architecture (5-Block Diagram)](#system-architecture-5-block-diagram)
   - [Campaign Lifecycle & State Machine](#campaign-lifecycle--state-machine)
   - [Customer Drafting Layer & MiroFish Behavioral Flow](#customer-drafting-layer--mirofish-behavioral-flow)
   - [Guidewire Claim & Escrow Indemnity Settlement Flow](#guidewire-claim--escrow-indemnity-settlement-flow)
3. [Guidewire InsuranceSuite Implementation](#-guidewire-insurancesuite-implementation)
   - [PolicyCenter & Custom Tailored Coverages](#1-guidewire-policycenter)
   - [BillingCenter & Premium Invoicing](#2-guidewire-billingcenter)
   - [ClaimCenter & FNOL Indemnity Recovery](#3-guidewire-claimcenter)
4. [MiroFish Multi-Agent Swarm Intelligence](#-mirofish-multi-agent-swarm-intelligence)
   - [God's-Eye Digital Sandbox](#why-mirofish-swarm-intelligence)
   - [The 5 Customer Behavioral Trend Dimensions](#the-5-customer-behavioral-trend-dimensions)
   - [Synthetic Investor Cohort Modeling](#synthetic-investor-cohort-breakdown)
5. [Customer Drafting Layer & Pre-Launch Lab](#-customer-drafting-layer--pre-launch-lab)
6. [The Continuous Safety Checker (8 System Invariants)](#-the-continuous-safety-checker-8-system-invariants)
7. [Tech Stack & Project Directory Structure](#-tech-stack--directory-structure)
8. [Setup & Quickstart Guide](#-setup--quickstart-guide)
9. [Interactive Demo Script (5-Minute Walkthrough)](#-interactive-demo-script-5-minute-walkthrough)
10. [Legal & Regulatory Disclosures](#-legal--risk-disclosure)

---

## 📖 Elaborated Problem Statement

### The Honeycomb Credit Vision for India

In the United States and Europe, platforms like **Honeycomb Credit** pioneered community loan funding for main-street small businesses. Instead of taking on predatory bank loans, local businesses borrow directly from their regular customers.

Consider what this looks like in the Indian and emerging retail landscape:
- **The Scenario**: Your favorite neighborhood sourdough bakery or fitness gym wants to open a second outlet in an adjoining suburb. They need **₹50 Lakh** to sign the lease, complete architectural fit-outs, and buy industrial ovens or gym rigs.
- **The Traditional Barrier**: Commercial banks require 100% tangible asset collateral, personal home mortgages, months of bureaucratic paperwork, and charge punishing interest rates of 14% to 18%.
- **The Community Alternative**: The bakery asks its own patrons: *"500 of our loyal customers invest ₹10,000 each."* The raise is fully subscribed in two weeks.
- **The Loyalty Flywheel**: The economic incentives are transformative:
  > *"When your friend says 'Let's grab breakfast at a corporate chain,' you immediately reply: 'No way — I invested ₹10,000 into our local bakery downstairs. We are eating there.' Customers become active ambassadors and lifelong brand evangelists."*

---

### The Fatal Vulnerability: Unmitigated Peril Risk

While community crowdfunding sounds inspiring, it suffers from a **catastrophic single point of failure**:
1. **Unaccredited Backers Bear Equity/Debt Risk**: Unlike venture capitalists or institutional lenders who diversify across hundreds of bets, a local customer investing ₹10,000 or ₹25,000 is investing hard-earned household savings.
2. **Physical Commercial Disasters**: Brick-and-mortar retail outlets operate in high-hazard physical environments:
   - A bakery can suffer a combustible flour dust explosion or oven flare-up.
   - A gym can experience a major water main burst or heavy rig motor burnout.
   - A cafe or restaurant can experience a grease duct flue fire or walk-in freezer compressor failure that spoils ₹5,00,000 of fresh stock and triggers food safety closures.
3. **The Human Consequence**: When an uninsured outlet is destroyed or shut down for six months, 500 loyal neighbors lose 100% of their money. Community pride curtails into public outrage, betrayal, protests, and bankruptcy.

---

### The Concurrency & Ledger Integrity Dilemma

Crowdfunding platforms are not static blogs — they are **complex, multi-stream financial networks** where multiple asynchronous transactions happen simultaneously:
1. **Investor Stream**: Hundreds of micro-pledges arrive in real-time, requiring escrow custody.
2. **Insurance Underwriting Stream**: Policies must be quoted, actuarially rated, and bound in lockstep with campaign capital milestones.
3. **Billing Stream**: Premium invoices must be generated, collected, and reconciled before merchant capital is released.
4. **Disbursement Stream**: Capital must be released in milestone tranches (e.g., 50% upfront for fit-out, 25% upon opening, 25% upon 90 days operating stability).
5. **Loss Claim Stream**: If an incident occurs, insurance claim indemnities must flow into holding escrow to reimburse backers, rather than getting diverted into merchant pockets.

**The Risk**: If even a single software error occurs — an invoice recorded as paid when it was not, a tranche released without an active policy, or a claim paid directly to a merchant who is about to default — investor money vanishes, and trust collapses.

---

### The Three-Pillar Solution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROTECTED COMMUNITY RAISE                             │
├─────────────────────┬─────────────────────────────┬─────────────────────────┤
│    1. ESCROW RAISE  │   2. GUIDEWIRE PROTECTION   │   3. SAFETY & SWARM     │
│  Collects micro-    │  PolicyCenter quotes &      │  MiroFish swarm models  │
│  investments safely │  customizes coverage;       │  trends; Checker        │
│  and disburses in   │  BillingCenter invoices;    │  continuously verifies  │
│  milestone tranches.│  ClaimCenter settles losses.│  8 ledger invariants.   │
└─────────────────────┴─────────────────────────────┴─────────────────────────┘
```

---

## 🏛️ High-Level Architecture & Block Diagrams

### System Architecture (5-Block Diagram)

```mermaid
graph TD
    subgraph Block1["1. WEB CLIENT & DASHBOARDS"]
        UI1["Campaigns Explorer & Detail"]
        UI2["Customer Drafting Layer & Underwriting Lab"]
        UI3["Merchant Hub & Loss Simulator"]
        UI4["Safety Checker & Audit Ledger"]
        UI5["MiroFish Knowledge Graph Visualizer"]
    end

    subgraph Block2["2. CAMPAIGN & ESCROW ENGINE (FastAPI)"]
        API["FastAPI Application Gateway"]
        SVC["Campaign & Investment Services"]
        ESC["Safe Holding Escrow & Tranche Manager"]
        DB[(PostgreSQL / Supabase Ledger)]
    end

    subgraph Block3["3. GUIDEWIRE INSURANCESUITE"]
        PC["PolicyCenter<br/>Actuarial Rating & Custom CPP"]
        BC["BillingCenter<br/>Premium Invoicing & Escrow Split"]
        CC["ClaimCenter<br/>FNOL Triage & Indemnity Settlement"]
    end

    subgraph Block4["4. MIROFISH SWARM INTELLIGENCE"]
        SANDBOX["Parallel Digital Sandbox"]
        AGENTS["Autonomous Swarm Agents<br/>(Risk-α, Pulse-β, Viability-γ, Compliance-δ)"]
        TRENDS["14-Day Behavioral Trend Synthesis"]
    end

    subgraph Block5["5. CONTINUOUS SAFETY CHECKER"]
        WORKER["APScheduler Background Auditor"]
        RULES["8 Invariant Integrity Verification"]
        FAULT["Fault Injector & Auto-Remediator"]
    end

    UI1 & UI2 & UI3 & UI4 & UI5 <==>|HTTP / JSON REST API| API
    API --> SVC
    SVC <--> ESC
    ESC <--> DB
    SVC <==>|Underwriting / Billing / Claims| Block3
    SVC <==>|Simulate Projections & Telemetry| Block4
    WORKER -->|Continuous Query Audit| DB
    WORKER --> RULES
    RULES -.->|Record Violations| DB
    FAULT -.->|Inject / Repair Discrepancies| DB
```

---

### Campaign Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : Merchant creates outlet profile

    Draft --> Underwriting : Submit for Guidewire evaluation
    Draft --> Draft : Customer Drafting Layer inspection

    state Underwriting {
        [*] --> ActuarialQuote : Calculate base rate + peril loadings
        ActuarialQuote --> Approved : Passes guidelines
        ActuarialQuote --> ManualReview : Uncertified & > ₹25L
        ActuarialQuote --> Declined : Unsupported outlet
    }

    Declined --> [*] : Campaign terminated
    ManualReview --> Approved : Underwriter manual override
    Approved --> Live : Campaign launched publicly

    Live --> Funded : 100% target reached before deadline
    Live --> Failed : Deadline passed without target

    Failed --> [*] : 100% investor money refunded (Rule 8)

    state Funded {
        [*] --> IssuePolicy : PolicyCenter binds in_force policy
        IssuePolicy --> PremiumInvoice : BillingCenter sends invoice
        PremiumInvoice --> PremiumPaid : Escrow pays premium
    }

    Funded --> Active : Premium confirmed (Tranche 1 released)

    Active --> UnderClaim : Peril incident occurs (Fire / Breakdown)
    UnderClaim --> Active : ClaimCenter settles loss to Escrow

    Active --> Paused : Policy lapses or cancelled (Rule 5)
    Paused --> Active : Coverage restored & invoice settled
```

---

### Customer Drafting Layer & MiroFish Behavioral Flow

The **Customer Drafting Layer** allows potential backers to evaluate pre-launch campaign drafts, examine actuarial quotes, and explore behavioral trends synthesized by MiroFish agents before investing.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Potential Investor
    participant UI as Drafting Layer UI
    participant Back as Drafting API Router
    participant PC as Guidewire PolicyCenter
    participant MF as MiroFish Swarm Engine

    Customer->>UI: Visits Customer Drafting Layer
    UI->>Back: GET /api/drafting
    Back->>PC: Query preliminary quote and customized peril package
    PC-->>Back: Returns quote, premium, decision, and coverage details
    Back->>MF: Pull 14-day agent swarm telemetry and consensus
    MF-->>Back: Returns investment intent, risk perception, cohorts
    Back-->>UI: Complete Drafting Snapshot Payload
    UI-->>Customer: Renders interactive SVG trends and campaign cards
    Customer->>UI: Clicks "Signal Priority Backer Interest"
    UI->>Back: Register early commitment intent in swarm ledger
    Back->>MF: Agent Pulse-Beta updates investor intent velocity
    Back-->>UI: 200 OK (Priority backer badge queued)
    UI-->>Customer: Shows success confirmation banner
```

---

### Guidewire Claim & Escrow Indemnity Settlement Flow

When disaster strikes an active outlet, investor capital is saved because insurance indemnities flow directly into the **Holding Escrow Account**, bypassing the merchant's private bank account.

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Outlet Owner
    participant CC as Guidewire ClaimCenter
    participant PC as Guidewire PolicyCenter
    participant ESC as Safe Holding Escrow Pool
    participant CHK as Continuous Safety Checker
    actor Backer as Community Backers

    Merchant->>CC: File FNOL (First Notice of Loss: Kitchen Fire Rs 12 Lakh)
    CC->>PC: Verify active in_force commercial peril coverage
    PC-->>CC: Policy verified (Fire and Perils endorsed)
    CC->>CC: AI triage calculates net indemnity and holds reserve
    CC->>ESC: Dispatches settlement payment of Rs 12 Lakh to Escrow
    Note over CC,ESC: Rule 4: Indemnity MUST credit named escrow, not merchant personal account
    CHK->>CHK: Runs Rule 4 and Rule 1 invariant check (PASS)
    ESC-->>Backer: Pro-rata investor equity and loss protected - capital intact
```

---

## 🏛️ Guidewire InsuranceSuite Implementation

The platform models Guidewire's industry-standard property & casualty insurance architecture across three core centers:

```
                      ┌───────────────────────────────────────────────┐
                      │          GUIDEWIRE INSURANCESUITE            │
                      └──────────────────────┬────────────────────────┘
                                             │
             ┌───────────────────────────────┼──────────────────────────────┐
             ▼                               ▼                              ▼
    ┌─────────────────┐             ┌─────────────────┐            ┌─────────────────┐
    │  PolicyCenter   │             │  BillingCenter  │            │   ClaimCenter   │
    │                 │             │                 │            │                 │
    │ • Actuarial     │             │ • Premium bills │            │ • FNOL triage   │
    │   risk rating   │             │ • Escrow ledger │            │ • Reserve fund  │
    │ • Underwriting  │             │ • Payment sync  │            │ • Indemnity     │
    │   rules engine  │             │ • Reconcile     │            │   settlement    │
    │ • Tailored CPP  │             │   invoices      │            │   to Escrow     │
    └─────────────────┘             └─────────────────┘            └─────────────────┘
```

### 1. Guidewire PolicyCenter

#### Actuarial Premium Determination
Premium is calculated dynamically based on merchant risk exposure:

`Annual Premium = Insured Amount × Base Rate × Safety Factor × Footprint Factor`

| Outlet Type | Base Premium Rate (% p.a.) | Risk Profile |
|:---|:---:|:---|
| **Salon & Wellness** | `0.30%` | Low physical peril, clean footfall |
| **Cafe & Espresso** | `0.35%` | Moderate thermal boiler hazards, high walk-in traffic |
| **Gym & CrossFit** | `0.45%` | High athletic bodily injury and motor machinery wear |
| **Artisanal Bakery** | `0.55%` | High thermal oven heat, combustible organic flour dust |
| **Commercial Restaurant** | `0.60%` | Heavy grease exhaust hoods, deep fryers, gas lines |

#### Underwriting Loading Rules
- **Fire Safety Certificate**: If absent, a **+20% premium surcharge** is applied (`Safety Factor = 1.20`).
- **Commercial Footprint**: If floor area exceeds 2,000 sq.ft., a **+10% umbrella surcharge** is applied (`Footprint Factor = 1.10`).
- **Manual Review Threshold**: If an outlet lacks a fire safety certificate and requests coverage exceeding **₹25,00,000**, automated binding is halted and the policy is routed to a human underwriter.

#### Tailored Commercial Package Policy (CPP) Coverages
Unlike generic policies, coverages are dynamically customized for each specific outlet type and risk profile:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMIZED OUTLET COVERAGES                           │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ 🥖 Bakery       │ • Commercial Hearth & Deck Oven Breakdown                 │
│                 │ • Raw Material & Cold Storage Spoilage Protection         │
│                 │ • Combustible Dust & Fire Special Perils                  │
│                 │ • Business Interruption (Supply Chain & Artisan Wheat)    │
│                 │ • Food Product Contamination & Public Liability           │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ ☕ Cafe         │ • Espresso Steam Boiler & Grinder Breakdown               │
│                 │ • Walk-In Milk & Dairy Perishable Spoilage                │
│                 │ • Roasting Exhaust & Special Fire Perils                  │
│                 │ • Customer Slip & Fall Public Premises Liability          │
│                 │ • Business Interruption (Walk-in Patronage Loss)          │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ 🏋️ Gym          │ • High-Intensity Athletic Rig & Motor Breakdown           │
│                 │ • Member Traumatic Injury & Premises Liability            │
│                 │ • Locker Room Pipe Burst & Water Ingress Peril            │
│                 │ • Business Interruption (Membership Continuity)           │
│                 │ • Professional Fitness Trainer Indemnity                  │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ 💇 Salon        │ • Cosmetic Chemical Treatment & Scalp Liability           │
│                 │ • Hydraulic Chairs & Laser Equipment Breakdown            │
│                 │ • Electrical Surge & Special Fire Perils                  │
│                 │ • Water Supply Interruption Endorsement                   │
│                 │ • Business Interruption (Appointment Book Loss)           │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ 🍽️ Restaurant   │ • Commercial Grease Hood & Flue Fire Perils               │
│                 │ • Walk-In Deep Freezer Spoilage Protection                │
│                 │ • Foodborne Pathogen & Beverage Contamination             │
│                 │ • Heavy Duty Range & HVAC Breakdown                       │
│                 │ • Dining Floor Public Bodily Injury Liability             │
│                 │ • Peak-Hours Business Interruption Compensation           │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

### 2. Guidewire BillingCenter
- Generates official commercial premium invoices when campaigns hit **Funded** status.
- Maintains strict ledger synchronization: **no merchant capital is disbursed** until the initial policy premium is confirmed collected into the insurance reserve.

### 3. Guidewire ClaimCenter
- Manages **First Notice of Loss (FNOL)** when physical incidents occur (fire, boiler rupture, water ingress).
- Evaluates damage severity using AI and dispatches indemnity settlements directly to the **Holding Escrow Account** (protecting investors), rather than to the merchant.

---

## 🐟 MiroFish Multi-Agent Swarm Intelligence

### Why MiroFish Swarm Intelligence?

Traditional crowdfunding platforms rely on static questionnaires or simple social poll counts. **MiroFish** is an advanced swarm intelligence engine that constructs a **high-fidelity parallel digital world** where hundreds of autonomous AI agents interact continuously:
- **God's-Eye Sandbox**: Rehearses launch outcomes before real money is pledged.
- **Social Propagation Tracking**: Deduces word-of-mouth referral velocity, campus buzz, and localized footfall.
- **Multi-Agent Consensus**: Aggregates autonomous agent perspectives into a verifiable Swarm Consensus Score (0–100%).

```
                          ┌────────────────────────────┐
                          │    MIROFISH SWARM CORE     │
                          └─────────────┬──────────────┘
                                        │
           ┌────────────────────────────┼───────────────────────────┐
           ▼                            ▼                           ▼
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │  Risk Analyst α  │        │ Community Pulse β│        │  Viability-γ     │
  │                  │        │                  │        │                  │
  │ • Commercial     │        │ • Social sentiment│        │ • Revenue model  │
  │   hazard scoring │        │ • Viral buzz     │        │   sustainability │
  │ • Loss likelihood│        │ • Footfall speed │        │ • Target ratio   │
  └──────────────────┘        └──────────────────┘        └──────────────────┘
           │                            │                           │
           └────────────────────────────┼───────────────────────────┘
                                        ▼
                          ┌────────────────────────────┐
                          │ Guidewire Compliance δ     │
                          │ Validates rating schedules │
                          └────────────────────────────┘
```

### The 5 Customer Behavioral Trend Dimensions

MiroFish tracks and visualizes 5 distinct customer behavioral vectors across a rolling 14-day simulation window:

```
Trend Score
  100 ┌──────────────────────────────────────────────────────────┐
      │                      ╭──────╮        ╭─────╮             │  ● Investment Intent (74.8%)
   80 │       ╭──────────────╯      ╰────────╯     ╰─────────────│  ● Insurance Trust (86.2%)
   60 │  ─────╯                                                  │  ● Community Buzz (69.4%)
   40 │  ───────────────────────────────╮                        │  ● Return Expectation (54.0%)
   20 │                                 ╰────────────────────────│  ● Risk Perception (24.1%)
    0 └──────────────────────────────────────────────────────────┘
      Day 1                     Day 7                      Day 14
```

1. **📈 Investment Intent Score (0–100)**: Measures backer willingness and funding momentum.
2. **🛡️ Risk Perception Index (0–100)**: Perceived operational danger (lower indicates higher investor confidence).
3. **👥 Community Buzz & Footfall (0–100)**: Social engagement velocity, comments, and campus discussions.
4. **🏛️ Insurance Trust Score (0–100)**: Backer security perception derived directly from Guidewire insurance backing.
5. **💎 Return Expectation Sentiment (0–100)**: Perceived financial viability and dividend expectations.

### Synthetic Investor Cohort Breakdown

MiroFish models distinct psychological cohorts with tailored pledge appetites:
- **Alumni Backers**: High capital capability, university/neighborhood affinity (Avg pledge: ₹12,500; Sentiment: 74%).
- **Student Micro-Pledgers**: High volume, micro-commitments, active social advocates (Avg pledge: ₹2,400; Sentiment: 68%).
- **Local Retail Patrons**: Daily customers protecting neighborhood fixtures (Avg pledge: ₹7,800; Sentiment: 82%).
- **Faculty & Cornerstone Sponsors**: Risk-averse cornerstone guarantors (Avg pledge: ₹25,000; Sentiment: 88%).

---

## 🎨 Customer Drafting Layer & Pre-Launch Lab

The **Drafting Layer** (`/drafting`) provides prospective investors with a dedicated pre-launch discovery page:
- **Pre-Launch Pipeline**: Review campaigns currently in `draft` and `underwriting` states prior to public live launch.
- **Guidewire Policy Preview**: Inspect preliminary actuarial quotes, premium estimates, approval decisions, and tailored commercial peril coverages.
- **Interactive SVG Graphs**: Dynamic time-series line charts with gradient fills, interactive data points, and hover tooltips showing day-by-day score changes.
- **Early Backer Intent Signals**: Backers can express early commitment, allowing MiroFish agents to incorporate early demand into launch momentum.

---

## 🛡️ The Continuous Safety Checker (8 System Rules)

An automated background auditor runs every few seconds to verify **8 safety rules** across all database records. If any rule is broken, the audit page immediately flags the discrepancy in red.

| Rule | Rule Name | Plain English Meaning | What is Checked |
|:---:|:---|:---|:---|
| **Rule 1** | Escrow Balance Match | The total of all confirmed investments must exactly match the money held in the safe escrow account. | Confirmed Investments = Escrow Balance |
| **Rule 2** | Active Policy Required | A campaign that is Funded or Active must have an official insurance policy that is in force. | Campaign in Funded/Active → Policy is In Force |
| **Rule 3** | Premium Paid Before Release | No money is released to the merchant until the first insurance premium invoice is paid. | Tranche Released > 0 → Premium Invoice Paid |
| **Rule 4** | Claims Go to Escrow | Every insurance claim payout must go to the safe holding escrow account to protect backers, never directly to the merchant. | Claim Recipient = Safe Holding Escrow |
| **Rule 5** | Auto-Pause on Cancelled Policy | If an insurance policy is cancelled or lapses, the campaign is automatically paused until it is resolved. | Policy Cancelled/Lapsed → Campaign Paused |
| **Rule 6** | Conservation of Funds | Money held in escrow + money released to the merchant + money refunded must equal the total amount invested. | Money Held + Released + Refunded = Total Raised |
| **Rule 7** | No Overfunding or Limit Breaches | No single investor can exceed the maximum investment limit, and a campaign can never collect more than its target goal. | Pledges ≤ Max Limit & Total Raised ≤ Target |
| **Rule 8** | Full Refund on Failed Campaigns | If a campaign does not reach its funding target by the deadline, 100% of all invested money is refunded to backers. | Failed Campaign → 100% Capital Refunded |

*Demo Feature*: Use the **"Inject Fault"** button on the `/audit` page to purposely trigger a violation (e.g. escrow balance tampering) and watch the Safety Checker catch and highlight it in red, then click **"Fix Faults"** to restore green integrity.

---

## 💻 Tech Stack & Directory Structure

```
guideware_project/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application & scheduler lifespan
│   │   ├── config.py                   # Environment configuration & settings
│   │   ├── database.py                 # AsyncPG database connection pooling
│   │   ├── guidewire/
│   │   │   └── policy_center.py        # Guidewire PolicyCenter practice engine
│   │   ├── ai/
│   │   │   └── groq_client.py          # Groq AI for fast neural inference
│   │   ├── services/
│   │   │   ├── campaign_service.py     # Campaign CRUD, state transitions, escrow
│   │   │   └── checker_service.py     # 8-rule continuous invariant auditor
│   │   └── routers/
│   │       ├── campaigns.py            # Public campaigns endpoints
│   │       ├── drafting.py             # Customer drafting layer & MiroFish trends API
│   │       ├── guidewire.py            # PolicyCenter, BillingCenter, ClaimCenter
│   │       ├── checker.py              # Safety checker audits & fault injector
│   │       ├── investments.py          # Investor pledging & portfolio
│   │       ├── merchants.py            # Merchant dashboard endpoints
│   │       ├── audit.py                # Audit trail events
│   │       └── predictions.py          # MiroFish prediction kick-off & status
│   ├── migrations/                     # SQL migration schemas
│   └── seeds/                          # Realistic campaign seed data scripts
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Main router (Campaigns, Drafting, Audit, etc.)
│   │   ├── Navbar.tsx                  # Royal Blue Guidewire navigation header
│   │   ├── api.ts                      # Typed REST client with TypeScript interfaces
│   │   ├── utils.ts                    # Currency formatters & status helpers
│   │   ├── components/                 # Shared UI icons & visual components
│   │   └── pages/
│   │       ├── CampaignsList.tsx       # Live campaigns catalogue
│   │       ├── DraftingLayerPage.tsx   # Pre-launch lab & MiroFish behavioral graphs
│   │       ├── CampaignDetail.tsx      # Campaign narrative, invest form, coverage
│   │       ├── MerchantDashboard.tsx   # Merchant raise creator & loss simulator
│   │       ├── AuditPage.tsx           # Safety checker invariants & fault injector
│   │       ├── MyInvestments.tsx       # Backer portfolio tracker
│   │       ├── PolicyCenterPage.tsx    # Guidewire PolicyCenter management
│   │       ├── ClaimCenterPage.tsx     # Guidewire ClaimCenter & FNOL
│   │       ├── BillingCenterPage.tsx   # Guidewire BillingCenter & escrow ledger
│   │       └── MiroFishGraphPage.tsx   # Force-directed multi-agent entity graph
│   └── package.json
├── mirofish/                           # MiroFish multi-agent swarm engine package
└── README.md
```

---

## 🚀 Setup & Quickstart Guide

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+ & `npm`
- **PostgreSQL**: Local database or Supabase instance

### 1. Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Ensure your database connection string and Groq API key are configured:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_raise
GROQ_API_KEY=your_key_here
```

### 2. Backend Initialization
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seeds/seed_data.py               # Seeds sample merchants, campaigns & policies
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Initialization
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🎬 Interactive Demo Script (5-Minute Walkthrough)

1. **Discover Drafting Layer**:
   - Navigate to `/drafting` from the navbar.
   - Explore the **14-day MiroFish Behavioral Trend SVG Graphs** (toggle between Investment Intent, Risk Perception, Community Buzz, Insurance Trust, and Return Sentiment).
   - Inspect the pre-launch campaigns with their customized Guidewire PolicyCenter underwriting quotes.
   - Click **"Deep-Dive Behaviors"** on a draft campaign to inspect the actuarial peril probability breakdown.
   - Click **"Back Early ⚡"** to log an early interest signal in the swarm.
2. **Launch a Campaign**:
   - Go to `/merchant` and create a raise for an artisanal bakery or cafe (e.g. ₹20,00,000 target).
   - Observe Guidewire PolicyCenter automatically rate the business, adjust for fire certifications, and approve underwriting.
3. **Pledge Capital**:
   - Switch to the `/` (Campaigns List) page and open your campaign.
   - Invest as a community backer; watch the progress bar fill without allowing overfunding.
4. **Fund & Bind Policy**:
   - Reach 100% funding; watch the Guidewire policy bind to `in_force` and BillingCenter generate the premium invoice.
   - Confirm premium payment to trigger Tranche 1 release to the merchant.
5. **Simulate a Peril Loss**:
   - In the Merchant Hub, trigger **"Simulate Loss"** (e.g., Oven Flare-Up).
   - Watch the status transition to **Under Claim**, ClaimCenter open an FNOL, and the insurance indemnity pay into **Holding Escrow** (not the merchant's personal account), protecting investor capital.
6. **Trigger the Safety Checker**:
   - Go to `/audit` (Safety Audit). All 8 rules show green ticks.
   - Click **"Inject Fault"**; watch Rule 1 or Rule 6 turn red with an explicit violation alert.
   - Click **"Fix Faults"** to watch the system restore mathematical ledger balance.

---

## ⚖️ Legal & Risk Disclosure

> **Educational & Architectural Prototype**: This project is an architectural demonstration and simulation platform. No real financial securities are offered, and no real currency is collected. In a commercial deployment, public community capital raises are governed by national securities frameworks (e.g., SEBI in India, SEC Reg CF in the US). Property & casualty commercial insurance mitigates business peril loss but does not guarantee equity investment appreciation.
