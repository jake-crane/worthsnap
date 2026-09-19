import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Item, SnapshotDetail, SnapshotSummary } from '../types'

export default function NewSnapshot() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[] | null>(null)
  const [values, setValues] = useState<Record<number, string>>({})
  const [snapshotDate, setSnapshotDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const allItems = await api.get<Item[]>('/items')
      const active = allItems.filter((i) => !i.archived)
      setItems(active)

      const summaries = await api.get<SnapshotSummary[]>('/snapshots')
      if (summaries.length > 0) {
        const latest = summaries.reduce((a, b) =>
          a.snapshotDate > b.snapshotDate ? a : b,
        )
        const detail = await api.get<SnapshotDetail>(`/snapshots/${latest.id}`)
        const prefilled: Record<number, string> = {}
        for (const entry of detail.entries) {
          prefilled[entry.itemId] = String(entry.value)
        }
        setValues(prefilled)
      }
    }
    load().catch((e) => setError(String(e)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!items) return
    setSubmitting(true)
    setError(null)
    try {
      const entries = items
        .filter((item) => values[item.id] !== undefined && values[item.id] !== '')
        .map((item) => ({ itemId: item.id, value: Number(values[item.id]) }))

      const created = await api.post<{ id: number }>('/snapshots', {
        snapshotDate,
        notes: notes.trim() || null,
        entries,
      })
      navigate(`/snapshots/${created.id}`)
    } catch (e) {
      setError(String(e))
      setSubmitting(false)
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!items) return <p className="text-slate-500">Loading…</p>

  const assets = items.filter((i) => i.type === 'ASSET')
  const liabilities = items.filter((i) => i.type === 'LIABILITY')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New snapshot</h1>

      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-500">Date</label>
          <input
            type="date"
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

      {items.length === 0 && (
        <p className="text-slate-500">
          You don't have any items yet — add some on the Items page first.
        </p>
      )}

      {[
        { title: 'Assets', list: assets },
        { title: 'Liabilities', list: liabilities },
      ].map(
        (section) =>
          section.list.length > 0 && (
            <div
              key={section.title}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                {section.title}
              </div>
              <ul className="divide-y divide-slate-100">
                {section.list.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.categoryName}</div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={values[item.id] ?? ''}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [item.id]: e.target.value }))
                      }
                      placeholder="0.00"
                      className="w-36 rounded-md border border-slate-300 px-3 py-1.5 text-right text-sm"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}

      <button
        type="submit"
        disabled={submitting || items.length === 0}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save snapshot'}
      </button>
    </form>
  )
}
