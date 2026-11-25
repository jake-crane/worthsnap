import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { beginRefresh, OfflineError, readSaved, useConnection } from './offline'

// Data loading that doesn't wait on the server. The backend can take a while
// to wake up, so a page shows what it has right away (from this session, or
// the copy the service worker saved last time) and swaps in the fresh data
// when it arrives. With nothing to show yet, it waits for the server.

/** The latest data per API path in this session, so revisits render at once. */
const recent = new Map<string, unknown>()

/** Data for a GET path under /api: whatever is on hand first, then a fresh copy. */
export async function loadThenRefresh<T>(
  path: string,
  show: (data: T) => void,
): Promise<T> {
  let fresh = false
  const onHand = recent.get(path) as T | undefined
  if (onHand !== undefined) show(onHand)
  else
    readSaved<T>(`/api${path}`).then((saved) => {
      if (saved !== null && !fresh) show(saved)
    })

  const endRefresh = beginRefresh()
  try {
    const data = await api.get<T>(path)
    fresh = true
    recent.set(path, data)
    show(data)
    return data
  } finally {
    endRefresh()
  }
}

interface Result<T> {
  path: string
  data?: T
  error?: string
}

/**
 * Loads a GET path under /api for a page. `data` is undefined until there's
 * something to show; `error` is set only when there's nothing to show.
 */
export function useApiData<T>(path: string) {
  const { reconnects } = useConnection()
  const [result, setResult] = useState<Result<T>>(() => ({
    path,
    data: recent.get(path) as T | undefined,
  }))

  useEffect(() => {
    let cancelled = false
    loadThenRefresh<T>(path, (data) => {
      if (!cancelled) setResult({ path, data })
    }).catch((e) => {
      if (cancelled) return
      // Showing saved data offline is fine: the banner says so.
      setResult((prev) =>
        prev.path === path && prev.data !== undefined
          ? prev
          : { path, error: e instanceof OfflineError ? e.message : String(e) },
      )
    })
    return () => {
      cancelled = true
    }
  }, [path, reconnects])

  /** Updates the data on screen after a change made here (e.g. a delete). */
  const update = useCallback(
    (change: (data: T) => T) => {
      setResult((prev) => {
        if (prev.path !== path || prev.data === undefined) return prev
        const data = change(prev.data)
        recent.set(path, data)
        return { path, data }
      })
    },
    [path],
  )

  const current: Omit<Result<T>, 'path'> =
    result.path === path ? result : { data: recent.get(path) as T | undefined }
  return { data: current.data, error: current.error, update }
}
