import { Eye, FileText, GitCompareArrows, Plus, Star, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ProductVisual } from '../components/ProductVisual'
import { Stars } from '../components/Stars'
import { compact, fmt1, money, ratingStats, timeAgo } from '../lib/utils'
import { useMe, useStore } from '../store'

// Deterministic "times compared by AI" so numbers are stable between renders
const comparisons = (id: string) => 120 + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 900

export default function Dashboard() {
  const me = useMe()!
  const m = useStore((s) => s.manufacturers.find((x) => x.id === me.manufacturerId))!
  const allProducts = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const accounts = useStore((s) => s.accounts)
  const products = allProducts.filter((p) => p.manufacturerId === m.id)
  const myReviews = reviews.filter((r) => products.some((p) => p.id === r.productId))
  const totalRatings = products.reduce((a, p) => a + ratingStats(p, reviews).count, 0)
  const avg = totalRatings ? products.reduce((a, p) => { const s = ratingStats(p, reviews); return a + s.avg * s.count }, 0) / totalRatings : 0
  const rivals = allProducts
    .filter((p) => p.manufacturerId !== m.id && products.some((x) => x.category === p.category))
    .map((p) => ({ p, n: comparisons(p.id + m.id) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)

  const tiles = [
    { icon: Eye, label: 'Product views', value: compact(products.reduce((a, p) => a + p.views, 0)), delta: '+12.4%' },
    { icon: Users, label: 'Followers', value: compact(m.followers), delta: '+3.1%' },
    { icon: Star, label: 'Average rating', value: totalRatings ? fmt1(avg) : '—', delta: `${compact(totalRatings)} ratings` },
    { icon: GitCompareArrows, label: 'AI comparisons', value: compact(products.reduce((a, p) => a + comparisons(p.id), 0)), delta: 'last 30 days' },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={m.name} color={m.color} size={48} square />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Manufacturer dashboard</h1>
            <p className="text-sm text-slate-500">{m.name} · how your products perform on the network</p>
          </div>
        </div>
        <Link to="/dashboard/new" className="btn-primary"><Plus className="size-4" /> Upload product</Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, delta }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500"><Icon className="size-4" /> {label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
            <div className={`text-xs ${delta.startsWith('+') ? 'font-semibold text-emerald-600' : 'text-slate-400'}`}>{delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Your products</h2>
            <span className="text-sm text-slate-500">{products.length} listed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr><th className="px-5 py-2.5 font-semibold">Product</th><th className="px-3 font-semibold">Price</th><th className="px-3 font-semibold">Rating</th><th className="px-3 font-semibold">Views</th><th className="px-3 font-semibold">Docs</th><th className="px-3 font-semibold">AI compares</th></tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const st = ratingStats(p, reviews)
                  return (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link to={`/products/${p.id}`} className="flex items-center gap-3">
                          <ProductVisual category={p.category} color={m.color} className="size-10 shrink-0 rounded-lg" iconSize={20} />
                          <div><div className="font-semibold hover:text-indigo-600">{p.name}</div><div className="text-xs text-slate-500">{p.category}</div></div>
                        </Link>
                      </td>
                      <td className="px-3">{money(p.price)}</td>
                      <td className="px-3">{st.count ? <span className="flex items-center gap-1"><Stars value={st.avg} size={12} /> {fmt1(st.avg)} <span className="text-slate-400">({compact(st.count)})</span></span> : <span className="text-slate-400">No ratings yet</span>}</td>
                      <td className="px-3">{compact(p.views)}</td>
                      <td className="px-3"><span className="inline-flex items-center gap-1"><FileText className="size-3.5 text-red-500" />{p.manuals.length}</span></td>
                      <td className="px-3">{compact(comparisons(p.id))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!products.length && <div className="p-10 text-center text-slate-500">No products yet. <Link to="/dashboard/new" className="text-indigo-600">Upload your first product</Link>.</div>}
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Most compared against</h2>
            <p className="text-xs text-slate-500">Competitors users ask the AI about alongside your products</p>
            <div className="mt-4 space-y-3">
              {rivals.map(({ p, n }) => (
                <Link key={p.id} to={`/products/${p.id}`} className="flex items-center justify-between text-sm hover:text-indigo-600">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-slate-500">{n} chats</span>
                </Link>
              ))}
              {!rivals.length && <div className="text-sm text-slate-400">Not enough data yet.</div>}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Latest reviews</h2>
            <div className="mt-3 space-y-4">
              {myReviews.slice(0, 4).map((r) => {
                const a = accounts.find((x) => x.id === r.accountId)!
                const p = products.find((x) => x.id === r.productId)!
                return (
                  <div key={r.id} className="text-sm">
                    <div className="flex items-center gap-2"><Avatar name={a.name} color={a.color} size={24} /><span className="font-medium">{a.name}</span><span className="ml-auto text-xs text-slate-400">{timeAgo(r.date)}</span></div>
                    <div className="mt-1 flex items-center gap-1.5"><Stars value={r.rating} size={11} /><span className="text-xs text-slate-500">on {p.name}</span></div>
                    <div className="mt-0.5 font-medium">{r.title}</div>
                  </div>
                )
              })}
              {!myReviews.length && <div className="text-sm text-slate-400">No reviews yet.</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
