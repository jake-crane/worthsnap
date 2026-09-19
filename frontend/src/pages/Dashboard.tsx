import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import { formatCurrency, formatDate, formatDateTime } from '../lib/format'
import type { NetWorthPoint } from '../types'

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: NetWorthPoint }[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <div className="text-slate-500">{formatDateTime(point.snapshotDate)}</div>
      <div className="font-semibold text-slate-900">
        {formatCurrency(point.netWorth)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [history, setHistory] = useState<NetWorthPoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<NetWorthPoint[]>('/net-worth-history')
      .then(setHistory)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return <p className="text-red-600">Failed to load: {error}</p>
  }

  if (!history) {
    return <p className="text-slate-500">Loading…</p>
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No snapshots yet
        </h2>
        <p className="mt-1 text-slate-500">
          Add your first snapshot to start tracking your net worth over time.
        </p>
        <Link
          to="/snapshots/new"
          className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add snapshot
        </Link>
      </div>
    )
  }

  const latest = history[history.length - 1]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="text-sm font-medium text-slate-500">
          Current net worth
        </div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">
          {formatCurrency(latest.netWorth)}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          as of {formatDateTime(latest.snapshotDate)}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-slate-500">
          Net worth over time
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={history} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="snapshotDate"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-end">
        <Link
          to="/snapshots/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add snapshot
        </Link>
      </div>
    </div>
  )
}
