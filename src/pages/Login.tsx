import { Building2, FileText, Sparkles, Star, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Logo } from '../components/Layout'
import type { Role } from '../data/types'
import { useStore } from '../store'

export default function Login() {
  const accounts = useStore((s) => s.accounts)
  const login = useStore((s) => s.login)
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('user')
  const list = accounts.filter((a) => a.role === role)

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Interactive prototype</span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 lg:grid-cols-2">
        <section>
          <h1 className="text-4xl leading-tight font-light text-slate-800 sm:text-5xl">
            The professional network <span className="font-semibold text-indigo-600">for products</span>.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-slate-600">
            Manufacturers publish products, manuals and spec sheets. Users rate what they own. An AI assistant turns it all into honest, side-by-side comparisons.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: FileText, t: 'Official specs & manuals', d: 'Straight from verified manufacturers' },
              { icon: Star, t: 'Real user ratings', d: 'From people who actually own the product' },
              { icon: Sparkles, t: 'AI comparisons', d: 'Ask about any two products and see which gives you more value' },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50"><Icon className="size-5 text-indigo-600" /></span>
                <div>
                  <div className="font-semibold text-slate-900">{t}</div>
                  <div className="text-sm text-slate-500">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card mx-auto w-full max-w-md p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Choose an account type and a demo profile.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {([
              ['user', User, 'User', 'Rate & compare'],
              ['manufacturer', Building2, 'Manufacturer', 'Publish products'],
            ] as const).map(([r, Icon, label, sub]) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex flex-col items-center rounded-lg px-3 py-3 transition-all ${role === r ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icon className={`size-5 ${role === r ? 'text-indigo-600' : ''}`} />
                <span className="mt-1 text-sm font-semibold">{label}</span>
                <span className="text-xs text-slate-500">{sub}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            {list.map((a) => (
              <button
                key={a.id}
                onClick={() => { login(a.id); nav('/') }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
              >
                <Avatar name={a.name} color={a.color} size={40} square={a.role === 'manufacturer'} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{a.name}</div>
                  <div className="truncate text-xs text-slate-500">{a.headline}</div>
                </div>
                <span className="text-sm font-semibold text-indigo-600">Continue →</span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Demo only — no password required. Data is stored in your browser.</p>
        </section>
      </main>
    </div>
  )
}
