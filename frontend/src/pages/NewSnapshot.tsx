import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Category, CategoryType, Item, SnapshotDetail, SnapshotSummary } from '../types'

const NEW_CATEGORY = '__new__'

export default function NewSnapshot() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [snapshotItems, setSnapshotItems] = useState<Item[] | null>(null)
  const [values, setValues] = useState<Record<number, string>>({})
  const [snapshotDate, setSnapshotDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountValue, setNewAccountValue] = useState('')
  const [newAccountCategoryId, setNewAccountCategoryId] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('ASSET')
  const [addingAccount, setAddingAccount] = useState(false)

  useEffect(() => {
    async function load() {
      const [cats, allItems, summaries] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<Item[]>('/items'),
        api.get<SnapshotSummary[]>('/snapshots'),
      ])
      setCategories(cats)
      setNewAccountCategoryId(cats.length > 0 ? String(cats[0].id) : NEW_CATEGORY)

      const itemsById = new Map(allItems.map((i) => [i.id, i]))

      if (summaries.length === 0) {
        // No history yet: fall back to whatever active items already exist.
        setSnapshotItems(allItems.filter((i) => !i.archived))
        return
      }

      const latest = summaries.reduce((a, b) =>
        a.snapshotDate > b.snapshotDate ? a : b,
      )
      const detail = await api.get<SnapshotDetail>(`/snapshots/${latest.id}`)

      const carriedOver: Item[] = []
      for (const entry of detail.entries) {
        const item = itemsById.get(entry.itemId)
        if (!item || item.archived) continue
        carriedOver.push(item)
      }
      setSnapshotItems(carriedOver)
    }
    load().catch((e) => setError(String(e)))
  }, [])

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!newAccountName.trim() || !categories) return
    try {
      let categoryId: number
      if (newAccountCategoryId === NEW_CATEGORY) {
        if (!newCategoryName.trim()) return
        const category = await api.post<Category>('/categories', {
          name: newCategoryName,
          type: newCategoryType,
        })
        setCategories((prev) => [...(prev ?? []), category])
        categoryId = category.id
      } else {
        categoryId = Number(newAccountCategoryId)
      }

      const item = await api.post<Item>('/items', { name: newAccountName, categoryId })
      setSnapshotItems((prev) => [...(prev ?? []), item])
      if (newAccountValue !== '') {
        setValues((v) => ({ ...v, [item.id]: newAccountValue }))
      }

      setNewAccountName('')
      setNewAccountValue('')
      setNewCategoryName('')
      setAddingAccount(false)
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!snapshotItems) return
    setSubmitting(true)
    setError(null)
    try {
      const entries = snapshotItems
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
  if (!snapshotItems || !categories) return <p className="text-slate-500">Loading…</p>

  const assets = snapshotItems.filter((i) => i.type === 'ASSET')
  const liabilities = snapshotItems.filter((i) => i.type === 'LIABILITY')

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

      {snapshotItems.length === 0 && (
        <p className="text-slate-500">
          No accounts carried over from a previous snapshot yet — add one below.
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

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
        {!addingAccount ? (
          <button
            type="button"
            onClick={() => setAddingAccount(true)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + Add an account
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Name</label>
                <input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Ally Savings"
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Category</label>
                <select
                  value={newAccountCategoryId}
                  onChange={(e) => setNewAccountCategoryId(e.target.value)}
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                  <option value={NEW_CATEGORY}>+ New category…</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">
                  Value (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccountValue}
                  onChange={(e) => setNewAccountValue(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-36 rounded-md border border-slate-300 px-3 py-2 text-right text-sm"
                />
              </div>
            </div>

            {newAccountCategoryId === NEW_CATEGORY && (
              <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">
                    New category name
                  </label>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Crypto"
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Type</label>
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddAccount}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Add account
              </button>
              <button
                type="button"
                onClick={() => setAddingAccount(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || snapshotItems.length === 0}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save snapshot'}
      </button>
    </form>
  )
}
