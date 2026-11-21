export type Role = 'manufacturer' | 'user'

export type Category = 'Smartphones' | 'Laptops' | 'Headphones' | 'Home Appliances'

export interface Account {
  id: string
  name: string
  role: Role
  headline: string
  color: string
  manufacturerId?: string
  location?: string
}

export interface Manufacturer {
  id: string
  name: string
  tagline: string
  about: string
  location: string
  founded: number
  employees: string
  website: string
  followers: number
  color: string
  verified: boolean
}

export interface SpecRow {
  group: string
  label: string
  value: string
}

export interface ManualFile {
  name: string
  kind: 'manual' | 'quickstart' | 'warranty' | 'datasheet'
  pages: number
  size: string
}

export interface Product {
  id: string
  manufacturerId: string
  name: string
  category: Category
  price: number
  releaseDate: string
  description: string
  highlights: string[]
  specs: SpecRow[]
  manuals: ManualFile[]
  /** 0–10 per category dimension, extracted from spec sheets + reviews */
  scores: Record<string, number>
  /** Simulated historic ratings so the prototype feels populated: counts for 5★..1★ */
  ratingDist: [number, number, number, number, number]
  views: number
}

export interface Review {
  id: string
  productId: string
  accountId: string
  rating: number
  title: string
  body: string
  date: string
  helpful: number
}

export interface Comment {
  id: string
  accountId: string
  text: string
  date: string
}

export interface Post {
  id: string
  accountId: string
  kind: 'launch' | 'update' | 'review'
  productId?: string
  rating?: number
  text: string
  date: string
  likedBy: string[]
  baseLikes: number
  comments: Comment[]
}

export type ChatBlock =
  | { type: 'compare'; productIds: string[] }
  | { type: 'value'; productIds: string[] }
  | { type: 'product'; productId: string }
  | { type: 'sources'; items: { productId: string; doc: string; ref: string }[] }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  productIds?: string[]
  blocks?: ChatBlock[]
  followups?: string[]
}

export interface Chat {
  id: string
  title: string
  updatedAt: string
  productIds: string[]
  messages: ChatMessage[]
}
