import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { changeColorClass } from '../lib/colors'
import { formatChange, formatCurrency, formatDateTime, formatPercent } from '../lib/format'
import type { SnapshotDetail as SnapshotDetailType } from '../types'

function LineItemRow({ item }: { item: SnapshotDetailType['lineItems'][number] }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium text-slate-900">{item.description}</td>
      <td className="px-4 py-3 text-right text-slate-900">
        {formatCurrency(item.amount)}
      </td>
      <td className={`px-4 py-3 text-right ${changeColorClass(item.change)}`}>
        {formatChange(item.change)}
      </td>
      <td className={`px-4 py-3 text-right ${changeColorClass(item.change)}`}>
        {formatPercent(item.percentChange)}
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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/snapshots" className="text-sm text-slate-500 hover:underline">
          ← All snapshots
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="text-sm font-medium text-slate-500">
          {formatDateTime(snapshot.snapshotDate)}
        </div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">
          {formatCurrency(snapshot.netWorth)}
        </div>
        {snapshot.netWorthChange !== null && (
          <div className={`mt-1 text-sm ${changeColorClass(snapshot.netWorthChange)}`}>
            {formatChange(snapshot.netWorthChange)} (
            {formatPercent(snapshot.netWorthPercentChange)}) since previous snapshot
          </div>
        )}
        {snapshot.notes && (
          <p className="mt-3 text-sm text-slate-600">{snapshot.notes}</p>
        )}
      </div>

      {snapshot.lineItems.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 text-right font-medium">Change</th>
                <th className="px-4 py-2 text-right font-medium">% Change</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.lineItems.map((item) => (
                <LineItemRow key={item.description} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
