/**
 * Scripted stand-in for the AI assistant. It reads real data from the store
 * (specs, scores, ratings, prices, manuals) and composes answers, so the demo
 * behaves sensibly for any products — including newly uploaded ones.
 * Swap `respond()` for an API call to the real RAG backend later.
 */
import type { ChatBlock, Manufacturer, Product, Review } from '../data/types'
import { CATEGORY_DIMENSIONS } from '../data/seed'
import { fmt1, money, qualityScore, ratingStats, valueScore } from './utils'

export interface AssistantInput {
  message: string
  contextIds: string[]
  products: Product[]
  reviews: Review[]
  manufacturers: Manufacturer[]
}

export interface AssistantReply {
  text: string
  productIds: string[]
  blocks: ChatBlock[]
  followups: string[]
}

const DIM_KEYWORDS: [RegExp, string][] = [
  [/camera|photo|picture|video|zoom|lens/, 'Camera'],
  [/battery|charg|last|endurance/, 'Battery'],
  [/display|screen|brightness|oled/, 'Display'],
  [/perform|speed|fast|chip|processor|cpu|gpu|gaming|render/, 'Performance'],
  [/build|durab|material|water|ip6/, 'Build'],
  [/portab|weight|light|carry|travel/, 'Portability'],
  [/sound|audio|bass|tuning|music/, 'Sound'],
  [/noise cancel|anc|flight|plane|commute/, 'Noise cancelling'],
  [/comfort|fit|wear/, 'Comfort'],
  [/quiet|noise|loud|sleep/, 'Quietness'],
  [/efficien|power draw|energy|electric/, 'Efficiency'],
  [/smart|app|voice|wifi|wi-fi/, 'Smart features'],
  [/filter|maintenance|upkeep/, 'Maintenance'],
]

const CATEGORY_KEYWORDS: [RegExp, Product['category']][] = [
  [/headphone|earbud|buds|headset/, 'Headphones'],
  [/\b(smart)?phones?\b|mobile/, 'Smartphones'],
  [/laptop|notebook|computer/, 'Laptops'],
  [/purifier|vacuum|appliance|air/, 'Home Appliances'],
]

