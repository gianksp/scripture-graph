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
    const fromColor = fromOT ? 'text-ot' : 'text-nt'
    const toColor = toOT ? 'text-ot' : 'text-nt'
    const direction = fromOT && !toOT ? 'OT→NT' : !fromOT && toOT ? 'NT→OT' : fromOT ? 'OT→OT' : 'NT→NT'

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`rounded-lg p-3 shrink-0 transition-all border font-sans
        ${isFocused
                    ? 'bg-elevated dark:bg-elevated-dark border-subtle dark:border-subtle-dark'
                    : 'bg-panel dark:bg-panel-dark border-hairline dark:border-hairline-dark'
                }`}
        >
            <div className="flex items-center gap-2 mb-2.5">
                <span className="text-2xs text-tertiary dark:text-tertiary-dark bg-elevated dark:bg-elevated-dark border border-subtle dark:border-subtle-dark rounded px-1.5 py-0.5">
                    {direction}
                </span>
                <span className="text-xs text-tertiary dark:text-tertiary-dark">
                    {connection.votes} votes
                </span>
            </div>

            {!isSharedSource && (
                <div
                    onClick={() => onVerseSelect(fromId)}
                    className="mb-2.5 pb-2.5 border-b border-hairline dark:border-hairline-dark cursor-pointer hover:opacity-70 transition-opacity"
                >
                    <div className={`text-sm mb-1 ${fromColor}`}>{fromLabel}</div>
                    <div className="text-md text-secondary dark:text-secondary-dark leading-relaxed">{fromText || '—'}</div>
                </div>
            )}

            <div onClick={() => onVerseSelect(toId)} className="cursor-pointer hover:opacity-70 transition-opacity">
                <div className={`text-sm mb-1 ${toColor}`}>{toLabel}</div>
                <div className="text-md text-tertiary dark:text-tertiary-dark leading-relaxed">{toText || '—'}</div>
            </div>
        </div>
    )
}