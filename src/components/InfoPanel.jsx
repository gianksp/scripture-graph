import { useState } from 'react'
import { useStore } from '../store/store'
import { useBible } from '../data/useBible'
import { BOOK_MAP, isOT, verseIdToLabel, chronoSort } from '../data/bookMap'
import ConnectionCard from './ConnectionCard'
import StatBadge from './StatBadge'
import EmptyState from './EmptyState'

export default function InfoPanel() {
  const activeVerse = useStore(s => s.activeVerse)
  const connections = useStore(s => s.connections)
  const centerText = useStore(s => s.centerText)
  const clearVerse = useStore(s => s.clearVerse)
  const setFocusedConn = useStore(s => s.setFocusedConn)
  const selectVerse = useStore(s => s.selectVerse)
  const { getVerse } = useBible()
  const [focusedIndex, setFocusedIndex] = useState(null)

  if (!activeVerse) return <EmptyState />

  const isChapterMode = activeVerse.includes('__ch__')
  const isBookMode = activeVerse.startsWith('__book__') && !isChapterMode
  const bookCode = activeVerse.startsWith('__book__')
    ? activeVerse.replace('__book__', '').replace(/__ch__.*$/, '') : null
  const chapterNum = isChapterMode ? activeVerse.split('__ch__')[1] : null

  const centerLabel = isChapterMode
    ? `${BOOK_MAP[bookCode] || bookCode} ${chapterNum}`
    : isBookMode ? (BOOK_MAP[bookCode] || bookCode)
      : verseIdToLabel(activeVerse)

  const centerOT = bookCode ? isOT(bookCode) : isOT((activeVerse.split('.') || [''])[0])
  const centerColor = centerOT ? 'text-ot' : 'text-nt'
  const testament = centerOT ? 'Old Testament' : 'New Testament'
  const text = centerText || (!isBookMode && !isChapterMode ? getVerse(activeVerse) : null)

  const dedupMap = new Map()
  connections.forEach(c => {
    if (!c.from || !c.to) return
    const key = [c.from.split('-')[0], c.to.split('-')[0]].sort().join('|')
    const ex = dedupMap.get(key)
    if (!ex || c.votes > ex.votes) dedupMap.set(key, c)
  })
  const unique = [...dedupMap.values()]
  const sorted = [...unique].sort((a, b) => chronoSort(a.to || '', b.to || ''))

  const otLinks = unique.filter(c => isOT(c.from.split('.')[0]) && isOT(c.to.split('.')[0])).length
  const ntLinks = unique.filter(c => !isOT(c.from.split('.')[0]) && !isOT(c.to.split('.')[0])).length
  const crossLinks = unique.filter(c => isOT(c.from.split('.')[0]) !== isOT(c.to.split('.')[0])).length
  const isSharedSrc = new Set(unique.map(c => c.from)).size <= 1

  function handleCardFocus(i) {
    setFocusedIndex(i)
    const conn = sorted[i]
    if (conn) setFocusedConn({ from: conn.from.split('-')[0], to: conn.to.split('-')[0] })
  }

  function handleCardBlur() {
    setFocusedIndex(null)
    setFocusedConn(null)
  }

  function onVerseSelect(id) {
    if (!id || id.startsWith('__')) return
    selectVerse(id, getVerse, verseIdToLabel)
  }

  return (
    <div className="h-full flex flex-col font-sans bg-panel dark:bg-panel-dark">

      <div className="flex items-start gap-4 px-5 py-3 border-b border-hairline dark:border-hairline-dark shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-medium ${centerColor}`}>{centerLabel}</span>
            <span className="text-2xs text-tertiary dark:text-tertiary-dark bg-elevated dark:bg-elevated-dark border border-subtle dark:border-subtle-dark rounded px-1.5 py-0.5">
              {testament}
            </span>
          </div>
          {text && (
            <div className="text-base text-tertiary dark:text-tertiary-dark leading-relaxed">
              &ldquo;{text.slice(0, 180)}{text.length > 180 ? '…' : ''}&rdquo;
            </div>
          )}
        </div>

        <div className="flex gap-5 items-center shrink-0">
          <StatBadge label="total" value={unique.length} color="#d4a843" />
          <StatBadge label="OT→OT" value={otLinks} color="#7ab8f5" />
          <StatBadge label="NT→NT" value={ntLinks} color="#7dd4a0" />
          <StatBadge label="cross" value={crossLinks} color="#d4a843" />
        </div>

        <button
          onClick={clearVerse}
          className="text-lg leading-none px-1 text-tertiary dark:text-tertiary-dark hover:text-primary dark:hover:text-primary-dark transition-colors shrink-0"
        >×</button>
      </div>

      <div className="conn-list flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 pb-14 flex flex-col gap-2">
        {sorted.length === 0 && (
          <div className="text-sm text-placeholder dark:text-placeholder-dark py-5 text-center">
            no connections found
          </div>
        )}
        {sorted.map((conn, i) => (
          <ConnectionCard
            key={`${conn.from}-${conn.to}`}
            connection={conn}
            isSharedSource={isSharedSrc}
            onVerseSelect={onVerseSelect}
            isFocused={focusedIndex === i}
            onMouseEnter={() => handleCardFocus(i)}
            onMouseLeave={handleCardBlur}
          />
        ))}
      </div>
    </div>
  )
}