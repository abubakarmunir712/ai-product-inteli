import { Star } from 'lucide-react'
import { useState } from 'react'

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-slate-300" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber-400" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0)
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
  const shown = hover || value
  return (
    <div className="flex items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} className="p-0.5 transition-transform hover:scale-110">
            <Star style={{ width: size, height: size }} className={i <= shown ? 'text-amber-400' : 'text-slate-300'} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-slate-600">{labels[shown]}</span>
    </div>
  )
}
