import { Globe2, MessageSquare, Send, Sparkles, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Post } from '../data/types'
import { compact, fmt1, money, ratingStats, timeAgo } from '../lib/utils'
import { useMe, useStore } from '../store'
import { Avatar, Verified } from './Avatar'
import { ProductVisual } from './ProductVisual'
import { Stars } from './Stars'

export function PostCard({ post }: { post: Post }) {
  const me = useMe()!
  const accounts = useStore((s) => s.accounts)
  const author = accounts.find((a) => a.id === post.accountId)!
  const product = useStore((s) => s.products.find((p) => p.id === post.productId))
  const manufacturers = useStore((s) => s.manufacturers)
  const reviews = useStore((s) => s.reviews)
  const toggleLike = useStore((s) => s.toggleLike)
  const addComment = useStore((s) => s.addComment)
  const newChat = useStore((s) => s.newChat)
  const nav = useNavigate()
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length < 3)
  const [draft, setDraft] = useState('')

  const liked = post.likedBy.includes(me.id)
  const likes = post.baseLikes + post.likedBy.length
  const pm = product && manufacturers.find((m) => m.id === product.manufacturerId)
  const authorLink = author.manufacturerId ? `/m/${author.manufacturerId}` : '#'
  const st = product && ratingStats(product, reviews)

  return (
    <article className="card">
      <header className="flex gap-3 p-4 pb-2">
        <Link to={authorLink}><Avatar name={author.name} color={author.color} size={48} square={author.role === 'manufacturer'} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Link to={authorLink} className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline">{author.name}</Link>
            {author.role === 'manufacturer' && <Verified />}
          </div>
          <div className="truncate text-xs text-slate-500">{author.role === 'manufacturer' ? `${compact(manufacturers.find((m) => m.id === author.manufacturerId)?.followers ?? 0)} followers` : author.headline}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {timeAgo(post.date)} · <Globe2 className="size-3" />
            {post.kind === 'launch' && <span className="ml-1 rounded bg-emerald-50 px-1.5 font-medium text-emerald-700">New product</span>}
            {post.kind === 'update' && <span className="ml-1 rounded bg-sky-50 px-1.5 font-medium text-sky-700">Update</span>}
            {post.kind === 'review' && <span className="ml-1 rounded bg-amber-50 px-1.5 font-medium text-amber-700">Review</span>}
          </div>
        </div>
      </header>

      <div className="px-4 pb-3 text-[15px] whitespace-pre-line">
        {post.kind === 'review' && post.rating && <div className="mb-1"><Stars value={post.rating} size={16} /></div>}
        {post.text}
      </div>

      {product && pm && st && (
        <Link to={`/products/${product.id}`} className="mx-4 mb-3 flex overflow-hidden rounded-lg border border-slate-200 transition-colors hover:bg-slate-50">
          <ProductVisual category={product.category} color={pm.color} className="w-32 shrink-0 sm:w-40" iconSize={44} />
          <div className="min-w-0 p-3">
            <div className="text-xs text-slate-500">{pm.name} · {product.category}</div>
            <div className="font-semibold text-slate-900">{product.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm"><Stars value={st.avg} /> {fmt1(st.avg)} <span className="text-slate-500">({compact(st.count)})</span></div>
            <div className="mt-1 text-sm font-semibold">{money(product.price)}</div>
          </div>
        </Link>
      )}

      <div className="flex items-center justify-between px-4 pb-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500"><ThumbsUp className="size-2.5 text-white" fill="white" /></span>
          {likes.toLocaleString()}
        </span>
        {post.comments.length > 0 && <button onClick={() => setShowComments((v) => !v)} className="hover:text-indigo-600 hover:underline">{post.comments.length} comment{post.comments.length > 1 ? 's' : ''}</button>}
      </div>

      <div className="mx-4 flex border-t border-slate-200 py-1">
        <button onClick={() => toggleLike(post.id)} className={`btn-ghost flex-1 rounded-md ${liked ? 'text-indigo-600' : ''}`}>
          <ThumbsUp className="size-4" fill={liked ? 'currentColor' : 'none'} /> Like
        </button>
        <button onClick={() => setShowComments(true)} className="btn-ghost flex-1 rounded-md"><MessageSquare className="size-4" /> Comment</button>
        {product && (
          <button
            onClick={() => nav(`/assistant/${newChat([product.id])}`)}
            className="btn-ghost flex-1 rounded-md"
          >
            <Sparkles className="size-4" /> Ask AI
          </button>
        )}
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              addComment(post.id, draft.trim())
              setDraft('')
            }}
          >
            <Avatar name={me.name} color={me.color} size={32} square={me.role === 'manufacturer'} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment…" className="input rounded-full" />
            <button className="btn-ghost px-2" aria-label="Send"><Send className="size-4" /></button>
          </form>
          {post.comments.map((c) => {
            const a = accounts.find((x) => x.id === c.accountId)!
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar name={a.name} color={a.color} size={32} square={a.role === 'manufacturer'} />
                <div className="flex-1 rounded-lg rounded-tl-none bg-slate-100 px-3 py-2">
                  <div className="flex justify-between text-xs"><span className="font-semibold text-slate-900">{a.name}</span><span className="text-slate-500">{timeAgo(c.date)}</span></div>
                  <div className="text-sm">{c.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
