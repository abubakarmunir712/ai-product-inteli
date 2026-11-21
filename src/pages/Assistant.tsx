import { ArrowUp, Check, Copy, Crown, FileText, MessageSquarePlus, PanelLeft, Plus, Search, Sparkles, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ProductVisual } from '../components/ProductVisual'
import { RichText } from '../components/RichText'
import { Stars } from '../components/Stars'
import { CATEGORIES, CATEGORY_DIMENSIONS } from '../data/seed'
import type { ChatBlock, ChatMessage, Product } from '../data/types'
import { respond } from '../lib/assistant'
import { fmt1, money, ratingStats, sleep, timeAgo, uid, valueScore } from '../lib/utils'
import { useMe, useStore } from '../store'
import { ScoreBars } from './ProductPage'

const useProductColor = () => {
  const manufacturers = useStore((s) => s.manufacturers)
  return (p: Product) => manufacturers.find((m) => m.id === p.manufacturerId)?.color ?? '#6366f1'
}

/* ------------------------------------------------------------------ blocks */

function CompareBlock({ ids }: { ids: string[] }) {
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const color = useProductColor()
  const list = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[]
  if (list.length < 2) return null
  const dims = CATEGORY_DIMENSIONS[list[0].category]
  const labels = [...new Set(list.flatMap((p) => p.specs.map((s) => s.label)))].filter((l) => list.filter((p) => p.specs.some((s) => s.label === l)).length > 1)
  const best = (vals: number[], higher = true) => {
    const target = higher ? Math.max(...vals) : Math.min(...vals)
    return vals.map((v) => v === target && vals.filter((x) => x === target).length === 1)
  }
  const Row = ({ label, cells, wins }: { label: string; cells: React.ReactNode[]; wins?: boolean[] }) => (
    <tr className="border-t border-slate-100">
      <td className="sticky left-0 bg-white py-2 pr-3 text-slate-500">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className={`px-3 py-2 ${wins?.[i] ? 'font-semibold text-emerald-700' : ''}`}>
          <span className="inline-flex items-center gap-1">{c}{wins?.[i] && <Crown className="size-3.5 text-amber-500" />}</span>
        </td>
      ))}
    </tr>
  )
  const stats = list.map((p) => ratingStats(p, reviews))
  const values = list.map((p) => valueScore(p, products, reviews))
  return (
    <div className="fade-up card mt-3 overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 w-36 bg-white p-3 text-left text-xs font-semibold text-slate-400 uppercase">Side by side</th>
            {list.map((p) => (
              <th key={p.id} className="p-3 text-left font-normal">
                <Link to={`/products/${p.id}`} className="flex items-center gap-2 hover:text-indigo-600">
                  <ProductVisual category={p.category} color={color(p)} className="size-10 shrink-0 rounded-lg" iconSize={20} />
                  <span className="font-semibold">{p.name}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Price" cells={list.map((p) => money(p.price))} wins={best(list.map((p) => p.price), false)} />
          <Row label="User rating" cells={stats.map((s) => <><Stars value={s.avg} size={12} /> {fmt1(s.avg)}</>)} wins={best(stats.map((s) => +s.avg.toFixed(2)))} />
          <Row label="Value score" cells={values.map((v) => `${fmt1(v)} / 10`)} wins={best(values.map((v) => +v.toFixed(1)))} />
          <tr><td colSpan={list.length + 1} className="bg-slate-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">AI scores</td></tr>
          {dims.map((d) => <Row key={d} label={d} cells={list.map((p) => fmt1(p.scores[d] ?? 0))} wins={best(list.map((p) => p.scores[d] ?? 0))} />)}
          <tr><td colSpan={list.length + 1} className="bg-slate-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">From the spec sheets</td></tr>
          {labels.map((l) => <Row key={l} label={l} cells={list.map((p) => p.specs.find((s) => s.label === l)?.value ?? '—')} />)}
        </tbody>
      </table>
    </div>
  )
}

function ValueBlock({ ids }: { ids: string[] }) {
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const color = useProductColor()
  const list = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[]
  const rows = list.map((p) => ({ p, v: valueScore(p, products, reviews) })).sort((a, b) => b.v - a.v)
  return (
    <div className="fade-up card mt-3 p-4">
      <div className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Value for money</div>
      <div className="space-y-3">
        {rows.map(({ p, v }, i) => (
          <div key={p.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{p.name} {i === 0 && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Best value</span>}</span>
              <span><b>{fmt1(v)}</b><span className="text-slate-400"> / 10 · {money(p.price)}</span></span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${v * 10}%`, background: color(p) }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductBlock({ id }: { id: string }) {
  const p = useStore((s) => s.products.find((x) => x.id === id))
  const reviews = useStore((s) => s.reviews)
  const color = useProductColor()
  if (!p) return null
  const st = ratingStats(p, reviews)
  return (
    <div className="fade-up card mt-3 grid overflow-hidden sm:grid-cols-[180px_1fr]">
      <ProductVisual category={p.category} color={color(p)} className="h-32 sm:h-full" iconSize={56} />
      <div className="p-4">
        <Link to={`/products/${p.id}`} className="font-semibold hover:text-indigo-600">{p.name}</Link>
        <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-500"><Stars value={st.avg} size={12} /> {fmt1(st.avg)} · {money(p.price)}</div>
        <ScoreBars product={p} />
      </div>
    </div>
  )
}

function SourcesBlock({ items }: { items: { productId: string; doc: string; ref: string }[] }) {
  return (
    <div className="fade-up mt-3">
      <div className="mb-1.5 text-xs font-semibold text-slate-500">Sources</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <Link key={i} to={`/products/${s.productId}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
            <span className="flex size-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">{i + 1}</span>
            <FileText className="size-3" /> {s.doc.replace(/\.pdf$/, '')} <span className="text-slate-400">· {s.ref}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Blocks({ blocks }: { blocks: ChatBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'compare' ? <CompareBlock key={i} ids={b.productIds} />
        : b.type === 'value' ? <ValueBlock key={i} ids={b.productIds} />
        : b.type === 'product' ? <ProductBlock key={i} id={b.productId} />
        : <SourcesBlock key={i} items={b.items} />,
      )}
    </>
  )
}

/* ------------------------------------------------------------- messages */

function AssistantAvatar() {
  return <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600"><Sparkles className="size-4 text-white" /></div>
}

function MessageView({ msg, isLast, onFollowup }: { msg: ChatMessage; isLast: boolean; onFollowup: (t: string) => void }) {
  const me = useMe()!
  const products = useStore((s) => s.products)
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<0 | 1 | -1>(0)
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%]">
          {!!msg.productIds?.length && (
            <div className="mb-1 flex flex-wrap justify-end gap-1">
              {msg.productIds.map((id) => <span key={id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{products.find((p) => p.id === id)?.name}</span>)}
            </div>
          )}
          <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-white">{msg.text}</div>
        </div>
        <Avatar name={me.name} color={me.color} size={32} square={me.role === 'manufacturer'} />
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        <RichText text={msg.text} />
        {msg.blocks && <Blocks blocks={msg.blocks} />}
        <div className="mt-2 flex gap-1 text-slate-400">
          <button onClick={() => { navigator.clipboard?.writeText(msg.text.replace(/\*\*/g, '')); setCopied(true); setTimeout(() => setCopied(false), 1200) }} className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-700" title="Copy">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</button>
          <button onClick={() => setVote(vote === 1 ? 0 : 1)} className={`rounded p-1.5 hover:bg-slate-100 ${vote === 1 ? 'text-indigo-600' : 'hover:text-slate-700'}`} title="Good answer"><ThumbsUp className="size-4" /></button>
          <button onClick={() => setVote(vote === -1 ? 0 : -1)} className={`rounded p-1.5 hover:bg-slate-100 ${vote === -1 ? 'text-indigo-600' : 'hover:text-slate-700'}`} title="Bad answer"><ThumbsDown className="size-4" /></button>
        </div>
        {isLast && !!msg.followups?.length && (
          <div className="fade-up mt-2 flex flex-wrap gap-2">
            {msg.followups.map((f) => <button key={f} onClick={() => onFollowup(f)} className="rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100">{f}</button>)}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- product picker */

function ProductPicker({ selected, onToggle, onClose }: { selected: string[]; onToggle: (id: string) => void; onClose: () => void }) {
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const color = useProductColor()
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    setTimeout(() => document.addEventListener('mousedown', h))
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div ref={ref} className="card fade-up absolute bottom-full left-0 z-20 mb-2 w-full max-w-md overflow-hidden shadow-xl">
      <div className="relative border-b border-slate-100 p-2">
        <Search className="absolute top-1/2 left-5 size-4 -translate-y-1/2 text-slate-400" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-md bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none" />
      </div>
      <div className="max-h-80 overflow-y-auto py-1">
        {CATEGORIES.map((c) => {
          const items = products.filter((p) => p.category === c && p.name.toLowerCase().includes(q.toLowerCase()))
          if (!items.length) return null
          return (
            <div key={c}>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{c}</div>
              {items.map((p) => {
                const on = selected.includes(p.id)
                return (
                  <button key={p.id} onClick={() => onToggle(p.id)} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-slate-50">
                    <ProductVisual category={p.category} color={color(p)} className="size-8 shrink-0 rounded-md" iconSize={16} />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-slate-400">{money(p.price)} · ★{fmt1(ratingStats(p, reviews).avg)}</span>
                    <span className={`flex size-5 items-center justify-center rounded border ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{on && <Check className="size-3.5" />}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */

const THINKING = ['Reading spec sheets', 'Scanning user manuals', 'Analysing user ratings', 'Calculating value scores']

export default function Assistant() {
  const { chatId } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const s = useStore()
  const chat = s.chats.find((c) => c.id === chatId)
  const [draftIds, setDraftIds] = useState<string[]>([])
  const contextIds = chat?.productIds ?? draftIds
  const [input, setInput] = useState('')
  const [picker, setPicker] = useState(false)
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState<string | null>(null)
  const [stream, setStream] = useState<string | null>(null)
  const [sidebar, setSidebar] = useState(true)
  const scroller = useRef<HTMLDivElement>(null)
  const autoRan = useRef<string | null>(null)
  const byId = (id: string) => s.products.find((p) => p.id === id)
  const color = useProductColor()

  const sorted = useMemo(() => [...s.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [s.chats])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [chat?.messages.length, stream, thinking])

  const setContext = (ids: string[]) => (chat ? s.updateChat(chat.id, { productIds: ids }) : setDraftIds(ids))
  const toggleContext = (id: string) => setContext(contextIds.includes(id) ? contextIds.filter((x) => x !== id) : [...contextIds, id])

  async function send(text: string, ids: string[] = contextIds) {
    if (!text.trim() || busy) return
    setBusy(true)
    setInput('')
    let id = chat?.id
    if (!id) {
      id = s.newChat(ids)
      setDraftIds([])
      nav(`/assistant/${id}`, { replace: true })
    }
    s.pushMessage(id, { id: uid(), role: 'user', text, productIds: ids.length ? ids : undefined })

    const st = useStore.getState()
    const reply = respond({ message: text, contextIds: ids, products: st.products, reviews: st.reviews, manufacturers: st.manufacturers })

    for (const step of reply.productIds.length ? THINKING : THINKING.slice(0, 1)) {
      setThinking(step)
      await sleep(450 + Math.random() * 250)
    }
    setThinking(null)

    for (let i = 0; i <= reply.text.length; i += 5) {
      setStream(reply.text.slice(0, i))
      await sleep(12)
    }
    setStream(null)
    s.pushMessage(id, { id: uid(), role: 'assistant', text: reply.text, blocks: reply.blocks, followups: reply.followups, productIds: reply.productIds })

    const cur = useStore.getState().chats.find((c) => c.id === id)
    const names = reply.productIds.map((p) => byId(p)?.name).filter(Boolean)
    s.updateChat(id, {
      productIds: reply.productIds,
      title: cur?.title === 'New comparison' ? (names.length ? names.join(' vs ') : text.slice(0, 40)) : cur?.title,
    })
    setBusy(false)
  }

  // Auto-ask when arriving from "Compare with AI" / "Ask AI about this"
  useEffect(() => {
    if (!chat || params.get('auto') !== '1' || chat.messages.length || autoRan.current === chat.id) return
    autoRan.current = chat.id
    setParams({}, { replace: true })
    const names = chat.productIds.map((id) => byId(id)?.name)
    if (names.length >= 2) send(`Compare ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} — which gives better value?`)
    else if (names.length === 1) send(`Give me an overview of ${names[0]}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id])

  const messages = chat?.messages ?? []
  const empty = !messages.length && !busy

  return (
    <div className="flex h-[calc(100vh-61px)] bg-white">
      {/* history sidebar */}
      {sidebar && (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
          <div className="p-3">
            <button onClick={() => nav('/assistant')} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100">
              <MessageSquarePlus className="size-4" /> New comparison
            </button>
          </div>
          <div className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Recent</div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {sorted.filter((c) => c.messages.length).map((c) => (
              <div key={c.id} className={`group flex items-center rounded-lg ${c.id === chatId ? 'bg-slate-200' : 'hover:bg-slate-100'}`}>
                <Link to={`/assistant/${c.id}`} className="min-w-0 flex-1 px-3 py-2">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-slate-400">{timeAgo(c.updatedAt)}</div>
                </Link>
                <button onClick={() => { s.deleteChat(c.id); if (c.id === chatId) nav('/assistant') }} className="mr-1 hidden rounded p-1 text-slate-400 group-hover:block hover:text-red-500"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
          <button onClick={() => setSidebar((v) => !v)} className="hidden rounded p-1.5 text-slate-500 hover:bg-slate-100 md:block"><PanelLeft className="size-4" /></button>
          <span className="truncate text-sm font-semibold">{chat?.title ?? 'New comparison'}</span>
          <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Prototype · simulated AI</span>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
            {empty && (
              <div className="pt-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200"><Sparkles className="size-7 text-white" /></div>
                <h1 className="mt-4 text-2xl font-semibold text-slate-900">Which product gives you more?</h1>
                <p className="mt-1 text-slate-500">I compare products using official spec sheets, manuals and verified user ratings.</p>
                <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                  {[
                    { t: 'Orbit X1 vs Nova Pulse 7', d: 'Flagship phones — which is better value?', ids: ['orbit-x1', 'nova-pulse-7'], q: 'Compare Orbit X1 and Nova Pulse 7 — which is better value?' },
                    { t: 'Best headphones for flights', d: 'Studio ANC vs SoundPod Pro on noise cancelling', ids: ['auralis-studio-anc', 'nova-soundpod-pro'], q: 'Which has better noise cancelling for long flights?' },
                    { t: 'Laptop for a developer', d: 'Kestrel Book 14 vs Nova Slate Pro 15', ids: ['kestrel-book-14', 'nova-slate-pro-15'], q: 'Which laptop has better battery and portability for a developer?' },
                    { t: 'Warranty check', d: 'Compare warranties of two air purifiers', ids: ['brightfield-airpure-500', 'brightfield-airpure-300'], q: 'Compare their warranties and maintenance costs' },
                  ].map((x) => (
                    <button key={x.t} onClick={() => send(x.q, x.ids)} className="card p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/30">
                      <div className="font-semibold text-slate-900">{x.t}</div>
                      <div className="text-sm text-slate-500">{x.d}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <MessageView key={m.id} msg={m} isLast={i === messages.length - 1 && !busy} onFollowup={(t) => send(t)} />)}

            {thinking && (
              <div className="flex gap-3">
                <AssistantAvatar />
                <div className="flex items-center gap-2 pt-1.5 text-sm text-slate-500">
                  <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: `${i * 120}ms` }} />)}</span>
                  {thinking}…
                </div>
              </div>
            )}
            {stream !== null && (
              <div className="flex gap-3">
                <AssistantAvatar />
                <div className="min-w-0 flex-1"><RichText text={stream} caret /></div>
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-slate-100 bg-white px-4 pt-3 pb-4">
          <div className="relative mx-auto max-w-3xl">
            {picker && <ProductPicker selected={contextIds} onToggle={toggleContext} onClose={() => setPicker(false)} />}
            <div className="rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
              <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
                {contextIds.map((id) => {
                  const p = byId(id)
                  if (!p) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-0.5 pr-1.5 pl-0.5 text-xs font-medium">
                      <ProductVisual category={p.category} color={color(p)} className="size-6 rounded-md" iconSize={13} />
                      {p.name}
                      <button onClick={() => toggleContext(id)} className="text-slate-400 hover:text-slate-700"><X className="size-3.5" /></button>
                    </span>
                  )
                })}
                <button onClick={() => setPicker((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
                  <Plus className="size-3.5" /> Add product
                </button>
              </div>
              <form className="flex items-end gap-2 p-2 pl-4" onSubmit={(e) => { e.preventDefault(); send(input) }}>
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                  placeholder={contextIds.length >= 2 ? 'Ask anything about these products…' : 'Ask about any product, e.g. "Orbit X1 vs Nova Pulse 7"'}
                  className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none"
                />
                <button disabled={!input.trim() || busy} className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"><ArrowUp className="size-5" /></button>
              </form>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Answers are generated from manufacturer documents and user ratings. Always verify critical details in the official manual.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
