import type { Product, Review } from '../data/types'

export const uid = () => Math.random().toString(36).slice(2, 10)

export const money = (n: number) => `$${n.toLocaleString('en-US')}`

export const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : `${n}`

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export interface RatingStats {
  avg: number
  count: number
  dist: number[] // index 0 = 5★
}

export function ratingStats(product: Product, reviews: Review[]): RatingStats {
  const dist = [...product.ratingDist]
  for (const r of reviews) if (r.productId === product.id) dist[5 - r.rating] += 1
  const count = dist.reduce((a, b) => a + b, 0)
  const sum = dist.reduce((a, n, i) => a + n * (5 - i), 0)
  return { avg: count ? sum / count : 0, count, dist }
}

/** Overall quality 0–10: spec-derived scores blended with what users say. */
export function qualityScore(product: Product, reviews: Review[]) {
  const vals = Object.values(product.scores)
  const specScore = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
  const { avg, count } = ratingStats(product, reviews)
  return count ? specScore * 0.65 + avg * 2 * 0.35 : specScore
}

/**
 * Value for money 0–10: quality relative to price, benchmarked against the
 * median price of the product's category.
 */
export function valueScore(product: Product, all: Product[], reviews: Review[]) {
  const prices = all.filter((p) => p.category === product.category).map((p) => p.price).sort((a, b) => a - b)
  const median = prices[Math.floor(prices.length / 2)] ?? product.price
  const q = qualityScore(product, reviews)
  const v = q * Math.pow(median / product.price, 0.45)
  return Math.max(0, Math.min(10, v))
}

export const fmt1 = (n: number) => n.toFixed(1)

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
