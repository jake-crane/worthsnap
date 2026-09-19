import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatCurrency, formatDate } from '../lib/format'
import type { SnapshotSummary } from '../types'

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2 text-right font-medium">Net worth</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      to={`/snapshots/${s.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {formatDate(s.snapshotDate)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.notes ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatCurrency(s.netWorth)}
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
