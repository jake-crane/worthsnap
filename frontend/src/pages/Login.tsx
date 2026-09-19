const providers = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'github', label: 'Continue with GitHub' },
]

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">WorthSnap</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to track your net worth.</p>
        </div>
        <div className="space-y-2">
          {providers.map((p) => (
            <a
              key={p.id}
              href={`/oauth2/authorization/${p.id}`}
              className="block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
