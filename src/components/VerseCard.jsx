import { isOT } from '../data/bookMap'

export default function VerseCard({ verseId, label, text, votes, onClick, active }) {
  const book     = verseId?.split('.')[0]
  const color    = isOT(book) ? '#7ab8f5' : '#7dd4a0'
  const testament = isOT(book) ? 'OT' : 'NT'

  return (
    <div
      onClick={onClick}
      className={`px-5 py-3 cursor-pointer hover:bg-surface2 transition-colors
        border-l-2 ${active ? 'border-gold bg-surface2' : 'border-transparent'}`}
    >
      <div className="font-mono text-xs mb-1" style={{ color }}>{label}</div>
      {text && (
        <div className="text-xs text-dim leading-relaxed line-clamp-2">{text}</div>
      )}
      {votes && (
        <div className="font-mono text-xs mt-1 text-faint">{testament} · {votes} links</div>
      )}
    </div>
  )
}