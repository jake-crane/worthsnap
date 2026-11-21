import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import DescriptionCombobox from '../components/DescriptionCombobox'
import { useConnection } from '../lib/offline'
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

// The form is kept on this device as you type, so nothing is lost if the
// app closes, or if you're offline and can't save yet. Cleared on save and
// on sign-out.
const DRAFT_KEY = 'worthsnap:new-snapshot-draft'

interface Draft {
  rows: { description: string; amount: string }[]
  snapshotDate: string
  notes: string
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Draft) : null
  } catch {
    return null
  }
}

function saveDraft(draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage unavailable: the form still works, just isn't kept.
  }
}

function rowsFromDraft(draft: Draft): Row[] {
  return draft.rows.length > 0
    ? draft.rows.map((r) => ({ ...newRow(r.description), amount: r.amount }))
    : [newRow()]
}

/** Autocomplete options, plus rows pre-filled from the latest snapshot. */
async function fetchPrefill(): Promise<{ descriptions: string[]; rows: Row[] }> {
  const [summaries, descriptions] = await Promise.all([
    api.get<SnapshotSummary[]>('/snapshots'),
    api.get<string[]>('/descriptions'),
  ])
  if (summaries.length === 0) return { descriptions, rows: [newRow()] }

  const latest = summaries.reduce((a, b) => (a.snapshotDate > b.snapshotDate ? a : b))
  const detail = await api.get<SnapshotDetail>(`/snapshots/${latest.id}`)
  return {
    descriptions,
    rows:
      detail.lineItems.length > 0
        ? detail.lineItems.map((li) => newRow(li.description))
        : [newRow()],
  }
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function NewSnapshot() {
  const navigate = useNavigate()
  const { offline } = useConnection()
  const [initialDraft] = useState(loadDraft)
  const [restoredDraft, setRestoredDraft] = useState(initialDraft !== null)
  const [rows, setRows] = useState<Row[] | null>(() =>
    initialDraft ? rowsFromDraft(initialDraft) : null,
  )
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [snapshotDate, setSnapshotDate] = useState(
    () => initialDraft?.snapshotDate ?? toDateTimeLocalValue(new Date()),
  )
  const [notes, setNotes] = useState(initialDraft?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [duplicateKeys, setDuplicateKeys] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (initialDraft) {
      // Rows come from the draft; just fetch autocomplete options.
      api
        .get<string[]>('/descriptions')
        .catch(() => [])
        .then(setDescriptions)
      return
    }
    fetchPrefill()
      .then((prefill) => {
        setDescriptions(prefill.descriptions)
        setRows(prefill.rows)
      })
      .catch((e) => setError(String(e)))
  }, [initialDraft])

  // Keep the draft once something has been typed.
  useEffect(() => {
    if (!rows) return
    const typed = notes.trim() !== '' || rows.some((r) => r.amount !== '')
    saveDraft(
      typed
        ? {
            rows: rows.map(({ description, amount }) => ({ description, amount })),
            snapshotDate,
            notes,
          }
        : null,
    )
  }, [rows, snapshotDate, notes])

  function startOver() {
    saveDraft(null)
    setRestoredDraft(false)
    setSnapshotDate(toDateTimeLocalValue(new Date()))
    setNotes('')
    setError(null)
    setDuplicateKeys(new Set())
    setRows(null)
    fetchPrefill()
      .then((prefill) => {
        setDescriptions(prefill.descriptions)
        setRows(prefill.rows)
      })
      .catch((e) => setError(String(e)))
  }

  function updateRow(key: number, field: 'description' | 'amount', value: string) {
    setRows((prev) => prev && prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
    setDuplicateKeys(new Set())
  }

  function addRow() {
    setRows((prev) => [...(prev ?? []), newRow()])
    setDuplicateKeys(new Set())
  }

  function removeRow(key: number) {
    setRows((prev) => prev && prev.filter((r) => r.key !== key))
    setDuplicateKeys(new Set())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rows) return
    setError(null)

    const validRows = rows.filter((r) => r.description.trim() !== '' && r.amount !== '')
    const lineItems = validRows.map((r) => ({
      description: r.description.trim(),
      amount: Number(r.amount),
    }))

    if (lineItems.length === 0) {
      setDuplicateKeys(new Set())
      setError('Add at least one line item with a description and amount.')
      return
    }

    const countByDescription = new Map<string, number>()
    for (const r of validRows) {
      const key = r.description.trim().toLowerCase()
      countByDescription.set(key, (countByDescription.get(key) ?? 0) + 1)
    }
    const dupKeys = new Set(
      validRows
        .filter((r) => (countByDescription.get(r.description.trim().toLowerCase()) ?? 0) > 1)
        .map((r) => r.key),
    )
    if (dupKeys.size > 0) {
      setDuplicateKeys(dupKeys)
      setError('Each line item must have a unique description.')
      return
    }
    setDuplicateKeys(new Set())

    setSubmitting(true)
    try {
      const created = await api.post<{ id: number }>('/snapshots', {
        snapshotDate,
        notes: notes.trim() || null,
        lineItems,
      })
      saveDraft(null)
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

      {restoredDraft && (
        <p className="text-sm text-slate-500">
          Picked up where you left off.{' '}
          <button
            type="button"
            onClick={startOver}
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Start over
          </button>
        </p>
      )}

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

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="rounded-t-lg border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
          Line items
        </div>
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Use a negative amount for liabilities, e.g. a credit card balance.
        </p>
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => {
            const usedByOtherRows = new Set(
              rows
                .filter((r) => r.key !== row.key && r.description.trim() !== '')
                .map((r) => r.description.trim().toLowerCase()),
            )
            const availableDescriptions = descriptions.filter(
              (d) => !usedByOtherRows.has(d.trim().toLowerCase()),
            )
            return (
            <li key={row.key} className="flex items-center gap-3 px-4 py-3">
              <DescriptionCombobox
                value={row.description}
                onChange={(value) => updateRow(row.key, 'description', value)}
                options={availableDescriptions}
                placeholder="e.g. Chase Checking"
                className="flex-1"
                error={duplicateKeys.has(row.key)}
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
            )
          })}
        </ul>
        <div className="rounded-b-lg border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + Add line item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting || offline}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save snapshot'}
        </button>
        {offline && (
          <p className="text-sm text-slate-500">
            You're offline. What you've entered is kept on this device, so you can save it
            when you're back online.
          </p>
        )}
      </div>
    </form>
  )
}
