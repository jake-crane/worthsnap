import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Snapshots from './pages/Snapshots'
import NewSnapshot from './pages/NewSnapshot'
import SnapshotDetail from './pages/SnapshotDetail'
import Login from './pages/Login'
import { fetchCurrentUser, logout, type CurrentUser } from './lib/auth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function App() {
  const [user, setUser] = useState<CurrentUser | null | 'loading'>('loading')

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  if (user === 'loading') {
    return <div className="p-8 text-center text-slate-500">Loading…</div>
  }

  if (user === null) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">WorthSnap</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/snapshots" className={navLinkClass}>
              Snapshots
            </NavLink>
            <div className="ml-3 flex items-center gap-2 border-l border-slate-200 pl-3">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
              )}
              <span className="text-sm text-slate-500">{user.name ?? user.email}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-sm font-medium text-slate-400 hover:text-slate-900"
              >
                Sign out
              </button>
            </div>
          </nav>
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
