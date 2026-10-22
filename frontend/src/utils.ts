/** Shared utility helpers */

export function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
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

export function outletIcon(type: string): string {
  const icons: Record<string, string> = {
    cafe: '☕',
    gym: '🏋️',
    bakery: '🥐',
    salon: '💇',
    restaurant: '🍽️',
  }
  return icons[type] ?? '🏪'
}

export const COVERAGE = [
  'Fire and Special Perils',
  'Business Interruption',
  'Equipment Breakdown',
  'Public Liability',
]
