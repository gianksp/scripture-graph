import { useStore } from '../store/store'
import { useBible } from '../data/useBible'
import { parseUserInput, verseIdToLabel } from '../data/bookMap'

const POPULAR_VERSES = [
    'John 3:16', 'Genesis 1:1', 'Psalms 23:1', 'Romans 8:28',
    'Isaiah 53:5', 'Jeremiah 29:11', 'Proverbs 3:5', 'Matthew 5:3',
    'Hebrews 11:1', 'Revelation 21:4', 'John 1:1', 'Romans 3:23',
]

export default function EmptyState() {
    const selectVerse = useStore(s => s.selectVerse)
    const { getVerse } = useBible()

    function searchVerse(label) {
        const id = parseUserInput(label)
        if (id) selectVerse(id, getVerse, verseIdToLabel)
    }

    return (
        <div className="h-full flex flex-col p-6 font-sans bg-panel dark:bg-panel-dark">
            <div className="text-2xs tracking-widest text-secondary dark:text-secondary-dark mb-4">
                EXPLORE A VERSE
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {POPULAR_VERSES.map(v => (
                    <button
                        key={v}
                        onClick={() => searchVerse(v)}
                        className="text-xs px-3 py-1.5 rounded transition-colors
                       bg-surface dark:bg-surface-dark
                       border border-hairline dark:border-hairline-dark
                       text-secondary dark:text-secondary-dark
                       hover:text-gold hover:border-gold"
                    >{v}</button>
                ))}
            </div>
            <div className="text-2xs text-ghost dark:text-ghost-dark leading-loose">
                click a book label · search a verse · right-drag to rotate
            </div>
        </div>
    )
}