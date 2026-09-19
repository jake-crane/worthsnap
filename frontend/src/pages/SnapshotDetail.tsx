import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { changeColorClass } from '../lib/colors'
import { formatChange, formatCurrency, formatDate, formatPercent } from '../lib/format'
import type { SnapshotDetail as SnapshotDetailType } from '../types'

function EntryRow({ entry }: { entry: SnapshotDetailType['entries'][number] }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{entry.itemName}</div>
        <div className="text-xs text-slate-500">{entry.categoryName}</div>
      </td>
      <td className="px-4 py-3 text-right text-slate-900">
        {formatCurrency(entry.value)}
      </td>
      <td className={`px-4 py-3 text-right ${changeColorClass(entry.change, entry.type)}`}>
        {formatChange(entry.change)}
      </td>
      <td className={`px-4 py-3 text-right ${changeColorClass(entry.change, entry.type)}`}>
        {formatPercent(entry.percentChange)}
      </td>
    </tr>
  )
}

export default function SnapshotDetail() {
  const { id } = useParams()
  const [snapshot, setSnapshot] = useState<SnapshotDetailType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<SnapshotDetailType>(`/snapshots/${id}`)
      .then(setSnapshot)
      .catch((e) => setError(String(e)))
  }, [id])

  if (error) return <p className="text-red-600">Failed to load: {error}</p>
  if (!snapshot) return <p className="text-slate-500">Loading…</p>

  const assets = snapshot.entries.filter((e) => e.type === 'ASSET')
  const liabilities = snapshot.entries.filter((e) => e.type === 'LIABILITY')

  return (
    <div className="space-y-6">
      <div>
        <Link to="/snapshots" className="text-sm text-slate-500 hover:underline">
          ← All snapshots
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="text-sm font-medium text-slate-500">
          {formatDate(snapshot.snapshotDate)}
        </div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">
          {formatCurrency(snapshot.netWorth)}
        </div>
        {snapshot.netWorthChange !== null && (
          <div
            className={`mt-1 text-sm ${changeColorClass(snapshot.netWorthChange, 'ASSET')}`}
          >
            {formatChange(snapshot.netWorthChange)} (
            {formatPercent(snapshot.netWorthPercentChange)}) since previous snapshot
          </div>
        )}
        {snapshot.notes && (
          <p className="mt-3 text-sm text-slate-600">{snapshot.notes}</p>
        )}
      </div>

      {[
        { title: 'Assets', entries: assets },
        { title: 'Liabilities', entries: liabilities },
      ].map(
        (section) =>
          section.entries.length > 0 && (
            <div
              key={section.title}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                {section.title}
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Value</th>
                    <th className="px-4 py-2 text-right font-medium">Change</th>
                    <th className="px-4 py-2 text-right font-medium">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {section.entries.map((entry) => (
                    <EntryRow key={entry.itemId} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          ),
      )}
    </div>
  )
}
