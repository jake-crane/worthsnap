export type CategoryType = 'ASSET' | 'LIABILITY'

export interface Category {
  id: number
  name: string
  type: CategoryType
}

export interface Item {
  id: number
  name: string
  categoryId: number
  categoryName: string
  type: CategoryType
  archived: boolean
}

export interface SnapshotSummary {
  id: number
  snapshotDate: string
  notes: string | null
  netWorth: number
}

export interface SnapshotEntryDetail {
  itemId: number
  itemName: string
  categoryName: string
  type: CategoryType
  value: number
  previousValue: number | null
  change: number | null
  percentChange: number | null
}

export interface SnapshotDetail {
  id: number
  snapshotDate: string
  notes: string | null
  netWorth: number
  previousNetWorth: number | null
  netWorthChange: number | null
  netWorthPercentChange: number | null
  entries: SnapshotEntryDetail[]
}

export interface NetWorthPoint {
  snapshotId: number
  snapshotDate: string
  netWorth: number
}
