import { useState } from 'react'
import { useRefs } from '../data/useRefs'
import { parseUserInput } from '../data/bookMap'
import { useApp } from '../store/AppContext'

const SUGGESTIONS = [
  'John 3:16', 'Genesis 1:1', 'Psalms 23:1', 'Romans 8:28', 'Isaiah 53:5',
  'Jeremiah 29:11', 'Proverbs 3:5', 'Matthew 5:3', 'Hebrews 11:1', 'Revelation 21:4',
]

export default function ArcControls() {
  const { filteredRefs } = useRefs()
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { state } = useApp()
  const stats = state.dataStats
console.log(stats)
  const count = filteredRefs.length

  function submitSearch(raw) {
    const id = parseUserInput(raw)
    if (id) window.dispatchEvent(new CustomEvent('verse:search', { detail: id }))
    setShowSuggestions(false)
    setQuery('')
  }

  const suggestions = query.length >= 2
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  return (
    <div className="flex items-center gap-4 px-5 h-12 shrink-0 font-mono text-xs"
      style={{ background: '#080808', borderBottom: '1px solid #1e1e1e' }}>

      <span className="tracking-widest shrink-0" style={{ color: '#d4a843' }}>BIBLE EXPLORER</span>

      <div className="hidden sm:flex items-center gap-4" style={{ color: '#333' }}>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px" style={{ background: '#7ab8f5' }} />OT→OT</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px" style={{ background: '#7dd4a0' }} />NT→NT</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px" style={{ background: '#d4a843' }} />OT→NT</span>

        {stats && (
          <div className="hidden md:flex items-center gap-4 text-[10px]" style={{ color: '#2a2a2a' }}>
            <span>{stats.books} books</span>
            <span>{stats.chapters.toLocaleString()} chapters</span>
            <span>{stats.verses.toLocaleString()} verses</span>
            <span>{stats.links.toLocaleString()} links</span>
          </div>
        )}
      </div>




      <div className="flex-1" />

      <button onClick={() => window.dispatchEvent(new CustomEvent('view:reset'))}
        className="transition-colors shrink-0" style={{ color: '#333' }}
        onMouseEnter={e => e.target.style.color = '#fff'}
        onMouseLeave={e => e.target.style.color = '#333'}
      >reset</button>

      <div className="relative shrink-0">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
          onKeyDown={e => e.key === 'Enter' && submitSearch(query)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="search verse..."
          className="font-mono text-xs px-3 py-1.5 rounded w-40 transition-colors focus:outline-none"
          style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#fff' }}
          onFocus={e => { e.target.style.borderColor = '#d4a843' }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute right-0 top-full mt-1 z-50 rounded overflow-hidden w-48"
            style={{ background: '#0f0f0f', border: '1px solid #1e1e1e' }}>
            {suggestions.map(s => (
              <div key={s} onMouseDown={() => submitSearch(s)}
                className="px-3 py-2 cursor-pointer transition-colors"
                style={{ color: '#555' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#161616' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' }}
              >{s}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}