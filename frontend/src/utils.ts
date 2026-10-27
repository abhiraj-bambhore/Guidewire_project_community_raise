/** Shared utility helpers */

export function formatINR(amount: number | string | null | undefined): string {
  const n = Math.round(Number(amount ?? 0))
  return `₹${n.toLocaleString('en-IN')}`
}

export function pct(raised: number, target: number): number {
  if (!target) return 0
  return Math.min((raised / target) * 100, 100)
}

export function stateBadgeClass(state: string): string {
  return `badge state-${state.replace('_', '-')}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function outletIcon(_type: string): string {
  return ''
}

export const COVERAGE = [
  'Fire and Special Perils',
  'Business Interruption',
  'Equipment Breakdown',
  'Public Liability',
]
