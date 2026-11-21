import { Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoryIcon } from '../components/ProductVisual'
import { ProductCard } from '../components/ProductCard'
import { CATEGORIES } from '../data/seed'
import type { Category } from '../data/types'
import { ratingStats, valueScore } from '../lib/utils'
import { useStore } from '../store'

type Sort = 'rating' | 'value' | 'price-asc' | 'price-desc' | 'newest'

export default function Explore() {
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const manufacturers = useStore((s) => s.manufacturers)
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState<Category | 'All'>('All')
  const [sort, setSort] = useState<Sort>('rating')

  const shown = products
    .filter((p) => cat === 'All' || p.category === cat)
    .filter((p) => {
      const m = manufacturers.find((x) => x.id === p.manufacturerId)
      return `${p.name} ${p.category} ${m?.name}`.toLowerCase().includes(q.toLowerCase())
    })
    .sort((a, b) => {
      switch (sort) {
        case 'rating': return ratingStats(b, reviews).avg - ratingStats(a, reviews).avg
        case 'value': return valueScore(b, products, reviews) - valueScore(a, products, reviews)
        case 'price-asc': return a.price - b.price
        case 'price-desc': return b.price - a.price
        case 'newest': return b.releaseDate.localeCompare(a.releaseDate)
      }
    })

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <div className="card p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Explore products</h1>
        <p className="text-sm text-slate-500">Official listings from verified manufacturers. Select two or more to compare with AI.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, brand or category" className="input pl-9" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input sm:w-56">
            <option value="rating">Sort: Highest rated</option>
            <option value="value">Sort: Best value</option>
            <option value="price-asc">Sort: Price, low to high</option>
            <option value="price-desc">Sort: Price, high to low</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                cat === c ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c !== 'All' && <CategoryIcon category={c} className="size-4" />}
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {!shown.length && <div className="card mt-4 p-10 text-center text-slate-500">No products match your search.</div>}
    </main>
  )
}
