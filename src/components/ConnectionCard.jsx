import { useBible } from '../data/useBible'
import { isOT, verseIdToLabel } from '../data/bookMap'

export default function ConnectionCard({ connection, isSharedSource, onVerseSelect, isFocused, onMouseEnter, onMouseLeave }) {
    const { getVerse } = useBible()
    const fromId = connection.from.split('-')[0]
    const toId = connection.to.split('-')[0]
    if (!fromId || !toId) return null

    const fromLabel = verseIdToLabel(fromId)
    const toLabel = verseIdToLabel(toId)
    const fromText = getVerse(fromId)
    const toText = getVerse(toId)

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
                borderRadius: 8, padding: '12px 14px',
                flexShrink: 0, transition: 'all 0.1s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#444', background: '#161616', border: '1px solid #222', borderRadius: 3, padding: '2px 6px' }}>
                    {direction}
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#333' }}>{connection.votes} votes</span>
            </div>

            {!isSharedSource && (
                <div
                    onClick={() => onVerseSelect(fromId)}
                    style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #161616', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: fromColor, marginBottom: 4 }}>{fromLabel}</div>
                    <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>{fromText || '—'}</div>
                </div>
            )}

            <div
                onClick={() => onVerseSelect(toId)}
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