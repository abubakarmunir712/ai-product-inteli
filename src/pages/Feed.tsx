import { Image, Package, Plus, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Verified } from '../components/Avatar'
import { PostCard } from '../components/PostCard'
import { ProductVisual } from '../components/ProductVisual'
import { StarInput, Stars } from '../components/Stars'
import { compact, fmt1, ratingStats } from '../lib/utils'
import { useMe, useStore } from '../store'

function ProfileCard() {
  const me = useMe()!
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const follows = useStore((s) => s.follows[me.id] ?? [])
  const m = useStore((s) => s.manufacturers.find((x) => x.id === me.manufacturerId))
  const mine = products.filter((p) => p.manufacturerId === me.manufacturerId)
  const stats = me.role === 'manufacturer'
    ? [['Followers', compact(m?.followers ?? 0)], ['Products', mine.length], ['Product views', compact(mine.reduce((a, p) => a + p.views, 0))]]
    : [['Reviews written', reviews.filter((r) => r.accountId === me.id).length], ['Following', follows.length]]
  return (
    <div className="card overflow-hidden">
      <div className="h-16" style={{ background: `linear-gradient(120deg, ${me.color}, ${me.color}66)` }} />
      <div className="-mt-8 px-4 pb-4 text-center">
        <div className="flex justify-center"><div className="rounded-full ring-4 ring-white"><Avatar name={me.name} color={me.color} size={64} square={me.role === 'manufacturer'} /></div></div>
        <div className="mt-2 font-semibold text-slate-900">{me.name} {me.role === 'manufacturer' && <Verified />}</div>
        <div className="text-xs text-slate-500">{me.headline}</div>
      </div>
      <div className="border-t border-slate-100 px-4 py-3 text-xs">
        {stats.map(([k, v]) => (
          <div key={k} className="flex justify-between py-0.5"><span className="text-slate-500">{k}</span><span className="font-semibold text-indigo-600">{v}</span></div>
        ))}
      </div>
      {me.role === 'manufacturer' && (
        <Link to="/dashboard/new" className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4" /> Upload a product</Link>
      )}
    </div>
  )
}

