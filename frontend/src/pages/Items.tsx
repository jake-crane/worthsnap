import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Category, CategoryType, Item } from '../types'

export default function Items() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>('ASSET')

  const [itemName, setItemName] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState<number | ''>('')

  function reload() {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Item[]>('/items'),
    ])
      .then(([cats, its]) => {
        setCategories(cats)
        setItems(its)
        if (cats.length > 0 && itemCategoryId === '') setItemCategoryId(cats[0].id)
      })
      .catch((e) => setError(String(e)))
  }

  useEffect(reload, [])

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName.trim()) return
    await api.post('/categories', { name: categoryName, type: categoryType })
    setCategoryName('')
    reload()
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim() || itemCategoryId === '') return
    await api.post('/items', { name: itemName, categoryId: itemCategoryId })
    setItemName('')
    reload()
  }

  async function toggleArchived(item: Item) {
    await api.patch(`/items/${item.id}`, { archived: !item.archived })
    reload()
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-red-600">Failed to load: {error}</p>}

      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
        <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Name
            </label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Checking accounts"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Type
            </label>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as CategoryType)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Add category
          </button>
        </form>

        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-900">{c.name}</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {c.type}
              </span>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">No categories yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Items</h1>
        <form onSubmit={addItem} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Name
            </label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Chase Checking"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Category
            </label>
            <select
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(Number(e.target.value))}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={categories.length === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Add item
          </button>
        </form>
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">Add a category first.</p>
        )}

        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className={item.archived ? 'text-slate-400 line-through' : 'text-slate-900'}>
                  {item.name}
                </span>
                <span className="ml-2 text-xs text-slate-500">{item.categoryName}</span>
              </div>
              <button
                onClick={() => toggleArchived(item)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                {item.archived ? 'Unarchive' : 'Archive'}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">No items yet.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
