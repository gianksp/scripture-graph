import { useMemo } from 'react'
import { useStore, selectFilteredRefs } from '../store/store'
import { useBible } from '../data/useBible'
import { parseUserInput, verseIdToLabel } from '../data/bookMap'
import ConnectionCard from './ConnectionCard'

const POPULAR_VERSES = [
    'John 3:16', 'Genesis 1:1', 'Psalms 23:1', 'Romans 8:28',
    'Isaiah 53:5', 'Jeremiah 29:11', 'Proverbs 3:5', 'Matthew 5:3',
    'Hebrews 11:1', 'Revelation 21:4', 'John 1:1', 'Romans 3:23',
]

export default function EmptyState() {
    const selectVerse = useStore(s => s.selectVerse)
    const filteredRefs = useStore(selectFilteredRefs)
    const { getVerse } = useBible()

    function searchVerse(label) {
        const id = parseUserInput(label)
        if (id) selectVerse(id, getVerse, verseIdToLabel)
    }

    // Top 100 highest-vote connections across all refs
    const topConnections = useMemo(() => {
        return [...filteredRefs]
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 100)
            .map(r => ({ from: r.from, to: r.to, votes: r.votes }))
    }, [filteredRefs])

    return (
        <div className="h-full flex flex-col font-sans bg-panel dark:bg-panel-dark overflow-hidden">

            {/* ── Scrollable content ──────────────────────────────── */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 flex flex-col gap-4 pb-6"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {/* Popular verses */}
                <div>
                    <div className="text-2xs tracking-widest text-tertiary dark:text-tertiary-dark mb-3 uppercase">
                        Popular verses
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR_VERSES.map(v => (
                            <button
                                key={v}
                                onClick={() => searchVerse(v)}
                                className="text-xs px-3 py-1.5 rounded-full transition-colors
                           bg-surface dark:bg-surface-dark
                           border border-hairline dark:border-hairline-dark
                           text-secondary dark:text-secondary-dark
                           hover:text-gold hover:border-gold active:opacity-70"
                            >{v}</button>
                        ))}
                    </div>
                </div>

                {/* Top connections */}
                <div>
                    <div className="text-2xs tracking-widest text-tertiary dark:text-tertiary-dark mb-3 uppercase">
                        Top cross-references
                    </div>
                    <div className="flex flex-col gap-2">
                        {topConnections.map((conn, i) => (
                            <ConnectionCard
                                key={`${conn.from}-${conn.to}`}
                                connection={conn}
                                isSharedSource={false}
                                onVerseSelect={id => searchVerse(verseIdToLabel(id))}
                                isFocused={false}
                                onMouseEnter={() => { }}
                                onMouseLeave={() => { }}
                            />
                        ))}
                    </div>
                </div>

                {/* Hint */}
                <div className="text-2xs text-ghost dark:text-ghost-dark leading-loose pt-2">
                    click a book label · search a verse · right-drag to rotate
                </div>
            </div>
        </div>
    )
}