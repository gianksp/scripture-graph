import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useBible } from '../data/useBible'
import { BOOK_MAP, isOT, verseIdToLabel, chronoSort, parseUserInput } from '../data/bookMap'

const POPULAR_VERSES = [
  'John 3:16', 'Genesis 1:1', 'Psalms 23:1', 'Romans 8:28',
  'Isaiah 53:5', 'Jeremiah 29:11', 'Proverbs 3:5', 'Matthew 5:3',
  'Hebrews 11:1', 'Revelation 21:4', 'John 1:1', 'Romans 3:23',
]

function EmptyState() {
  function searchVerse(verseLabel) {
    const id = parseUserInput(verseLabel)
    if (id) window.dispatchEvent(new CustomEvent('verse:search', { detail: id }))
  }
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px' }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 16 }}>
        EXPLORE A VERSE
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {POPULAR_VERSES.map(v => (
          <button key={v} onClick={() => searchVerse(v)}
            style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '6px 12px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 4, color: '#555', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.color = '#d4a843'; e.target.style.borderColor = '#d4a843' }}
            onMouseLeave={e => { e.target.style.color = '#555'; e.target.style.borderColor = '#1e1e1e' }}
          >{v}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#2a2a2a', lineHeight: 2 }}>
        click a book label · search a verse · right-drag to rotate
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }) {
  const display = value > 9999 ? `${(value / 1000).toFixed(1)}k` : value
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 17, color: color || '#d4a843', fontWeight: 500 }}>{display}</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#555', marginTop: 1 }}>{label}</div>
    </div>
  )
}

function ConnectionCard({ connection, isSharedSource, onVerseSelect, isFocused, onMouseEnter, onMouseLeave }) {
  const { getVerse } = useBible()
  const fromId = connection.from.split('-')[0]
  const toId = connection.to.split('-')[0]
  if (!fromId || !toId) return null

  const fromLabel = verseIdToLabel(fromId)
  const toLabel = verseIdToLabel(toId)
  const fromText = getVerse(fromLabel)
  const toText = getVerse(toLabel)
  const fromOT = isOT(fromId.split('.')[0])
  const toOT = isOT(toId.split('.')[0])
  const fromColor = fromOT ? '#7ab8f5' : '#7dd4a0'
  const toColor = toOT ? '#7ab8f5' : '#7dd4a0'
  const direction = fromOT && !toOT ? 'OT→NT' : !fromOT && toOT ? 'NT→OT' : fromOT ? 'OT→OT' : 'NT→NT'

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: isFocused ? '#111' : '#0a0a0a',
        border: `1px solid ${isFocused ? '#2a2a2a' : '#161616'}`,
        borderRadius: 8,
        padding: '12px 14px',
        flexShrink: 0,
        transition: 'all 0.1s',
      }}
    >
      {/* Direction + votes header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#444', background: '#161616', border: '1px solid #222', borderRadius: 3, padding: '2px 6px' }}>
          {direction}
        </span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#333' }}>{connection.votes} votes</span>
      </div>

      {/* Source verse — only when different sources */}
      {!isSharedSource && (
        <div onClick={() => onVerseSelect(fromId)}
          style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #161616', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: fromColor, marginBottom: 4 }}>{fromLabel}</div>
          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>{fromText || '—'}</div>
        </div>
      )}

      {/* Destination verse */}
      <div onClick={() => onVerseSelect(toId)}
        style={{ cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: toColor, marginBottom: 4 }}>{toLabel}</div>
        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{toText || '—'}</div>
      </div>
    </div>
  )
}

export default function InfoPanel({ onVerseSelect, onClose }) {
  const { state } = useApp()
  const [focusedIndex, setFocusedIndex] = useState(null)
  const { activeVerse, connections, centerText } = state

  if (!activeVerse) return <EmptyState />

  // Parse active verse type
  const isChapterMode = activeVerse.includes('__ch__')
  const isBookMode = activeVerse.startsWith('__book__') && !isChapterMode
  const bookCode = activeVerse.startsWith('__book__')
    ? activeVerse.replace('__book__', '').replace(/__ch__.*$/, '') : null
  const chapterNum = isChapterMode ? activeVerse.split('__ch__')[1] : null

  const centerLabel = isChapterMode
    ? `${BOOK_MAP[bookCode] || bookCode} ${chapterNum}`
    : isBookMode
      ? (BOOK_MAP[bookCode] || bookCode)
      : verseIdToLabel(activeVerse)

  const centerOT = bookCode ? isOT(bookCode) : isOT((activeVerse.split('.') || [''])[0])
  const centerColor = centerOT ? '#7ab8f5' : '#7dd4a0'
  const testament = centerOT ? 'Old Testament' : 'New Testament'

  // Deduplicate connections (safety net — should already be deduped upstream)
  const dedupMap = new Map()
  connections.forEach(c => {
    if (!c.from || !c.to) return
    const key = [c.from.split('-')[0], c.to.split('-')[0]].sort().join('|')
    const existing = dedupMap.get(key)
    if (!existing || c.votes > existing.votes) dedupMap.set(key, c)
  })
  const uniqueConnections = [...dedupMap.values()]

  // Sort chronologically by destination
  const sortedConnections = [...uniqueConnections].sort((a, b) => chronoSort(a.to || '', b.to || ''))

  // Stats
  const otLinks = uniqueConnections.filter(c => isOT(c.from.split('.')[0]) && isOT(c.to.split('.')[0])).length
  const ntLinks = uniqueConnections.filter(c => !isOT(c.from.split('.')[0]) && !isOT(c.to.split('.')[0])).length
  const crossLinks = uniqueConnections.filter(c => isOT(c.from.split('.')[0]) !== isOT(c.to.split('.')[0])).length

  const allSources = uniqueConnections.map(c => c.from)
  const isSharedSrc = new Set(allSources).size <= 1

  function handleCardFocus(index) {
    setFocusedIndex(index)
    const conn = sortedConnections[index]
    if (conn) window.__focusedConn = { from: conn.from.split('-')[0], to: conn.to.split('-')[0] }
  }

  function handleCardBlur() {
    setFocusedIndex(null)
    window.__focusedConn = null
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 20px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, color: centerColor, fontWeight: 500 }}>{centerLabel}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#444', background: '#161616', border: '1px solid #222', borderRadius: 3, padding: '2px 6px' }}>{testament}</span>
          </div>
          {centerText && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
              "{centerText.slice(0, 180)}{centerText.length > 180 ? '…' : ''}"
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          <StatBadge label="total" value={uniqueConnections.length} color="#d4a843" />
          <StatBadge label="OT→OT" value={otLinks} color="#7ab8f5" />
          <StatBadge label="NT→NT" value={ntLinks} color="#7dd4a0" />
          <StatBadge label="cross" value={crossLinks} color="#d4a843" />
        </div>

        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#444', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 }}
          onMouseEnter={e => e.target.style.color = '#fff'}
          onMouseLeave={e => e.target.style.color = '#444'}
        >×</button>
      </div>

      {/* Scrollable connection list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 16px 60px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedConnections.length === 0 && (
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#333', padding: '20px 0', textAlign: 'center' }}>
            no connections found
          </div>
        )}
        {sortedConnections.map((conn, i) => (
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