import { ArrowLeft, CheckCircle2, FileText, Loader2, Plus, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductVisual } from '../components/ProductVisual'
import { CATEGORIES, CATEGORY_DIMENSIONS } from '../data/seed'
import type { Category, ManualFile, Product, SpecRow } from '../data/types'
import { money, uid } from '../lib/utils'
import { useMe, useStore } from '../store'

const TEMPLATES: Record<Category, [string, string][]> = {
  Smartphones: [['Display', 'Screen'], ['Performance', 'Chipset'], ['Performance', 'RAM'], ['Performance', 'Storage'], ['Camera', 'Main camera'], ['Battery', 'Capacity'], ['Battery', 'Charging'], ['Build', 'Water resistance'], ['Build', 'Weight'], ['General', 'Warranty']],
  Laptops: [['Display', 'Screen'], ['Performance', 'Processor'], ['Performance', 'Memory'], ['Performance', 'Storage'], ['Performance', 'Graphics'], ['Battery', 'Battery life'], ['Build', 'Weight'], ['Connectivity', 'Ports'], ['General', 'Warranty']],
  Headphones: [['Audio', 'Drivers'], ['Audio', 'Codecs'], ['Noise control', 'ANC'], ['Battery', 'Battery life'], ['Build', 'Weight'], ['Connectivity', 'Bluetooth'], ['General', 'Warranty']],
  'Home Appliances': [['Performance', 'CADR'], ['Performance', 'Room coverage'], ['Noise', 'Noise level'], ['Efficiency', 'Power draw'], ['Smart', 'Connectivity'], ['Maintenance', 'Filter life'], ['General', 'Warranty']],
}

type Upload = ManualFile & { status: 'indexing' | 'ready' }

