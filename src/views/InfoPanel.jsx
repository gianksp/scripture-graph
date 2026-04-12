import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useBible } from '../data/useBible'
import { BOOK_MAP, isOT, verseIdToLabel, chronoSort } from '../data/bookMap'

export default function InfoPanel({ onClose }) {
  const { state } = useApp()
  const { getVerse } = useBible()
  const [foc, setFoc] = useState(null)
  const [hov, setHov] = useState(null)

  const { activeVerse, connections, centerText } = state
  if (!activeVerse) return null

  const isChMode = activeVerse.includes('__ch__')
  const isBookMode = activeVerse.startsWith('__book__') && !isChMode
  const bookCode = activeVerse.startsWith('__book__')
    ? activeVerse.replace('__book__', '').replace(/__ch__.*$/, '') : null
  const chNum = isChMode ? activeVerse.split('__ch__')[1] : null

  const centerLabel = isChMode ? `${BOOK_MAP[bookCode]} ${chNum}`
    : isBookMode ? BOOK_MAP[bookCode]
      : verseIdToLabel(activeVerse)

  const centerOT = bookCode ? isOT(bookCode) : isOT(activeVerse.split('.')[0])
  const cColor = centerOT ? '#7ab8f5' : '#7dd4a0'

  const allFroms = connections.map(c => c.from || activeVerse)
  const sharedSrc = new Set(allFroms).size === 1

  const seen = new Set()
  const sorted = connections
    .filter(c => { const k = `${c.from || activeVerse}__${c.to}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => chronoSort(a.to || '', b.to || ''))

  function sel(id) { window.dispatchEvent(new CustomEvent('verse:search', { detail: id })) }

  return (
    <div className="flex flex-col shrink-0 font-mono" style={{ height: 280, background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 shrink-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <span className="text-sm shrink-0" style={{ color: cColor }}>{centerLabel}</span>
        {(sharedSrc || !isBookMode) && centerText && (
          <span className="text-xs italic truncate" style={{ color: '#555' }}>"{centerText}"</span>
        )}
        <span className="text-xs ml-auto shrink-0" style={{ color: '#333' }}>{sorted.length} links</span>
        <button onClick={onClose} className="text-base leading-none ml-2 transition-colors"
          style={{ color: '#333' }}
          onMouseEnter={e => e.target.style.color = '#fff'}
          onMouseLeave={e => e.target.style.color = '#333'}>×</button>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 8, height: '100%', flexWrap: 'nowrap' }}>
          {sorted.map((conn, i) => {
            const fromId = conn.from || activeVerse
            const toId = conn.to
            if (!toId) return null
            const fromLbl = verseIdToLabel(fromId)
            const toLbl = verseIdToLabel(toId)
            const fromTxt = getVerse(fromLbl)
            const toTxt = getVerse(toLbl)
            const toOT = isOT(toId.split('.')[0])
            const fromOT = isOT(fromId.split('.')[0])
            const toCol = toOT ? '#7ab8f5' : '#7dd4a0'
            const fromCol = fromOT ? '#7ab8f5' : '#7dd4a0'
            const dir = fromOT && !toOT ? 'OT→NT' : !fromOT && toOT ? 'NT→OT' : fromOT ? 'OT→OT' : 'NT→NT'
            const isFoc = foc === i
            const hovFrom = hov?.i === i && hov?.p === 'from'
            const hovTo = hov?.i === i && hov?.p === 'to'

            if (isFoc) window.__focusedConn = { from: fromId, to: toId }

            return (
              <div key={`${fromId}-${toId}-${i}`}
                onMouseEnter={() => { setFoc(i); window.__focusedConn = { from: fromId, to: toId } }}
                onMouseLeave={() => { setFoc(null); window.__focusedConn = null }}
                className="shrink-0 flex flex-col rounded-lg overflow-hidden transition-colors"
                style={{
                  width: 260, height: '100%',
                  background: isFoc ? '#161616' : '#0f0f0f',
                  border: `1px solid ${isFoc ? '#2a2a2a' : '#1a1a1a'}`,
                }}>

                {/* Badges */}
                <div className="flex gap-1.5 px-3 pt-2.5 pb-2 shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#555', background: '#161616', border: '1px solid #222' }}>{dir}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#555', background: '#161616', border: '1px solid #222' }}>{conn.votes}↑</span>
                </div>

                {/* FROM */}
                {!sharedSrc && (
                  <div
                    onMouseEnter={() => setHov({ i, p: 'from' })}
                    onMouseLeave={() => setHov(null)}
                    onClick={() => sel(fromId)}
                    className="px-3 py-2 cursor-pointer shrink-0 transition-colors"
                    style={{ borderBottom: '1px solid #1a1a1a', background: hovFrom ? '#1e1e1e' : 'transparent' }}>
                    <div className="text-xs mb-1 flex items-center gap-2" style={{ color: hovFrom ? '#fff' : fromCol }}>
                      {fromLbl}{hovFrom && <span className="text-[10px]" style={{ color: '#555' }}>select →</span>}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: hovFrom ? '#ccc' : '#666' }}>{fromTxt || '—'}</div>
                  </div>
                )}

                {/* TO */}
                <div
                  onMouseEnter={() => setHov({ i, p: 'to' })}
                  onMouseLeave={() => setHov(null)}
                  onClick={() => sel(toId)}
                  className="flex-1 px-3 py-2 cursor-pointer overflow-hidden transition-colors"
                  style={{ background: hovTo ? '#1e1e1e' : 'transparent' }}>
                  <div className="text-xs mb-1 flex items-center gap-2" style={{ color: hovTo ? '#fff' : toCol }}>
                    {toLbl}{hovTo && <span className="text-[10px]" style={{ color: '#555' }}>select →</span>}
                  </div>
                  <div className="text-xs leading-relaxed overflow-hidden" style={{ color: hovTo ? '#ddd' : '#888' }}>{toTxt || '—'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div >
  )
}