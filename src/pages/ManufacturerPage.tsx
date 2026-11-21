import { Building2, Calendar, Globe, MapPin, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Avatar, Verified } from '../components/Avatar'
import { PostCard } from '../components/PostCard'
import { ProductCard } from '../components/ProductCard'
import { compact, fmt1, ratingStats } from '../lib/utils'
import { useMe, useStore } from '../store'

export default function ManufacturerPage() {
  const { id } = useParams()
  const me = useMe()!
  const m = useStore((s) => s.manufacturers.find((x) => x.id === id))
  const products = useStore((s) => s.products).filter((p) => p.manufacturerId === id)
  const reviews = useStore((s) => s.reviews)
  const accounts = useStore((s) => s.accounts)
  const posts = useStore((s) => s.posts).filter((p) => accounts.find((a) => a.id === p.accountId)?.manufacturerId === id)
  const following = useStore((s) => (s.follows[me.id] ?? []).includes(id ?? ''))
  const toggleFollow = useStore((s) => s.toggleFollow)
  const [tab, setTab] = useState<'products' | 'posts' | 'about'>('products')
  if (!m) return <Navigate to="/" replace />
  const isMine = me.manufacturerId === m.id
  const totalRatings = products.reduce((a, p) => a + ratingStats(p, reviews).count, 0)
  const avg = totalRatings ? products.reduce((a, p) => { const s = ratingStats(p, reviews); return a + s.avg * s.count }, 0) / totalRatings : 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
      <section className="card overflow-hidden">
        <div className="h-36" style={{ background: `linear-gradient(120deg, ${m.color}, ${m.color}55 60%, #e0e7ff)` }} />
        <div className="px-6 pb-4">
          <div className="-mt-12 rounded-xl bg-white p-1 inline-block shadow-sm"><Avatar name={m.name} color={m.color} size={96} square /></div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-1.5 text-2xl font-bold text-slate-900">{m.name} {m.verified && <Verified />}</h1>
              <p className="text-slate-600">{m.tagline}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="size-4" />{m.location}</span>
                <span className="flex items-center gap-1"><Users className="size-4" />{compact(m.followers)} followers</span>
                <span>★ {fmt1(avg)} avg across {compact(totalRatings)} ratings</span>
              </div>
            </div>
            {isMine ? (
              <Link to="/dashboard/new" className="btn-primary"><Plus className="size-4" /> Add product</Link>
            ) : (
              <button onClick={() => toggleFollow(m.id)} className={following ? 'btn-ghost border border-slate-300' : 'btn-primary'}>{following ? '✓ Following' : '+ Follow'}</button>
            )}
          </div>
        </div>
        <nav className="flex border-t border-slate-200 px-2">
          {(['products', 'posts', 'about'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize ${tab === t ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {t}{t === 'products' && ` (${products.length})`}
            </button>
          ))}
        </nav>
      </section>

      <div className="mt-4">
        {tab === 'products' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        {tab === 'posts' && <div className="mx-auto max-w-2xl space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} />)}{!posts.length && <div className="card p-8 text-center text-slate-500">No posts yet.</div>}</div>}
        {tab === 'about' && (
          <section className="card p-6">
            <h2 className="font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-slate-600">{m.about}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex gap-2"><Globe className="size-4 text-slate-400" /><dt className="text-slate-500">Website</dt><dd className="font-medium text-indigo-600">{m.website}</dd></div>
              <div className="flex gap-2"><Building2 className="size-4 text-slate-400" /><dt className="text-slate-500">Company size</dt><dd className="font-medium">{m.employees} employees</dd></div>
              <div className="flex gap-2"><MapPin className="size-4 text-slate-400" /><dt className="text-slate-500">Headquarters</dt><dd className="font-medium">{m.location}</dd></div>
              <div className="flex gap-2"><Calendar className="size-4 text-slate-400" /><dt className="text-slate-500">Founded</dt><dd className="font-medium">{m.founded}</dd></div>
            </dl>
          </section>
        )}
      </div>
    </main>
  )
}
