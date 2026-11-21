import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, Chat, ChatMessage, Manufacturer, Post, Product, Review } from './data/types'
import * as seed from './data/seed'
import { respond } from './lib/assistant'
import { uid } from './lib/utils'

interface State {
  currentAccountId: string | null
  accounts: Account[]
  manufacturers: Manufacturer[]
  products: Product[]
  reviews: Review[]
  posts: Post[]
  follows: Record<string, string[]> // accountId -> manufacturerIds
  compare: string[]
  chats: Chat[]

  login: (id: string) => void
  logout: () => void
  addProduct: (p: Product, announce: string) => void
  addReview: (r: Omit<Review, 'id' | 'date' | 'helpful'>, share: boolean) => void
  addPost: (p: Pick<Post, 'text' | 'productId' | 'kind'>) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, text: string) => void
  toggleFollow: (manufacturerId: string) => void
  toggleCompare: (productId: string) => void
  clearCompare: () => void
  newChat: (productIds?: string[]) => string
  updateChat: (id: string, patch: Partial<Chat>) => void
  pushMessage: (chatId: string, msg: ChatMessage) => void
  deleteChat: (id: string) => void
  reset: () => void
}

function seededChats(): Chat[] {
  const prompts: Record<string, string[]> = {
    'chat-seed-1': ['Compare Orbit X1 and Nova Pulse 7', 'Which one is better value?'],
    'chat-seed-2': ['Auralis Studio ANC vs Nova SoundPod Pro for long flights'],
  }
  return seed.seedChats.map((c) => {
    let ctx = c.productIds
    const messages: ChatMessage[] = []
    for (const q of prompts[c.id] ?? []) {
      messages.push({ id: uid(), role: 'user', text: q })
      const r = respond({ message: q, contextIds: ctx, products: seed.products, reviews: seed.reviews, manufacturers: seed.manufacturers })
      ctx = r.productIds
      messages.push({ id: uid(), role: 'assistant', text: r.text, blocks: r.blocks, followups: r.followups, productIds: r.productIds })
    }
    return { ...c, messages }
  })
}

const initial = () => ({
  currentAccountId: null,
  accounts: seed.accounts,
  manufacturers: seed.manufacturers,
  products: seed.products,
  reviews: seed.reviews,
  posts: seed.posts,
  follows: { 'u-sara': ['nova', 'auralis'], 'u-daniel': ['kestrel'], 'u-aisha': ['orbit'], 'u-tom': ['auralis'], 'u-lina': ['brightfield'] },
  compare: [],
  chats: seededChats(),
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      login: (id) => set({ currentAccountId: id }),
      logout: () => set({ currentAccountId: null, compare: [] }),

      addProduct: (p, announce) => {
        const me = get().currentAccountId!
        set((s) => ({
          products: [p, ...s.products],
          posts: announce
            ? [{ id: uid(), accountId: me, kind: 'launch', productId: p.id, text: announce, date: new Date().toISOString(), likedBy: [], baseLikes: 0, comments: [] }, ...s.posts]
            : s.posts,
        }))
      },

      addReview: (r, share) => {
        const review: Review = { ...r, id: uid(), date: new Date().toISOString(), helpful: 0 }
        set((s) => ({
          reviews: [review, ...s.reviews],
          posts: share
            ? [
                { id: uid(), accountId: r.accountId, kind: 'review', productId: r.productId, rating: r.rating, text: `${r.title}${r.body ? ` — ${r.body}` : ''}`, date: review.date, likedBy: [], baseLikes: 0, comments: [] },
                ...s.posts,
              ]
            : s.posts,
        }))
      },

      addPost: (p) =>
        set((s) => ({
          posts: [{ id: uid(), accountId: s.currentAccountId!, date: new Date().toISOString(), likedBy: [], baseLikes: 0, comments: [], ...p }, ...s.posts],
        })),

      toggleLike: (postId) => {
        const me = get().currentAccountId!
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id !== postId ? p : { ...p, likedBy: p.likedBy.includes(me) ? p.likedBy.filter((x) => x !== me) : [...p.likedBy, me] },
          ),
        }))
      },

      addComment: (postId, text) => {
        const me = get().currentAccountId!
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id !== postId ? p : { ...p, comments: [...p.comments, { id: uid(), accountId: me, text, date: new Date().toISOString() }] },
          ),
        }))
      },

      toggleFollow: (mid) => {
        const me = get().currentAccountId!
        set((s) => {
          const cur = s.follows[me] ?? []
          const following = cur.includes(mid)
          return {
            follows: { ...s.follows, [me]: following ? cur.filter((x) => x !== mid) : [...cur, mid] },
            manufacturers: s.manufacturers.map((m) => (m.id === mid ? { ...m, followers: m.followers + (following ? -1 : 1) } : m)),
          }
        })
      },

      toggleCompare: (id) =>
        set((s) => ({ compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : [...s.compare, id].slice(-4) })),
      clearCompare: () => set({ compare: [] }),

      newChat: (productIds = []) => {
        const id = uid()
        set((s) => ({ chats: [{ id, title: 'New comparison', updatedAt: new Date().toISOString(), productIds, messages: [] }, ...s.chats] }))
        return id
      },
      updateChat: (id, patch) => set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      pushMessage: (chatId, msg) =>
        set((s) => ({
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, msg], updatedAt: new Date().toISOString() } : c)),
        })),
      deleteChat: (id) => set((s) => ({ chats: s.chats.filter((c) => c.id !== id) })),

      reset: () => set({ ...initial() }),
    }),
    { name: 'lowel-demo-v1' },
  ),
)

export const useMe = () => {
  const id = useStore((s) => s.currentAccountId)
  const accounts = useStore((s) => s.accounts)
  return accounts.find((a) => a.id === id) ?? null
}
