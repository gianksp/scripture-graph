import { useState, useCallback } from 'react'
import { useStore } from '../../store/store'
import { useBible } from '../../data/useBible'
import { parseUserInput, verseIdToLabel, BOOK_MAP } from '../../data/bookMap'
import BottomSheet from './BottomSheet'

const POPULAR = [
    'John 3:16', 'Genesis 1:1', 'Psalms 23:1', 'Romans 8:28',
    'Isaiah 53:5', 'Jeremiah 29:11', 'Proverbs 3:5', 'Matthew 5:3',
    'Hebrews 11:1', 'Revelation 21:4', 'John 1:1', 'Romans 3:23',
]

const BOOK_NAMES = Object.entries(BOOK_MAP).map(([id, name]) => ({ id, name }))

function buildSuggestions(query) {
    if (!query || query.length < 1) return []
    const q = query.toLowerCase()
    const results = []

    BOOK_NAMES.forEach(({ id, name }) => {
        if (name.toLowerCase().startsWith(q) || id.toLowerCase().startsWith(q)) {
            results.push({ label: name, sublabel: 'Book', value: name })
        }
    })

    POPULAR.forEach(v => {
        if (v.toLowerCase().includes(q)) {
            results.push({ label: v, sublabel: 'Verse', value: v })
        }
    })

    return results.slice(0, 6)
}

function SuggestionRow({ label, sublabel, onSelect }) {
    return (
        <div
            onMouseDown={onSelect}
            className="flex items-center justify-between px-4 py-3 cursor-pointer
                       text-primary dark:text-primary-dark
                       hover:bg-elevated dark:hover:bg-elevated-dark
                       border-b border-hairline dark:border-hairline-dark last:border-0
                       transition-colors active:opacity-70"
        >
            <span className="text-sm">{label}</span>
            <span className="text-2xs text-tertiary dark:text-tertiary-dark">{sublabel}</span>
        </div>
    )
}

function PopularChip({ label, onSelect }) {
    return (
        <button
            onMouseDown={onSelect}
            className="text-xs px-3 py-1.5 rounded-full transition-colors
                       bg-elevated dark:bg-elevated-dark
                       border border-hairline dark:border-hairline-dark
                       text-secondary dark:text-secondary-dark
                       hover:text-gold hover:border-gold
                       active:opacity-70"
        >
            {label}
        </button>
    )
}

export default function SearchBar({ open, onClose }) {
    const selectFromUrl = useStore(s => s.selectFromUrl)
    const [query, setQuery] = useState('')

    const suggestions = buildSuggestions(query)

    const submit = useCallback((raw) => {
        if (!raw) return

        // Update URL — human readable, no internal prefixes
        const params = new URLSearchParams()
        params.set('q', raw)
        window.history.pushState({}, '', `?${params.toString()}`)

        // Reuse selectFromUrl — it parses any human readable string
        selectFromUrl(raw)
        setQuery('')
        onClose()
    }, [selectFromUrl, onClose])

    function handleClose() {
        setQuery('')
        onClose()
    }

    return (
        <BottomSheet bare open={open} onClose={handleClose}>
            <div className="p-3 flex flex-col gap-3">

                <div className="relative">
                    <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submit(query) }}
                        placeholder="John 3:16 · Romans 8 · Genesis 1:1-5 · Isaiah..."
                        className="w-full font-sans text-sm px-4 py-3 rounded-xl outline-none transition-colors
                                   bg-elevated dark:bg-elevated-dark border border-gold
                                   text-primary dark:text-primary-dark
                                   placeholder:text-secondary dark:placeholder:text-secondary-dark"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       text-tertiary dark:text-tertiary-dark active:opacity-70"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>

                {query.length > 0 && suggestions.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-hairline dark:border-hairline-dark">
                        {suggestions.map((s, i) => (
                            <SuggestionRow
                                key={i}
                                label={s.label}
                                sublabel={s.sublabel}
                                onSelect={() => submit(s.value)}
                            />
                        ))}
                    </div>
                )}

                {query.length > 0 && suggestions.length === 0 && (
                    <div className="text-sm text-tertiary dark:text-tertiary-dark text-center py-2">
                        No matches — try "John 3:16" or "Genesis 1"
                    </div>
                )}

                {query.length === 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="text-2xs tracking-widest text-tertiary dark:text-tertiary-dark uppercase">
                            Popular searches
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR.map(v => (
                                <PopularChip key={v} label={v} onSelect={() => submit(v)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </BottomSheet>
    )
}