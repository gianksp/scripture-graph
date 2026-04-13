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