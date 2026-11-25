import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Snapshots from './pages/Snapshots'
import NewSnapshot from './pages/NewSnapshot'
import SnapshotDetail from './pages/SnapshotDetail'
import Login from './pages/Login'
import { fetchCurrentUser, logout, type CurrentUser } from './lib/auth'
import { beginRefresh, OfflineError, readSaved, useConnection } from './lib/offline'
import { formatDateTime } from './lib/format'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

function OfflineBanner() {
  const { offline, savedAt } = useConnection()
  if (!offline) return null
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
    >
      <span className="font-medium">You're offline.</span>{' '}
      {savedAt ? `Showing data saved ${formatDateTime(savedAt)}.` : 'Showing data saved on this device.'}{' '}
      Changes need a connection.
    </div>
  )
}

/** Shown while saved data is on screen and fresh data is on its way. */
function RefreshingNote() {
  const { refreshing, offline } = useConnection()
  if (!refreshing || offline) return null
  return (
    // Fades in after a second, so quick refreshes don't flash it.
    <span
      role="status"
      className="flex animate-[appear_200ms_ease-out_1s_both] items-center gap-1.5 text-xs font-normal text-slate-400"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
      Updating…
    </span>
  )
}

function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">You're offline</h1>
        <p className="text-sm text-slate-500">
          Connect to the internet and sign in once. After that, WorthSnap opens without a
          connection.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<CurrentUser | null | 'loading' | 'offline'>('loading')
  const { offline } = useConnection()

  function loadUser() {
    // Open with the account saved on this device rather than waiting for the
    // server, which can be slow to wake up. The server's answer replaces it,
    // or sends you to sign in if the session has ended.
    let answered = false
    readSaved<CurrentUser>('/api/me').then((saved) => {
      if (saved && !answered) setUser((u) => (u === 'loading' || u === 'offline' ? saved : u))
    })
    const endRefresh = beginRefresh()
    fetchCurrentUser()
      .then((fresh) => {
        answered = true
        setUser(fresh)
      })
      .catch((e) =>
        setUser((u) =>
          typeof u === 'object' && u !== null ? u : e instanceof OfflineError ? 'offline' : null,
        ),
      )
      .finally(endRefresh)
  }

  useEffect(loadUser, [])

  if (user === 'loading') {
    // Normally replaced by the saved account within milliseconds. Only seen
    // on a first visit, before anything is saved on the device.
    return (
      <div className="animate-[appear_200ms_ease-out_500ms_both] p-8 text-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (user === 'offline') {
    return <OfflineScreen onRetry={loadUser} />
  }

  if (user === null) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex sm:justify-between">
          <span className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            WorthSnap
            <RefreshingNote />
          </span>
          <nav className="col-span-2 row-start-2 flex items-center gap-1 sm:ml-auto">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/snapshots" className={navLinkClass}>
              Snapshots
            </NavLink>
          </nav>
          <div className="flex min-w-0 items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-3">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name ?? user.email ?? ""}
                title={user.name ?? user.email ?? undefined}
                className="h-7 w-7 shrink-0 rounded-full sm:h-6 sm:w-6"
              />
            )}
            <span
              className={`truncate text-sm whitespace-nowrap text-slate-500 ${
                user.avatarUrl ? 'hidden sm:inline' : 'max-w-[10rem]'
              }`}
            >
              {user.name ?? user.email}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              disabled={offline}
              title={offline ? 'Connect to the internet to sign out' : undefined}
              className="shrink-0 text-sm font-medium whitespace-nowrap text-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/snapshots" element={<Snapshots />} />
          <Route path="/snapshots/new" element={<NewSnapshot />} />
          <Route path="/snapshots/:id" element={<SnapshotDetail />} />
        </Routes>
      </main>
    </div>
  )
}
