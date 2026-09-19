import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatCurrency, formatDateTime } from '../lib/format'
import type { SnapshotSummary } from '../types'

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<SnapshotSummary[]>('/snapshots')
      .then((data) =>
        setSnapshots(
          [...data].sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate)),
        ),
      )
      .catch((e) => setError(String(e)))
  }, [])

  async function handleDelete(id: number) {
    setConfirmingId(null)
    setDeletingId(id)
    try {
      await api.delete(`/snapshots/${id}`)
      setSnapshots((prev) => prev && prev.filter((s) => s.id !== id))
    } catch (e) {
      setError(String(e))
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
      {!snapshots && !error && <p className="text-slate-500">Loading…</p>}

      {snapshots && snapshots.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No snapshots yet.
        </div>
      )}

      {snapshots && snapshots.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-64" />
              <col />
              <col className="w-28" />
              <col className="w-72" />
            </colgroup>
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2 text-right font-medium">Net worth</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
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
                          disabled={deletingId === s.id}
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
                        aria-label={`Delete snapshot from ${formatDateTime(s.snapshotDate)}`}
                        className="text-xs font-medium text-slate-400 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
