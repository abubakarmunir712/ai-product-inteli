import { Fragment, type ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
    : part.startsWith('*') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em>
    : <Fragment key={i}>{part}</Fragment>,
  )
}

/** Tiny markdown subset: paragraphs, ### headings, "- " bullets, **bold**, *italic*. */
export function RichText({ text, caret = false }: { text: string; caret?: boolean }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc space-y-1 pl-5">
          {bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}
        </ul>,
      )
      bullets = []
    }
  }
  lines.forEach((l) => {
    if (l.startsWith('- ')) return bullets.push(l.slice(2))
    flush()
    if (l.startsWith('### ')) blocks.push(<h4 key={blocks.length} className="mt-4 mb-1 font-semibold text-slate-900">{inline(l.slice(4))}</h4>)
    else if (l.trim()) blocks.push(<p key={blocks.length} className="my-1.5">{inline(l)}</p>)
  })
  flush()
  return <div className={`leading-relaxed text-slate-700 ${caret ? '[&>*:last-child]:caret' : ''}`}>{blocks}</div>
}
