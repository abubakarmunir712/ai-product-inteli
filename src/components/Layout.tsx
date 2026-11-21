import { ChevronDown, Compass, Home, LayoutDashboard, LogOut, RotateCcw, Search, Sparkles, X, ArrowRightLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../data/seed'
import { useMe, useStore } from '../store'
import { Avatar } from './Avatar'
import { ProductVisual } from './ProductVisual'

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: typeof Home; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 border-b-2 px-3 pt-2 pb-1.5 text-xs transition-colors sm:min-w-20 ${
          isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
        }`
      }
    >
      <Icon className="size-5" />
      <span className="hidden sm:block">{label}</span>
    </NavLink>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img src="/favicon.svg" alt="" className="size-8" />
      <span className="text-lg font-bold tracking-tight text-slate-900">{APP_NAME}</span>
    </Link>
  )
}

function SearchBox() {
  const products = useStore((s) => s.products)
  const manufacturers = useStore((s) => s.manufacturers)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const results = q.trim()
    ? [
        ...manufacturers.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).map((m) => ({ key: m.id, label: m.name, sub: 'Manufacturer', to: `/m/${m.id}` })),
        ...products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())).map((p) => ({ key: p.id, label: p.name, sub: p.category, to: `/products/${p.id}` })),
      ].slice(0, 7)
    : []
  return (
    <div className="relative hidden md:block">
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter') { nav(`/explore?q=${encodeURIComponent(q)}`); setOpen(false) } }}
        placeholder="Search products & manufacturers"
        className="w-72 rounded-md bg-slate-100 py-2 pr-3 pl-9 text-sm outline-none focus:w-96 focus:ring-2 focus:ring-indigo-200 transition-all"
      />
      {open && results.length > 0 && (
        <div className="card absolute top-11 left-0 z-50 w-96 overflow-hidden py-1 shadow-lg">
          {results.map((r) => (
            <Link key={r.key} to={r.to} onClick={() => { setQ(''); setOpen(false) }} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-900">{r.label}</span>
              <span className="text-xs text-slate-500">{r.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const me = useMe()!
  const logout = useStore((s) => s.logout)
  const reset = useStore((s) => s.reset)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex flex-col items-center gap-0.5 px-3 pt-2 pb-1.5 text-xs text-slate-500 hover:text-slate-900">
        <Avatar name={me.name} color={me.color} size={22} square={me.role === 'manufacturer'} />
        <span className="hidden items-center sm:flex">Me <ChevronDown className="size-3" /></span>
      </button>
      {open && (
        <div className="card absolute top-14 right-0 z-50 w-72 py-2 shadow-lg">
          <div className="flex gap-3 px-4 pb-3">
            <Avatar name={me.name} color={me.color} size={48} square={me.role === 'manufacturer'} />
            <div>
              <div className="font-semibold text-slate-900">{me.name}</div>
              <div className="text-xs text-slate-500">{me.headline}</div>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${me.role === 'manufacturer' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {me.role === 'manufacturer' ? 'Manufacturer account' : 'User account'}
              </span>
            </div>
          </div>
          {me.manufacturerId && (
            <Link to={`/m/${me.manufacturerId}`} onClick={() => setOpen(false)} className="mx-4 mb-2 block rounded-full border border-indigo-600 py-1 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50">View company page</Link>
          )}
          <div className="border-t border-slate-100 pt-1 text-sm">
            <button onClick={() => { logout(); nav('/login') }} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><ArrowRightLeft className="size-4" /> Switch account</button>
            <button onClick={() => { reset(); nav('/login') }} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><RotateCcw className="size-4" /> Reset demo data</button>
            <button onClick={() => { logout(); nav('/login') }} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><LogOut className="size-4" /> Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CompareTray() {
  const compare = useStore((s) => s.compare)
  const products = useStore((s) => s.products)
  const manufacturers = useStore((s) => s.manufacturers)
  const toggle = useStore((s) => s.toggleCompare)
  const clear = useStore((s) => s.clearCompare)
  const newChat = useStore((s) => s.newChat)
  const nav = useNavigate()
  const { pathname } = useLocation()
  if (!compare.length || pathname.startsWith('/assistant')) return null
  const items = compare.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-3">
      <div className="card fade-up flex w-full max-w-3xl items-center gap-3 p-3 shadow-xl">
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {items.map((p) => (
            <div key={p!.id} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 py-1 pr-2 pl-1">
              <ProductVisual category={p!.category} color={manufacturers.find((m) => m.id === p!.manufacturerId)?.color ?? '#6366f1'} className="size-9 rounded-md" iconSize={18} />
              <span className="text-sm font-medium">{p!.name}</span>
              <button onClick={() => toggle(p!.id)} className="text-slate-400 hover:text-slate-700"><X className="size-4" /></button>
            </div>
          ))}
          {items.length < 2 && <span className="self-center text-sm text-slate-500">Add one more product to compare</span>}
        </div>
        <button onClick={clear} className="btn-ghost hidden sm:inline-flex">Clear</button>
        <button
          disabled={items.length < 2}
          onClick={() => {
            const id = newChat(compare)
            clear()
            nav(`/assistant/${id}?auto=1`)
          }}
          className="btn-primary shrink-0"
        >
          <Sparkles className="size-4" /> Compare with AI
        </button>
      </div>
    </div>
  )
}

export function Layout() {
  const me = useMe()!
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <SearchBox />
          </div>
          <nav className="flex items-end">
            <NavItem to="/" end icon={Home} label="Home" />
            <NavItem to="/explore" icon={Compass} label="Explore" />
            <NavItem to="/assistant" icon={Sparkles} label="AI Assistant" />
            {me.role === 'manufacturer' && <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
            <AccountMenu />
          </nav>
        </div>
      </header>
      <Outlet />
      <CompareTray />
    </div>
  )
}
