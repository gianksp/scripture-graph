import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useBible } from '../../data/useBible'
import {
    BOOK_MAP, isOT, verseIdToLabel, chronoSort
} from '../../data/bookMap'

const PANEL_H = 380
const CARD_W = 320
const CARD_H = 300

export default function InfoPanel({ onVerseSelect, onClose }) {
    const { state } = useApp()
    const { getVerseByLabel } = useBible()
    const [focusedConn, setFocusedConn] = useState(null)
    const [hoveredPart, setHoveredPart] = useState(null) // { idx, part: 'from'|'to' }

    const { activeVerse, connections, centerText } = state
    if (!activeVerse) return null

    const isBookMode = activeVerse.startsWith('__book__')
    const bookCode = isBookMode ? activeVerse.replace('__book__', '') : null
    const allFroms = connections.map(c => c.from || activeVerse)
    const uniqueFroms = new Set(allFroms)
    const sharedSource = uniqueFroms.size === 1

    const centerLabel = isBookMode ? BOOK_MAP[bookCode] : verseIdToLabel(activeVerse)
    const centerOT = isBookMode ? isOT(bookCode) : isOT(activeVerse.split('.')[0])
    const centerColor = centerOT ? '#7ab8f5' : '#7dd4a0'

    // Dedup by from+to pair
    const seen = new Set()
    const deduped = connections.filter(conn => {
        const key = `${conn.from || activeVerse}__${conn.to}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    const sorted = deduped.sort((a, b) => chronoSort(a.to || '', b.to || ''))

    function handlePartClick(e, verseId) {
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent('verse:search', { detail: verseId }))
    }

    return (
        <div style={{
            height: PANEL_H,
            background: 'rgba(8,8,8,0.98)',
            borderBottom: '1px solid #222',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
        }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: '1px solid #1a1a1a',
                flexShrink: 0,
                gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, overflow: 'hidden', flex: 1 }}>
                    <span style={{
                        fontFamily: 'IBM Plex Mono', fontSize: 16,
                        color: centerColor, letterSpacing: '0.04em', flexShrink: 0,
                    }}>
                        {centerLabel}
                    </span>
                    {(sharedSource || !isBookMode) && centerText && (
                        <span style={{
                            fontSize: 13, color: '#888', fontStyle: 'italic',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                            "{centerText}"
                        </span>
                    )}
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#444', flexShrink: 0 }}>
                        {connections.length} links
                    </span>
                </div>
                <span
                    onClick={onClose}
                    style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#444', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => e.target.style.color = '#ccc'}
                    onMouseLeave={e => e.target.style.color = '#444'}
                >×</span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 10, height: '100%', alignItems: 'stretch' }}>
                    {sorted.map((conn, i) => {
                        const fromId = conn.from || activeVerse
                        const toId = conn.to
                        if (!toId) return null

                        const fromLbl = verseIdToLabel(fromId)
                        const toLbl = verseIdToLabel(toId)
                        const fromTxt = getVerseByLabel(fromLbl) || ''
                        const toTxt = getVerseByLabel(toLbl) || ''
                        const toOT = isOT(toId.split('.')[0])
                        const fromOT = isOT(fromId.split('.')[0])
                        const toColor = toOT ? '#7ab8f5' : '#7dd4a0'
                        const fromColor = fromOT ? '#7ab8f5' : '#7dd4a0'
                        const dir = fromOT && !toOT ? 'OT→NT'
                            : !fromOT && toOT ? 'NT→OT'
                                : fromOT ? 'OT→OT' : 'NT→NT'

                        const isFoc = focusedConn === i
                        const fromHov = hoveredPart?.idx === i && hoveredPart?.part === 'from'
                        const toHov = hoveredPart?.idx === i && hoveredPart?.part === 'to'

                        return (
                            <div
                                key={`${fromId}-${toId}-${i}`}
                                onMouseEnter={() => {
                                    setFocusedConn(i)
                                    window.__focusedConn = { from: fromId, to: toId }
                                }}
                                onMouseLeave={() => {
                                    setFocusedConn(null)
                                    setHoveredPart(null)
                                    window.__focusedConn = null
                                }}
                                style={{
                                    flexShrink: 0,
                                    width: CARD_W,
                                    height: CARD_H,
                                    background: isFoc ? '#141414' : '#0d0d0d',
                                    border: `1px solid ${isFoc ? '#333' : '#1a1a1a'}`,
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    cursor: 'default',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0,
                                    transition: 'border-color 0.12s, background 0.12s',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Badges */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexShrink: 0 }}>
                                    <span style={{
                                        fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#666',
                                        background: '#181818', border: '1px solid #2a2a2a',
                                        borderRadius: 3, padding: '3px 7px',
                                    }}>{dir}</span>
                                    <span style={{
                                        fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#666',
                                        background: '#181818', border: '1px solid #2a2a2a',
                                        borderRadius: 3, padding: '3px 7px',
                                    }}>{conn.votes} links</span>
                                </div>

                                {/* FROM — show when sources differ */}
                                {!sharedSource && (
                                    <div
                                        onMouseEnter={() => setHoveredPart({ idx: i, part: 'from' })}
                                        onMouseLeave={() => setHoveredPart(null)}
                                        onClick={e => handlePartClick(e, fromId)}
                                        style={{
                                            flexShrink: 0,
                                            flex: 1,
                                            borderRadius: 6,
                                            padding: '8px 10px',
                                            marginBottom: 6,
                                            background: fromHov ? '#1e1e1e' : 'transparent',
                                            border: `1px solid ${fromHov ? fromColor : 'transparent'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.12s',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{
                                            fontFamily: 'IBM Plex Mono', fontSize: 13,
                                            color: fromHov ? '#fff' : fromColor,
                                            marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            {fromLbl}
                                            {fromHov && (
                                                <span style={{ fontSize: 10, color: '#888', fontStyle: 'normal' }}>
                                                    click to select →
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 14, color: fromHov ? '#ddd' : '#999',
                                            lineHeight: 1.7, transition: 'color 0.12s',
                                        }}>
                                            {fromTxt || '—'}
                                        </div>
                                    </div>
                                )}

                                {/* Divider between from/to */}
                                {!sharedSource && (
                                    <div style={{
                                        height: 1, background: '#1e1e1e',
                                        margin: '2px 0 8px', flexShrink: 0,
                                    }} />
                                )}

                                {/* TO */}
                                <div
                                    onMouseEnter={() => setHoveredPart({ idx: i, part: 'to' })}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    onClick={e => handlePartClick(e, toId)}
                                    style={{
                                        flex: 1,
                                        borderRadius: 6,
                                        padding: '8px 10px',
                                        background: toHov ? '#1e1e1e' : 'transparent',
                                        border: `1px solid ${toHov ? toColor : 'transparent'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.12s',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 5,
                                    }}
                                >
                                    <div style={{
                                        fontFamily: 'IBM Plex Mono', fontSize: 13,
                                        color: toHov ? '#fff' : toColor,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        flexShrink: 0,
                                    }}>
                                        {toLbl}
                                        {toHov && (
                                            <span style={{ fontSize: 10, color: '#888' }}>
                                                click to select →
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: 14, color: toHov ? '#ddd' : '#aaa',
                                        lineHeight: 1.7, flex: 1,
                                        overflow: 'hidden',
                                        transition: 'color 0.12s',
                                    }}>
                                        {toTxt || '—'}
                                    </div>
                                </div>

                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}