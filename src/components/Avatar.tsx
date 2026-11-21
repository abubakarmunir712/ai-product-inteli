import { BadgeCheck } from 'lucide-react'
import { initials } from '../lib/utils'

export function Avatar({ name, color, size = 40, square = false }: { name: string; color: string; size?: number; square?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${square ? 'rounded-lg' : 'rounded-full'}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}bb)`, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}

export const Verified = () => <BadgeCheck className="inline size-4 text-indigo-500" aria-label="Verified manufacturer" />
