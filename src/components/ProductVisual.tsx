import { Headphones, Laptop, Smartphone, Wind } from 'lucide-react'
import type { Category } from '../data/types'

const ICONS: Record<Category, typeof Smartphone> = {
  Smartphones: Smartphone,
  Laptops: Laptop,
  Headphones: Headphones,
  'Home Appliances': Wind,
}

/** Placeholder product imagery: brand-coloured gradient + category glyph. */
export function ProductVisual({ category, color, className = '', iconSize = 56 }: { category: Category; color: string; className?: string; iconSize?: number }) {
  const Icon = ICONS[category]
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 20%, ${color}33, transparent 60%), linear-gradient(160deg, ${color}1a, ${color}40)` }}
    >
      <div className="absolute -right-6 -bottom-6 size-28 rounded-full opacity-20" style={{ background: color }} />
      <Icon strokeWidth={1.3} style={{ width: iconSize, height: iconSize, color }} />
    </div>
  )
}

export const CategoryIcon = ({ category, className }: { category: Category; className?: string }) => {
  const Icon = ICONS[category]
  return <Icon className={className} />
}