export default function NewProduct() {
  const me = useMe()!
  const m = useStore((s) => s.manufacturers.find((x) => x.id === me.manufacturerId))!
  const addProduct = useStore((s) => s.addProduct)
  const nav = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>(m.id === 'kestrel' ? 'Laptops' : m.id === 'auralis' ? 'Headphones' : m.id === 'brightfield' ? 'Home Appliances' : 'Smartphones')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [highlights, setHighlights] = useState('')
  const [specs, setSpecs] = useState<SpecRow[]>(TEMPLATES[category].map(([group, label]) => ({ group, label, value: '' })))
  const [uploads, setUploads] = useState<Upload[]>([])
  const [drag, setDrag] = useState(false)
  const [announce, setAnnounce] = useState(true)

  const changeCategory = (c: Category) => {
    setCategory(c)
    setSpecs(TEMPLATES[c].map(([group, label]) => ({ group, label, value: '' })))
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const added: Upload[] = [...files].map((f) => {
      const lower = f.name.toLowerCase()
      return {
        name: f.name,
        kind: lower.includes('warrant') ? 'warranty' : lower.includes('quick') ? 'quickstart' : lower.includes('data') || lower.includes('spec') ? 'datasheet' : 'manual',
        pages: Math.max(2, Math.round(f.size / 45_000)),
        size: `${(f.size / 1_048_576).toFixed(1)} MB`,
        status: 'indexing',
      }
    })
    setUploads((u) => [...u, ...added])
    added.forEach((a, i) => setTimeout(() => setUploads((u) => u.map((x) => (x.name === a.name ? { ...x, status: 'ready' } : x))), 1400 + i * 600))
  }

  const valid = name.trim() && Number(price) > 0 && description.trim()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uid().slice(0, 4)}`
    const filled = specs.filter((s) => s.value.trim())
    // Placeholder AI scores until the real pipeline analyses the documents
    const scores = Object.fromEntries(CATEGORY_DIMENSIONS[category].map((d) => [d, +(7.2 + Math.random() * 2).toFixed(1)]))
    const product: Product = {
      id,
      manufacturerId: m.id,
      name: name.trim(),
      category,
      price: Number(price),
      releaseDate: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      highlights: highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      specs: filled,
      manuals: uploads.map(({ status: _s, ...rest }) => rest),
      scores,
      ratingDist: [0, 0, 0, 0, 0],
      views: 0,
    }
    addProduct(product, announce ? `🚀 Just launched: ${product.name}! ${product.description} Specs and manuals are available on the product page.` : '')
    nav(`/products/${id}`)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="size-4" /> Back to dashboard</Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Upload a new product</h1>
      <p className="text-sm text-slate-500">Publish specs and documents. Manuals are indexed so the AI assistant can answer user questions about your product.</p>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="font-semibold text-slate-900">Basic information</h2>
            <div>
              <label className="label">Product name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Orbit X2 Pro" className="input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Category *</label>
                <select value={category} onChange={(e) => changeCategory(e.target.value as Category)} className="input">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price (USD) *</label>
                <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="699" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this product special?" className="input resize-none" />
            </div>
            <div>
              <label className="label">Key highlights <span className="font-normal text-slate-400">(one per line)</span></label>
              <textarea rows={3} value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder={'5,000 mAh battery\n120 Hz display'} className="input resize-none" />
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Specifications</h2>
              <span className="text-xs text-slate-500">Template for {category}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-[110px_140px_1fr_32px] gap-2 text-xs font-semibold text-slate-500"><span>Group</span><span>Spec</span><span>Value</span></div>
              {specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[110px_140px_1fr_32px] gap-2">
                  <input value={s.group} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))} className="input px-2" />
                  <input value={s.label} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="input px-2" />
                  <input value={s.value} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="—" className="input px-2" />
                  <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="flex items-center justify-center text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSpecs([...specs, { group: 'General', label: '', value: '' }])} className="btn-ghost mt-3 px-2 text-indigo-600"><Plus className="size-4" /> Add spec</button>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Manuals & documents</h2>
            <p className="text-sm text-slate-500">User manuals, quick-start guides, datasheets, warranty terms (PDF).</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
              className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${drag ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            >
              <UploadCloud className="size-10 text-indigo-500" />
              <span className="mt-2 font-semibold">Drop files here or click to browse</span>
              <span className="text-xs text-slate-500">PDF up to 50 MB each</span>
              <input type="file" multiple accept=".pdf,application/pdf" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {uploads.length > 0 && (
              <div className="mt-4 divide-y divide-slate-100">
                {uploads.map((u) => (
                  <div key={u.name} className="flex items-center gap-3 py-2.5">
                    <FileText className="size-5 text-red-500" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{u.name}</div><div className="text-xs text-slate-500">{u.size} · {u.kind}</div></div>
                    {u.status === 'indexing'
                      ? <span className="flex items-center gap-1 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Indexing for AI…</span>
                      : <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="size-3.5" /> Ready for AI</span>}
                    <button type="button" onClick={() => setUploads(uploads.filter((x) => x.name !== u.name))} className="text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="sticky top-20 space-y-4">
            <div className="card overflow-hidden">
              <ProductVisual category={category} color={m.color} className="h-36" />
              <div className="p-4">
                <div className="text-xs text-slate-500">{m.name} · {category}</div>
                <div className="font-semibold">{name || 'Product name'}</div>
                <div className="mt-1 text-lg font-bold">{Number(price) > 0 ? money(Number(price)) : '$—'}</div>
                <div className="mt-2 text-xs text-slate-500">{specs.filter((s) => s.value).length} specs · {uploads.length} documents</div>
              </div>
            </div>
            <div className="card flex gap-2 p-4 text-xs text-slate-600">
              <Sparkles className="size-4 shrink-0 text-indigo-500" />
              After publishing, the AI generates performance scores from your specs and documents, and users can start comparing your product.
            </div>
            <label className="flex items-center gap-2 px-1 text-sm text-slate-600"><input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="accent-indigo-600" /> Announce on my feed</label>
            <button disabled={!valid} className="btn-primary w-full py-2.5">Publish product</button>
          </div>
        </aside>
      </form>
    </main>
  )
}
