import { Calendar, Check, Download, Eye, FileText, GitCompareArrows, ShieldCheck, Sparkles, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Verified } from '../components/Avatar'
import { ProductCard } from '../components/ProductCard'
import { ProductVisual } from '../components/ProductVisual'
import { StarInput, Stars } from '../components/Stars'
import { CATEGORY_DIMENSIONS } from '../data/seed'
import type { ManualFile, Product } from '../data/types'
import { compact, fmt1, money, ratingStats, timeAgo, valueScore } from '../lib/utils'
import { useMe, useStore } from '../store'

type Tab = 'overview' | 'specs' | 'docs' | 'reviews'

export function ScoreBars({ product }: { product: Product }) {
  const dims = CATEGORY_DIMENSIONS[product.category]
  return (
    <div className="space-y-2.5">
      {dims.map((d) => {
        const v = product.scores[d] ?? 0
        return (
          <div key={d}>
            <div className="flex justify-between text-sm"><span className="text-slate-600">{d}</span><span className="font-semibold">{fmt1(v)}</span></div>
            <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${v * 10}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function DocPreview({ doc, product, onClose }: { doc: ManualFile; product: Product; onClose: () => void }) {
  const groups = [...new Set(product.specs.map((s) => s.group))]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="card fade-up flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-red-500" /> {doc.name}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto bg-slate-200 p-6">
          <div className="mx-auto bg-white p-10 shadow-md">
            <div className="text-xs tracking-widest text-slate-400 uppercase">{doc.kind}</div>
            <h2 className="mt-1 text-2xl font-bold">{product.name}</h2>
            <p className="mt-3 text-sm text-slate-600">{product.description}</p>
            {groups.map((g) => (
              <div key={g} className="mt-6">
                <h3 className="border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">{g}</h3>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {product.specs.filter((s) => s.group === g).map((s) => (
                      <tr key={s.label}><td className="w-1/3 py-1 text-slate-500">{s.label}</td><td className="py-1">{s.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="mt-10 text-center text-xs text-slate-400">Page 1 of {doc.pages}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const me = useMe()!
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const accounts = useStore((s) => s.accounts)
  const product = products.find((p) => p.id === id)
  const m = useStore((s) => s.manufacturers.find((x) => x.id === product?.manufacturerId))
  const following = useStore((s) => (s.follows[me.id] ?? []).includes(product?.manufacturerId ?? ''))
  const toggleFollow = useStore((s) => s.toggleFollow)
  const inCompare = useStore((s) => s.compare.includes(id ?? ''))
  const toggleCompare = useStore((s) => s.toggleCompare)
  const addReview = useStore((s) => s.addReview)
  const newChat = useStore((s) => s.newChat)
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [preview, setPreview] = useState<ManualFile | null>(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [share, setShare] = useState(true)
  const [helpful, setHelpful] = useState<string[]>([])

  if (!product || !m) return <Navigate to="/explore" replace />

  const st = ratingStats(product, reviews)
  const productReviews = reviews.filter((r) => r.productId === product.id)
  const alreadyReviewed = productReviews.some((r) => r.accountId === me.id)
  const isOwner = me.manufacturerId === product.manufacturerId
  const similar = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3)
  const groups = [...new Set(product.specs.map((s) => s.group))]
  const value = valueScore(product, products, reviews)

  const tabs: [Tab, string][] = [['overview', 'Overview'], ['specs', 'Specifications'], ['docs', `Manuals & docs (${product.manuals.length})`], ['reviews', `Reviews (${productReviews.length})`]]

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="grid md:grid-cols-[320px_1fr]">
              <ProductVisual category={product.category} color={m.color} className="h-64 md:h-full" iconSize={110} />
              <div className="p-6">
                <Link to={`/m/${m.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600">{m.name} {m.verified && <Verified />}</Link>
                <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5"><Stars value={st.avg} size={16} /><b>{fmt1(st.avg)}</b><span className="text-slate-500">({st.count.toLocaleString()} ratings)</span></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1 text-slate-500"><Eye className="size-4" /> {compact(product.views)} views</span>
                  <span className="flex items-center gap-1 text-slate-500"><Calendar className="size-4" /> Released {new Date(product.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold">{money(product.price)}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Value score {fmt1(value)}/10</span>
                </div>
                <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  {product.highlights.map((h) => <li key={h} className="flex items-start gap-1.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{h}</li>)}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => nav(`/assistant/${newChat([product.id])}?auto=1`)} className="btn-primary"><Sparkles className="size-4" /> Ask AI about this</button>
                  <button onClick={() => toggleCompare(product.id)} className={inCompare ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-outline'}>
                    {inCompare ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />} {inCompare ? 'Added to compare' : 'Add to compare'}
                  </button>
                  {me.role === 'user' && !alreadyReviewed && <button onClick={() => setTab('reviews')} className="btn-ghost border border-slate-300">Rate this product</button>}
                </div>
              </div>
            </div>
            <nav className="flex overflow-x-auto border-t border-slate-200 px-2">
              {tabs.map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap ${tab === t ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
              ))}
            </nav>
          </section>

          {tab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2">
              <section className="card p-5 md:col-span-2">
                <h2 className="font-semibold text-slate-900">About this product</h2>
                <p className="mt-2 text-slate-600">{product.description}</p>
              </section>
              <section className="card p-5">
                <h2 className="font-semibold text-slate-900">Performance profile</h2>
                <p className="mb-4 text-xs text-slate-500">Scores extracted by AI from the spec sheet and user reviews</p>
                <ScoreBars product={product} />
              </section>
              <section className="card p-5">
                <h2 className="font-semibold text-slate-900">Ratings</h2>
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-5xl font-bold">{fmt1(st.avg)}</div>
                  <div><Stars value={st.avg} size={18} /><div className="text-sm text-slate-500">{st.count.toLocaleString()} ratings</div></div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {st.dist.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-slate-500">{5 - i}★</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${st.count ? (n / st.count) * 100 : 0}%` }} /></div>
                      <span className="w-10 text-right text-slate-500">{st.count ? Math.round((n / st.count) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'specs' && (
            <section className="card divide-y divide-slate-100">
              {groups.map((g) => (
                <div key={g} className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
                  <h3 className="font-semibold text-slate-900">{g}</h3>
                  <dl className="space-y-2">
                    {product.specs.filter((s) => s.group === g).map((s) => (
                      <div key={s.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm"><dt className="text-slate-500">{s.label}</dt><dd className="font-medium">{s.value}</dd></div>
                    ))}
                  </dl>
                </div>
              ))}
            </section>
          )}

          {tab === 'docs' && (
            <section className="card p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="size-4 text-emerald-600" /> Official documents uploaded by {m.name}. The AI assistant uses these to answer your questions.</div>
              <div className="mt-4 divide-y divide-slate-100">
                {product.manuals.map((d) => (
                  <div key={d.name} className="flex items-center gap-3 py-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-red-50"><FileText className="size-5 text-red-500" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{d.name}</div>
                      <div className="text-xs text-slate-500">PDF · {d.pages} pages · {d.size}</div>
                    </div>
                    <button onClick={() => setPreview(d)} className="btn-ghost"><Eye className="size-4" /> <span className="hidden sm:inline">Preview</span></button>
                    <button onClick={() => setPreview(d)} className="btn-outline px-3"><Download className="size-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'reviews' && (
            <section className="space-y-4">
              {me.role === 'user' && !alreadyReviewed && (
                <form
                  className="card space-y-3 p-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    addReview({ productId: product.id, accountId: me.id, rating, title, body }, share)
                    setRating(0); setTitle(''); setBody('')
                  }}
                >
                  <h2 className="font-semibold text-slate-900">Rate {product.name}</h2>
                  <StarInput value={rating} onChange={setRating} />
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum up your experience in one line" className="input" />
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="What did you like or dislike? How long have you used it?" className="input resize-none" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="accent-indigo-600" /> Share to my feed</label>
                    <button disabled={!rating || !title.trim()} className="btn-primary">Submit review</button>
                  </div>
                </form>
              )}
              {isOwner && <div className="card p-4 text-sm text-slate-600">You're viewing your own product. Manufacturers can't rate their products — reviews come from verified users only.</div>}
              {productReviews.map((r) => {
                const a = accounts.find((x) => x.id === r.accountId)!
                const h = helpful.includes(r.id)
                return (
                  <article key={r.id} className="card p-5">
                    <div className="flex gap-3">
                      <Avatar name={a.name} color={a.color} size={40} />
                      <div className="flex-1">
                        <div className="flex justify-between"><span className="font-semibold">{a.name}</span><span className="text-xs text-slate-500">{timeAgo(r.date)}</span></div>
                        <div className="text-xs text-slate-500">{a.headline}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2"><Stars value={r.rating} /><span className="font-semibold">{r.title}</span></div>
                    {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">Verified owner</span>
                      <button onClick={() => setHelpful((x) => (h ? x.filter((y) => y !== r.id) : [...x, r.id]))} className={`ml-auto inline-flex items-center gap-1 hover:text-indigo-600 ${h ? 'text-indigo-600' : ''}`}>
                        <ThumbsUp className="size-3.5" fill={h ? 'currentColor' : 'none'} /> Helpful ({r.helpful + (h ? 1 : 0)})
                      </button>
                    </div>
                  </article>
                )
              })}
              {!productReviews.length && <div className="card p-8 text-center text-sm text-slate-500">No written reviews yet.</div>}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} color={m.color} size={48} square />
              <div className="min-w-0">
                <Link to={`/m/${m.id}`} className="font-semibold hover:text-indigo-600">{m.name}</Link> {m.verified && <Verified />}
                <div className="text-xs text-slate-500">{compact(m.followers)} followers</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{m.tagline}</p>
            {!isOwner && <button onClick={() => toggleFollow(m.id)} className={`${following ? 'btn-ghost border border-slate-300' : 'btn-outline'} mt-3 w-full`}>{following ? 'Following' : '+ Follow'}</button>}
          </div>
          {similar.length > 0 && (
            <div>
              <h3 className="mb-2 px-1 font-semibold text-slate-900">Similar products</h3>
              <div className="space-y-3">{similar.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            </div>
          )}
        </aside>
      </div>
      {preview && <DocPreview doc={preview} product={product} onClose={() => setPreview(null)} />}
    </main>
  )
}
