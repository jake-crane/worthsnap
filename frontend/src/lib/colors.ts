export function changeColorClass(change: number | null): string {
  if (change === null || change === 0) return 'text-slate-500'
  return change > 0 ? 'text-emerald-600' : 'text-rose-600'
}
