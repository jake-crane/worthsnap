import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { SnapshotDetail, SnapshotSummary } from '../types'

interface Row {
  key: number
  description: string
  amount: string
}

let nextKey = 0
function newRow(description = ''): Row {
  return { key: nextKey++, description, amount: '' }
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function NewSnapshot() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [snapshotDate, setSnapshotDate] = useState(() =>
    toDateTimeLocalValue(new Date()),
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const [summaries, allDescriptions] = await Promise.all([
        api.get<SnapshotSummary[]>('/snapshots'),
        api.get<string[]>('/descriptions'),
      ])
      setDescriptions(allDescriptions)

      if (summaries.length === 0) {
        setRows([newRow()])
        return
      }

      const latest = summaries.reduce((a, b) =>
        a.snapshotDate > b.snapshotDate ? a : b,
      )
      const detail = await api.get<SnapshotDetail>(`/snapshots/${latest.id}`)
      setRows(
        detail.lineItems.length > 0
          ? detail.lineItems.map((li) => newRow(li.description))
          : [newRow()],
      )
    }
    load().catch((e) => setError(String(e)))
  }, [])

  function updateRow(key: number, field: 'description' | 'amount', value: string) {
    setRows((prev) => prev && prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((prev) => [...(prev ?? []), newRow()])
  }

  function removeRow(key: number) {
    setRows((prev) => prev && prev.filter((r) => r.key !== key))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rows) return
    setError(null)

    const lineItems = rows
      .filter((r) => r.description.trim() !== '' && r.amount !== '')
      .map((r) => ({ description: r.description.trim(), amount: Number(r.amount) }))

    if (lineItems.length === 0) {
      setError('Add at least one line item with a description and amount.')
      return
    }

    setSubmitting(true)
    try {
      const created = await api.post<{ id: number }>('/snapshots', {
        snapshotDate,
        notes: notes.trim() || null,
        lineItems,
      })
      navigate(`/snapshots/${created.id}`)
    } catch (e) {
      setError(String(e))
      setSubmitting(false)
    }
  }

  if (!rows && error) return <p className="text-red-600">{error}</p>
  if (!rows) return <p className="text-slate-500">Loading…</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New snapshot</h1>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-500">Date &amp; time</label>
          <input
            type="datetime-local"
            value={snapshotDate}
            onChange={(e) => setSnapshotDate(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500">
            Notes (optional)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <datalist id="description-suggestions">
        {descriptions.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
          Line items
        </div>
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Use a negative amount for liabilities, e.g. a credit card balance.
        </p>
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-3">
              <input
                value={row.description}
                onChange={(e) => updateRow(row.key, 'description', e.target.value)}
                list="description-suggestions"
                placeholder="e.g. Chase Checking"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.key, 'amount', e.target.value)}
                placeholder="0.00"
                className="w-36 rounded-md border border-slate-300 px-3 py-2 text-right text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600"
                aria-label="Remove line item"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + Add line item
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save snapshot'}
      </button>
    </form>
  )
}
