import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

// Tappable "document, page" chip that opens the Source viewer (S16, route /sources).
export default function SourceChip({ source }) {
  const q = source.id
    ? `id=${encodeURIComponent(source.id)}`
    : `doc=${encodeURIComponent(source.doc)}&page=${source.page}`
  return (
    <Link
      to={`/sources?${q}`}
      className="tap inline-flex items-center gap-1 rounded-full border-2 border-brand-700 bg-white px-3 text-sm font-bold text-brand-900"
    >
      <FileText size={16} /> {source.doc}, p.{source.page}
    </Link>
  )
}