export function detectProducts(message: string, products: Product[]): string[] {
  let text = ` ${message.toLowerCase()} `
  const found: { id: string; at: number }[] = []
  // longest names first so "Orbit X1 Lite" wins over "Orbit X1"
  const candidates = products.flatMap((p) => {
    const words = p.name.toLowerCase().split(' ')
    const aliases = [p.name.toLowerCase()]
    if (words.length > 2) aliases.push(words.slice(1).join(' ')) // "pulse 7", "book 14"
    return aliases.map((a) => ({ id: p.id, alias: a }))
  })
  candidates.sort((a, b) => b.alias.length - a.alias.length)
  for (const { id, alias } of candidates) {
    const re = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`)
    const match = re.exec(text)
    if (match) {
      if (!found.some((f) => f.id === id)) found.push({ id, at: match.index })
      // blank out the match (keeping offsets) so shorter aliases can't re-match it
      text = text.replace(re, (m, pre: string) => pre + ' '.repeat(m.length - pre.length))
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.id)
}

function pageRef(productId: string, salt: string, pages: number) {
  let h = 0
  for (const c of productId + salt) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return 3 + (h % Math.max(4, pages - 6))
}

function spec(p: Product, label: string) {
  return p.specs.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value
}

function dimSpecHint(p: Product, dim: string) {
  const row = p.specs.find((s) => s.group.toLowerCase().startsWith(dim.toLowerCase().split(' ')[0]))
  return row ? `${row.value}` : undefined
}

export function respond(input: AssistantInput): AssistantReply {
  const reply = compose(input)
  const asked = input.message.trim().toLowerCase()
  return { ...reply, followups: reply.followups.filter((f) => f.toLowerCase() !== asked) }
}

function compose({ message, contextIds, products, reviews, manufacturers }: AssistantInput): AssistantReply {
  const msg = message.toLowerCase()
  const byId = (id: string) => products.find((p) => p.id === id)!
  const mentioned = detectProducts(message, products)
  let ids = mentioned.length >= 2 ? mentioned : [...new Set([...contextIds, ...mentioned])]
  ids = ids.filter((id) => products.some((p) => p.id === id))

  const dim = DIM_KEYWORDS.find(([re]) => re.test(msg))?.[1]
  const wantsValue = /value|worth|price|money|cheap|budget|afford|cost/.test(msg)
  const wantsDocs = /manual|warranty|guarantee|setup|set up|reset|how do|how to|repair|replace/.test(msg)
  const mfr = (p: Product) => manufacturers.find((m) => m.id === p.manufacturerId)?.name ?? ''

  // ---------------- No products in context ----------------
  if (ids.length === 0) {
    const cat = CATEGORY_KEYWORDS.find(([re]) => re.test(msg))?.[1]
    if (cat) {
      const top = products
        .filter((p) => p.category === cat)
        .sort((a, b) => valueScore(b, products, reviews) - valueScore(a, products, reviews))
      const lines = top
        .slice(0, 4)
        .map((p) => `- **${p.name}** by ${mfr(p)} — ${money(p.price)}, ★ ${fmt1(ratingStats(p, reviews).avg)}, value score **${fmt1(valueScore(p, products, reviews))}/10**`)
      return {
        text: `Here are the **${cat.toLowerCase()}** on the platform, ranked by value for money:\n\n${lines.join('\n')}\n\nWant me to compare the top two side by side?`,
        productIds: [],
        blocks: [],
        followups: top.length >= 2 ? [`Compare ${top[0].name} and ${top[1].name}`, `Which ${cat.toLowerCase().replace(/s$/, '')} has the best ${CATEGORY_DIMENSIONS[cat][1].toLowerCase()}?`] : [],
      }
    }
    return {
      text:
        "I can compare any products listed by manufacturers here — using their **spec sheets, manuals and verified user ratings**.\n\nAdd products with the **+ Add product** button below, type a product name, or try one of these:",
      productIds: [],
      blocks: [],
      followups: ['Compare Orbit X1 and Nova Pulse 7', 'Auralis Studio ANC vs Nova SoundPod Pro — which is better value?', 'Show me the best laptops'],
    }
  }

  const list = ids.map(byId)

  // ---------------- Single product ----------------
  if (list.length === 1) {
    const p = list[0]
    const st = ratingStats(p, reviews)
    const dims = CATEGORY_DIMENSIONS[p.category]
    const sorted = [...dims].sort((a, b) => (p.scores[b] ?? 0) - (p.scores[a] ?? 0))
    const rival = products
      .filter((x) => x.category === p.category && x.id !== p.id)
      .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))[0]
    let text = `**${p.name}** by ${mfr(p)} costs **${money(p.price)}** and is rated **★ ${fmt1(st.avg)}** from ${st.count.toLocaleString()} users.\n\n`
    if (wantsDocs) {
      const w = spec(p, 'Warranty')
      text += `From the official documentation:\n- **Warranty:** ${w ?? 'see warranty document'}\n- Setup, care and troubleshooting are covered in the *User Manual* (${p.manuals[0]?.pages ?? '—'} pages).\n\n`
    } else {
      text += `**Strongest areas:** ${sorted.slice(0, 2).map((d) => `${d} (${fmt1(p.scores[d] ?? 0)})`).join(', ')}.\n**Weakest area:** ${sorted[sorted.length - 1]} (${fmt1(p.scores[sorted[sorted.length - 1]] ?? 0)}).\n\nIts value-for-money score is **${fmt1(valueScore(p, products, reviews))}/10** within ${p.category.toLowerCase()}.`
    }
    return {
      text,
      productIds: ids,
      blocks: [
        { type: 'product', productId: p.id },
        { type: 'sources', items: [{ productId: p.id, doc: p.manuals[2]?.name ?? 'Spec sheet', ref: 'p. 1–2' }, { productId: p.id, doc: `${st.count.toLocaleString()} user ratings`, ref: 'reviews' }] },
      ],
      followups: rival ? [`Compare with ${rival.name}`, `Is ${p.name} worth the price?`, `What does the warranty cover?`] : [`What does the warranty cover?`],
    }
  }

  // ---------------- Comparison ----------------
  const cats = new Set(list.map((p) => p.category))
  const names = list.map((p) => `**${p.name}**`)
  const nameList = names.length === 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  const totalRatings = list.reduce((a, p) => a + ratingStats(p, reviews).count, 0)
  let text = `I analysed the spec sheets, manuals and ${totalRatings.toLocaleString()} user ratings for ${nameList}.\n\n`

  if (cats.size > 1) {
    text += `⚠️ These products are in different categories (${[...cats].join(', ')}), so I'm comparing price, ratings and overall value rather than individual specs.\n\n`
  }

  const dims = cats.size === 1 ? CATEGORY_DIMENSIONS[list[0].category] : []
  const values = list.map((p) => ({ p, v: valueScore(p, products, reviews), q: qualityScore(p, reviews) }))
  const bestValue = [...values].sort((a, b) => b.v - a.v)[0]
  const bestQuality = [...values].sort((a, b) => b.q - a.q)[0]

  // Focused dimension question
  if (dim && dims.includes(dim)) {
    const ranked = [...list].sort((a, b) => (b.scores[dim] ?? 0) - (a.scores[dim] ?? 0))
    const w = ranked[0]
    text += `### ${dim}\n**${w.name}** wins on ${dim.toLowerCase()} with a score of **${fmt1(w.scores[dim] ?? 0)}**${ranked[1] ? ` vs ${fmt1(ranked[1].scores[dim] ?? 0)} for ${ranked[1].name}` : ''}.\n`
    for (const p of ranked) {
      const hint = dimSpecHint(p, dim)
      if (hint) text += `- ${p.name}: ${hint}\n`
    }
    text += '\n'
  }

  if (wantsDocs) {
    text += `### Warranty & documentation\n`
    for (const p of list) text += `- **${p.name}:** ${spec(p, 'Warranty') ?? 'not specified'} · ${p.manuals.length} official documents (${p.manuals[0]?.pages ?? '—'}-page manual)\n`
    text += '\n'
  }

  if (dims.length) {
    text += `### Where each one wins\n`
    for (const p of list) {
      const wins = dims.filter((d) => list.every((o) => o === p || (p.scores[d] ?? 0) > (o.scores[d] ?? 0)))
      text += `- **${p.name}:** ${wins.length ? wins.join(', ') : 'no outright category wins'}\n`
    }
    text += '\n'
  }

  // Value analysis
  const cheapest = [...list].sort((a, b) => a.price - b.price)[0]
  const priciest = [...list].sort((a, b) => b.price - a.price)[0]
  const cq = values.find((x) => x.p === cheapest)!.q
  const pq = values.find((x) => x.p === priciest)!.q
  const pctQuality = Math.round((cq / pq) * 100)
  const priceDiff = priciest.price - cheapest.price
  text += `### Value for money\n`
  if (priceDiff > 0) {
    text += `**${cheapest.name}** costs **${money(priceDiff)} less** (${Math.round((priceDiff / priciest.price) * 100)}% cheaper) and delivers **${Math.min(pctQuality, 120)}%** of ${priciest.name}'s overall quality. `
  }
  text += `Value scores: ${values.map(({ p, v }) => `${p.name} **${fmt1(v)}**`).join(' · ')}.\n\n`

  // Verdict
  text += `### Verdict\n`
  if (bestValue.p.id === bestQuality.p.id) {
    text += `**${bestValue.p.name}** is the clear pick — it's both the higher-quality product and the better value.`
  } else {
    text += `Choose **${bestQuality.p.name}** if you want the best overall product and the extra ${money(Math.abs(bestQuality.p.price - bestValue.p.price))} isn't a concern. Choose **${bestValue.p.name}** if you want the most for your money.`
  }

  const sources = list.flatMap((p) => [
    { productId: p.id, doc: p.manuals.find((m) => m.kind === 'datasheet')?.name ?? 'Spec sheet', ref: 'p. 1–4' },
    { productId: p.id, doc: p.manuals.find((m) => m.kind === (wantsDocs ? 'warranty' : 'manual'))?.name ?? 'Manual', ref: `p. ${pageRef(p.id, dim ?? msg, p.manuals[0]?.pages ?? 40)}` },
  ])

  const followups: string[] = []
  const other = dims.find((d) => d !== dim)
  if (other) followups.push(`Which has better ${other.toLowerCase()}?`)
  if (!wantsDocs) followups.push('Compare their warranties')
  if (!wantsValue) followups.push('Which one is better value?')
  const third = products.find((x) => cats.size === 1 && x.category === list[0].category && !ids.includes(x.id))
  if (third) followups.push(`Add ${third.name} to the comparison`)

  return {
    text,
    productIds: ids,
    blocks: [
      ...(cats.size === 1 ? [{ type: 'compare' as const, productIds: ids }] : []),
      { type: 'value', productIds: ids },
      { type: 'sources', items: sources },
    ],
    followups: followups.slice(0, 3),
  }
}