function Composer() {
  const me = useMe()!
  const products = useStore((s) => s.products)
  const addPost = useStore((s) => s.addPost)
  const addReview = useStore((s) => s.addReview)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState(0)
  const isM = me.role === 'manufacturer'
  const options = isM ? products.filter((p) => p.manufacturerId === me.manufacturerId) : products

  const submit = () => {
    if (!isM && productId && rating) {
      addReview({ productId, accountId: me.id, rating, title: text.split('\n')[0].slice(0, 80) || 'My rating', body: text.split('\n').slice(1).join(' ') }, true)
    } else {
      addPost({ text, productId: productId || undefined, kind: isM ? 'update' : 'review' })
    }
    setText(''); setProductId(''); setRating(0); setOpen(false)
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar name={me.name} color={me.color} size={48} square={isM} />
        <button onClick={() => setOpen(true)} className="flex-1 rounded-full border border-slate-300 px-4 text-left text-sm font-medium text-slate-500 hover:bg-slate-50">
          {isM ? 'Share a product update…' : 'Rate a product you own…'}
        </button>
      </div>
      {!open ? (
        <div className="mt-2 flex justify-around text-sm">
          <button onClick={() => setOpen(true)} className="btn-ghost"><Image className="size-5 text-sky-500" /> Media</button>
          <button onClick={() => setOpen(true)} className="btn-ghost"><Package className="size-5 text-emerald-600" /> Tag product</button>
          {!isM && <button onClick={() => setOpen(true)} className="btn-ghost"><Star className="size-5 text-amber-500" /> Write review</button>}
          {isM && <Link to="/dashboard/new" className="btn-ghost"><Plus className="size-5 text-indigo-500" /> New product</Link>}
        </div>
      ) : (
        <div className="fade-up mt-3 space-y-3">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
            <option value="">{isM ? 'Attach one of your products (optional)' : 'Which product are you rating?'}</option>
            {options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {!isM && productId && <StarInput value={rating} onChange={setRating} />}
          <textarea autoFocus rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={isM ? 'What do you want to tell your customers?' : 'Headline on the first line, then your experience…'} className="input resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button disabled={!text.trim() || (!isM && !!productId && !rating)} onClick={submit} className="btn-primary">Post</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const manufacturers = useStore((s) => s.manufacturers)
  const me = useMe()!
  const follows = useStore((s) => s.follows[me.id] ?? [])
  const toggleFollow = useStore((s) => s.toggleFollow)
  const newChat = useStore((s) => s.newChat)
  const nav = useNavigate()
  const top = [...products].sort((a, b) => ratingStats(b, reviews).avg - ratingStats(a, reviews).avg).slice(0, 4)
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
          <Sparkles className="size-6" />
          <div className="mt-2 font-semibold">Can't decide between two products?</div>
          <div className="mt-1 text-sm text-indigo-100">Our AI reads the manuals, specs and ratings so you don't have to.</div>
          <button onClick={() => nav(`/assistant/${newChat()}`)} className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Ask the assistant</button>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900">Top rated this week</h3>
        <div className="mt-3 space-y-3">
          {top.map((p, i) => {
            const m = manufacturers.find((x) => x.id === p.manufacturerId)!
            const st = ratingStats(p, reviews)
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="group flex items-center gap-3">
                <span className="w-3 text-sm font-semibold text-slate-400">{i + 1}</span>
                <ProductVisual category={p.category} color={m.color} className="size-10 rounded-md" iconSize={20} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold group-hover:text-indigo-600">{p.name}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Stars value={st.avg} size={11} /> {fmt1(st.avg)}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900">Manufacturers to follow</h3>
        <div className="mt-3 space-y-3">
          {manufacturers.filter((m) => m.id !== me.manufacturerId).slice(0, 4).map((m) => {
            const f = follows.includes(m.id)
            return (
              <div key={m.id} className="flex items-center gap-3">
                <Link to={`/m/${m.id}`}><Avatar name={m.name} color={m.color} size={40} square /></Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/m/${m.id}`} className="block truncate text-sm font-semibold hover:text-indigo-600">{m.name}</Link>
                  <div className="truncate text-xs text-slate-500">{m.tagline}</div>
                </div>
                <button onClick={() => toggleFollow(m.id)} className={`${f ? 'btn-ghost' : 'btn-outline'} px-3 py-1 text-xs`}>{f ? 'Following' : '+ Follow'}</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const posts = useStore((s) => s.posts)
  const me = useMe()!
  const follows = useStore((s) => s.follows[me.id] ?? [])
  const accounts = useStore((s) => s.accounts)
  const [tab, setTab] = useState<'all' | 'following'>('all')
  const shown = tab === 'all' ? posts : posts.filter((p) => {
    const a = accounts.find((x) => x.id === p.accountId)
    return p.accountId === me.id || (a?.manufacturerId && follows.includes(a.manufacturerId))
  })
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 pb-28 lg:grid-cols-[225px_1fr_300px]">
      <aside className="hidden lg:block"><div className="sticky top-20"><ProfileCard /></div></aside>
      <section className="space-y-4">
        <Composer />
        <div className="flex items-center gap-2 text-sm">
          <span className="h-px flex-1 bg-slate-300" />
          {(['all', 'following'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 font-medium ${tab === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
              {t === 'all' ? 'All activity' : 'Following'}
            </button>
          ))}
        </div>
        {shown.map((p) => <PostCard key={p.id} post={p} />)}
        {!shown.length && <div className="card p-8 text-center text-sm text-slate-500">Follow manufacturers to see their updates here.</div>}
      </section>
      <aside className="hidden lg:block"><div className="sticky top-20"><Sidebar /></div></aside>
    </main>
  )
}
