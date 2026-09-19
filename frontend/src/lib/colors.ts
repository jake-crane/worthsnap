import type { CategoryType } from '../types'

/**
 * A rising liability is bad for net worth, so its color meaning is the
 * inverse of a rising asset even though both show a positive `change`.
 */
export function changeColorClass(
  change: number | null,
  type: CategoryType,
): string {
  if (change === null || change === 0) return 'text-slate-500'
  const isGoodForNetWorth = type === 'ASSET' ? change > 0 : change < 0
  return isGoodForNetWorth ? 'text-emerald-600' : 'text-rose-600'
}
