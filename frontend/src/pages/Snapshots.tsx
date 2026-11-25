import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { changeColorClass } from '../lib/colors'
import { loadThenRefresh, useApiData } from '../lib/data'
import { useConnection } from '../lib/offline'
import { formatChange, formatCurrency, formatDateTime, formatPercent } from '../lib/format'
import type { SnapshotDetail, SnapshotSummary } from '../types'

export default function Snapshots() {
  const { data, error: loadError, update } = useApiData<SnapshotSummary[]>('/snapshots')
  const snapshots = useMemo(
    () => data && [...data].sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate)),
    [data],
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const error = loadError ?? actionError
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [details, setDetails] = useState<Record<number, SnapshotDetail>>({})
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const { offline } = useConnection()

  async function toggleExpand(id: number) {
    const wasExpanded = expandedIds.has(id)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (wasExpanded) next.delete(id)
      else next.add(id)
      return next
    })
    if (wasExpanded || details[id]) return

    setLoadingIds((prev) => new Set(prev).add(id))
    let shown = false
    try {
      await loadThenRefresh<SnapshotDetail>(`/snapshots/${id}`, (detail) => {
        shown = true
        setDetails((prev) => ({ ...prev, [id]: detail }))
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
    } catch (e) {
      // Fine if a saved copy is already showing.
      if (!shown) setActionError(String(e))
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDelete(id: number) {
    setConfirmingId(null)
    setDeletingId(id)
    try {
      await api.delete(`/snapshots/${id}`)
      update((prev) => prev.filter((s) => s.id !== id))
      setExpandedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (e) {
      setActionError(String(e))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Snapshots</h1>
        <Link
          to="/snapshots/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add snapshot
        </Link>
      </div>

      {error && <p className="text-red-600">Failed to load: {error}</p>}
      {!snapshots && !error && <p className="animate-[appear_200ms_ease-out_500ms_both] text-slate-500">Loading…</p>}

      {snapshots && snapshots.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No snapshots yet.
        </div>
      )}

      {snapshots && snapshots.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-64" />
              <col />
              <col className="w-28" />
              <col className="w-72" />
            </colgroup>
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2" />
                <th className="truncate px-4 py-2 font-medium">Date</th>
                <th className="truncate px-4 py-2 font-medium">Notes</th>
                <th className="truncate px-4 py-2 text-right font-medium">Net worth</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => {
                const isExpanded = expandedIds.has(s.id)
                const detail = details[s.id]
                return (
                  <Fragment key={s.id}>
                    <tr className="border-t border-slate-100">
                      <td className="py-3 pl-3 pr-0">
                        <button
                          type="button"
                          onClick={() => toggleExpand(s.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} line items for snapshot from ${formatDateTime(s.snapshotDate)}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-base text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      </td>
                      <td className="truncate px-4 py-3">
                        <Link
                          to={`/snapshots/${s.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {formatDateTime(s.snapshotDate)}
                        </Link>
                      </td>
                      <td className="truncate px-4 py-3 text-slate-500">{s.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(s.netWorth)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {confirmingId === s.id ? (
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-xs text-slate-500">Delete this snapshot?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              disabled={deletingId === s.id || offline}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                            >
                              {deletingId === s.id ? 'Deleting…' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              disabled={deletingId === s.id}
                              className="text-xs font-medium text-slate-400 hover:text-slate-600 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(s.id)}
                            disabled={offline}
                            title={offline ? 'Connect to the internet to delete' : undefined}
                            aria-label={`Delete snapshot from ${formatDateTime(s.snapshotDate)}`}
                            className="text-xs font-medium text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-400"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={5} className="px-4 py-3">
                          {loadingIds.has(s.id) && (
                            <p className="text-xs text-slate-500">Loading line items…</p>
                          )}
                          {detail && detail.lineItems.length === 0 && (
                            <p className="text-xs text-slate-500">No line items.</p>
                          )}
                          {detail && detail.lineItems.length > 0 && (
                            <table className="w-full text-xs">
                              <thead className="text-slate-400">
                                <tr>
                                  <th className="py-1 text-left font-medium">Description</th>
                                  <th className="py-1 text-right font-medium">Amount</th>
                                  <th className="py-1 text-right font-medium">Change</th>
                                  <th className="py-1 text-right font-medium">% Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.lineItems.map((li) => (
                                  <tr key={li.description} className="border-t border-slate-200">
                                    <td className="py-1.5 text-slate-700">{li.description}</td>
                                    <td className="py-1.5 text-right text-slate-900">
                                      {formatCurrency(li.amount)}
                                    </td>
                                    <td className={`py-1.5 text-right ${changeColorClass(li.change)}`}>
                                      {formatChange(li.change)}
                                    </td>
                                    <td className={`py-1.5 text-right ${changeColorClass(li.change)}`}>
                                      {formatPercent(li.percentChange)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
