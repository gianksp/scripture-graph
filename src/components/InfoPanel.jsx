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
  const centerColor = centerOT ? '#7ab8f5' : '#7dd4a0'
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 20px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, color: centerColor, fontWeight: 500 }}>{centerLabel}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#444', background: '#161616', border: '1px solid #222', borderRadius: 3, padding: '2px 6px' }}>{testament}</span>
          </div>
          {text && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
              &ldquo;{text.slice(0, 180)}{text.length > 180 ? '…' : ''}&rdquo;
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          <StatBadge label="total" value={unique.length} color="#d4a843" />
          <StatBadge label="OT→OT" value={otLinks} color="#7ab8f5" />
          <StatBadge label="NT→NT" value={ntLinks} color="#7dd4a0" />
          <StatBadge label="cross" value={crossLinks} color="#d4a843" />
        </div>

        <button onClick={clearVerse}
          style={{ background: 'none', border: 'none', color: '#444', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 }}
          onMouseEnter={e => e.target.style.color = '#fff'}
          onMouseLeave={e => e.target.style.color = '#444'}
        >×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 16px 60px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.length === 0 && (
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#333', padding: '20px 0', textAlign: 'center' }}>
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