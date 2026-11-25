import { useSyncExternalStore } from 'react'

// Connection state for the UI. The service worker (public/sw.js) answers API
// requests from its saved copies when the server can't be reached, and marks
// those responses with X-WorthSnap-Offline. That's more reliable than
// navigator.onLine, which stays true on Wi-Fi with no internet.

export const API_CACHE = 'worthsnap-api' // must match public/sw.js
const OFFLINE_HEADER = 'X-WorthSnap-Offline'
const SAVED_AT_HEADER = 'X-WorthSnap-Saved-At'
const RECONNECT_CHECK_MS = 15_000

/** Thrown when there's no connection and no saved copy of what was asked for. */
export class OfflineError extends Error {
  constructor(message = "You're offline, and this hasn't been saved on this device yet.") {
    super(message)
    this.name = 'OfflineError'
  }
  // Pages show errors with String(e): skip the "OfflineError:" prefix.
  toString() {
    return this.message
  }
}

export interface ConnectionState {
  offline: boolean
  /** When the oldest data on screen was saved (ISO), if known. */
  savedAt: string | null
  /** Saved data is on screen and a fresh copy is on its way. */
  refreshing: boolean
  /** Goes up each time the server is reachable again after being offline. */
  reconnects: number
}

let state: ConnectionState = { offline: false, savedAt: null, refreshing: false, reconnects: 0 }
let pendingRefreshes = 0
const listeners = new Set<() => void>()
let reconnectTimer: ReturnType<typeof setInterval> | undefined

function setState(patch: Partial<ConnectionState>) {
  const next = { ...state, ...patch }
  if (state.offline && !next.offline) next.reconnects = state.reconnects + 1
  if ((Object.keys(next) as (keyof ConnectionState)[]).every((k) => next[k] === state[k])) return
  state = next
  listeners.forEach((listener) => listener())

  // While offline, check now and then whether the server is back.
  if (state.offline && !reconnectTimer) {
    reconnectTimer = setInterval(checkServer, RECONNECT_CHECK_MS)
  } else if (!state.offline && reconnectTimer) {
    clearInterval(reconnectTimer)
    reconnectTimer = undefined
  }
}

function markOffline(savedAt: string | null) {
  // Keep the oldest timestamp: that's how stale the screen might be.
  const oldest =
    state.offline && state.savedAt && savedAt && state.savedAt < savedAt ? state.savedAt : savedAt
  setState({ offline: true, savedAt: oldest ?? state.savedAt })
}

/**
 * Updates the connection state from an API response. Throws OfflineError if
 * the response says the data isn't available offline.
 */
export function noteResponse(res: Response): Response {
  const offline = res.headers.get(OFFLINE_HEADER)
  if (offline === 'unavailable') {
    markOffline(null)
    throw new OfflineError()
  }
  if (offline) markOffline(res.headers.get(SAVED_AT_HEADER))
  else setState({ offline: false, savedAt: null })
  return res
}

/**
 * Marks a background refresh of on-screen data as started. Call the returned
 * function when it settles.
 */
export function beginRefresh(): () => void {
  pendingRefreshes++
  setState({ refreshing: true })
  let ended = false
  return () => {
    if (ended) return
    ended = true
    pendingRefreshes--
    setState({ refreshing: pendingRefreshes > 0 })
  }
}

/**
 * The copy of an API GET the service worker last saved, or null. Read
 * straight from the cache, so it's there in milliseconds even when the
 * server is slow to wake up.
 */
export async function readSaved<T>(path: string): Promise<T | null> {
  if (typeof caches === 'undefined') return null
  try {
    const res = await caches.match(path, { cacheName: API_CACHE, ignoreVary: true })
    return res?.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

/** fetch() for API calls, with connection tracking. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let res: Response
  try {
    res = await fetch(input, init)
  } catch {
    // No service worker to answer (first visit, or a write request).
    markOffline(null)
    throw new OfflineError("You're offline. Try again when you're back online.")
  }
  return noteResponse(res)
}

function checkServer() {
  fetch('/api/me')
    .then(noteResponse)
    .catch(() => {})
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => markOffline(state.savedAt))
  window.addEventListener('online', checkServer)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useConnection(): ConnectionState {
  return useSyncExternalStore(subscribe, () => state)
}

/** Removes this account's data from the device (on sign-out). */
export async function clearOfflineData() {
  if ('caches' in window) await caches.delete(API_CACHE).catch(() => false)
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('worthsnap:')) localStorage.removeItem(key)
    }
  } catch {
    // Storage unavailable: nothing saved there.
  }
}

/**
 * Registers the service worker in production builds. In development it
 * removes any worker instead: one left over from previewing a production
 * build on the same port would otherwise serve stale pages.
 */
export function setUpServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) registration.unregister()
    })
    return
  }
  navigator.serviceWorker
    .register('/sw.js', { scope: '/', updateViaCache: 'none' })
    .catch((error) => console.error('Service worker registration failed', error))
}
