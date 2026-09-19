export interface LineItem {
  description: string
  amount: number
  previousAmount: number | null
  change: number | null
  percentChange: number | null
}

export interface SnapshotSummary {
  id: number
  snapshotDate: string
  notes: string | null
  netWorth: number
}

export interface SnapshotDetail {
  id: number
  snapshotDate: string
  notes: string | null
  netWorth: number
  previousNetWorth: number | null
  netWorthChange: number | null
  netWorthPercentChange: number | null
  lineItems: LineItem[]
}

export interface NetWorthPoint {
  snapshotId: number
  snapshotDate: string
  netWorth: number
}
