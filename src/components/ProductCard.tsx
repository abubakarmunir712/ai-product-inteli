import { Check, GitCompareArrows } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { money, ratingStats, fmt1, compact } from '../lib/utils'
import { useStore } from '../store'
import { ProductVisual } from './ProductVisual'
import { Stars } from './Stars'

export function ProductCard({ product }: { product: Product }) {
  const m = useStore((s) => s.manufacturers.find((x) => x.id === product.manufacturerId))
  const reviews = useStore((s) => s.reviews)
  const inCompare = useStore((s) => s.compare.includes(product.id))
  const toggleCompare = useStore((s) => s.toggleCompare)
  const st = ratingStats(product, reviews)

  return (
    <div className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`}>
        <ProductVisual category={product.category} color={m?.color ?? '#6366f1'} className="h-36" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-medium text-slate-500">{m?.name} · {product.category}</div>
        <Link to={`/products/${product.id}`} className="mt-0.5 font-semibold text-slate-900 hover:text-indigo-600 hover:underline">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <Stars value={st.avg} />
          <span className="font-medium">{fmt1(st.avg)}</span>
          <span className="text-slate-500">({compact(st.count)})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-slate-900">{money(product.price)}</span>
          <button
            onClick={() => toggleCompare(product.id)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
              inCompare ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
            }`}
          >
            {inCompare ? <Check className="size-3.5" /> : <GitCompareArrows className="size-3.5" />}
            {inCompare ? 'Comparing' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  )
}
