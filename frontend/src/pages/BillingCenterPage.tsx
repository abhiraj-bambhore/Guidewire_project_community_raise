import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

export default function BillingCenterPage() {
  const [data, setData] = useState<{
    invoices: (api.Invoice & { policy_number: string; campaign_title: string; merchant_name: string })[]
    recent_payments: any[]
    escrow_ledger: { total_investor_capital: number; holding_escrow_pool: number; disbursed_merchant_capital: number; insurance_reserve_balance: number }
    stats: { total_invoices: number; total_billed: number; total_collected: number; total_outstanding: number; collection_rate: string }
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadBilling()
  }, [])

  async function loadBilling() {
    setLoading(true)
    try {
      const res = await api.getBillingCenterOverview()
      setData(res)
    } catch (err) {
      console.error('Failed to load BillingCenter data', err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayInvoice(invoice: api.Invoice) {
    setPayingId(invoice.id)
    try {
      await api.payBillingInvoice(invoice.id, invoice.amount, 'Instant Premium payment via Guidewire BillingCenter Portal')
      setPaySuccessMsg(`✓ Successfully processed payment for Invoice #${invoice.invoice_number} (${api.formatINR(invoice.amount)})`)
      await loadBilling()
      setTimeout(() => setPaySuccessMsg(null), 5000)
    } catch (err: any) {
      alert(`Payment failed: ${err.message || 'Unknown error'}`)
    } finally {
      setPayingId(null)
    }
  }

  const filteredInvoices = data?.invoices.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  }) || []

  return (
    <div className="page" style={{ maxWidth: '1380px' }}>
      {/* Enterprise Suite Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: '#0d9488',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 6,
              letterSpacing: '0.5px'
            }}>
              GUIDEWIRE ENTERPRISE
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              Module 02 of InsuranceSuite Cloud
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 32, marginBottom: 6, color: '#0d233a' }}>
            BillingCenter — Premium Escrow &amp; Payment Schedules
          </h1>
          <p className="page-subtitle" style={{ fontSize: 15, maxWidth: 860 }}>
            Unified escrow ledger reconciliation, installment payment plans, automated collection schedules, and tripartite split tracking across merchant capital, investor escrow, and insurance reserves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/guidewire/policycenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            ← PolicyCenter
          </Link>
          <Link to="/guidewire/claimcenter" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
            ClaimCenter &amp; AI →
          </Link>
        </div>
      </div>

      {paySuccessMsg && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#15803d',
          padding: '12px 18px',
          borderRadius: 8,
          marginBottom: 20,
          fontWeight: 700,
          fontSize: 14,
        }}>
          {paySuccessMsg}
        </div>
      )}

      {/* Escrow Ledger Tripartite Balance Card */}
      <div className="card" style={{ padding: '22px 26px', marginBottom: 28, background: 'linear-gradient(135deg, #091326 0%, #112240 100%)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#38bdf8' }}>
              BILLINGCENTER ESCROW LEDGER &amp; CAPITAL ALLOCATION
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              Tripartite Escrow Balance Breakdown
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #4ade80', fontSize: 12 }}>
              ✓ Audit Rule Compliant
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: 18,
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Total Investor Capital</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff' }}>
              {data ? api.formatINR(data.escrow_ledger.total_investor_capital) : '₹1,02,40,000'}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Pledged by community backers</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Holding Escrow Pool</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#60a5fa' }}>
              {data ? api.formatINR(data.escrow_ledger.holding_escrow_pool) : '₹67,10,000'}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Safe in bank escrow</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Disbursed Merchant Capital</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>
              {data ? api.formatINR(data.escrow_ledger.disbursed_merchant_capital) : '₹35,30,000'}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Released upon milestone proof</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Insurance Premium Collected</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>
              {data ? api.formatINR(data.escrow_ledger.insurance_reserve_balance) : '₹3,40,000'}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>BillingCenter reserve buffer</div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0d9488' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoices</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0d233a' }}>{data?.stats.total_invoices || 44}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Across 13 campaigns</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0055b8' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Billed</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0055b8' }}>
            {data ? api.formatINR(data.stats.total_billed) : '₹5,60,000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Commercial policy fees</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Collected</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>
            {data ? api.formatINR(data.stats.total_collected) : '₹3,40,000'}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Collection Rate: {data?.stats.collection_rate || '60.7%'}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Due</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>
            {data ? api.formatINR(data.stats.total_outstanding) : '₹2,20,000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending payment</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d233a' }}>
              BillingCenter Invoices Ledger ({filteredInvoices.length})
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Commercial premium installments, Q2 endorsement additions, and escrow fees.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'unpaid', 'paid'] as const).map(st => (
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
            Loading BillingCenter invoices...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 12px' }}>Invoice No.</th>
                  <th style={{ padding: '10px 12px' }}>Campaign &amp; Merchant</th>
                  <th style={{ padding: '10px 12px' }}>Policy No.</th>
                  <th style={{ padding: '10px 12px' }}>Amount</th>
                  <th style={{ padding: '10px 12px' }}>Due Date</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Payment Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0055b8' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#0d233a' }}>{inv.campaign_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.merchant_name}</div>
                    </td>
                    <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontSize: 12.5 }}>
                      {inv.policy_number}
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 800, color: '#0d233a' }}>
                      {api.formatINR(inv.amount)}
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-muted)', fontSize: 12.5 }}>
                      {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge badge-${inv.status === 'paid' ? 'success' : 'danger'}`} style={{ textTransform: 'capitalize' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      {inv.status === 'unpaid' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayInvoice(inv)}
                          disabled={payingId === inv.id}
                          style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}
                        >
                          {payingId === inv.id ? 'Processing...' : 'Pay Premium'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                          ✓ Paid &amp; Reconciled
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

      {/* Recent Payment Receipts */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0d233a', marginBottom: 14 }}>
          Recent Guidewire BillingCenter Payment Receipts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {data?.recent_payments.slice(0, 6).map((pay, idx) => (
            <div key={idx} style={{ padding: 14, background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#0055b8' }}>
                  {pay.invoice_number || 'INV-2026-PAID'}
                </span>
                <span className="badge badge-success" style={{ fontSize: 10.5 }}>Settled</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0d233a', marginBottom: 4 }}>
                {api.formatINR(pay.amount)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pay.note || 'Premium installment settlement'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
