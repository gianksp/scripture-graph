import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import { useBible } from '../../data/useBible'
import { parseUserInput, verseIdToLabel } from '../../data/bookMap'
import SearchInput from '../../components/SearchInput'
import VerseCard from '../../components/VerseCard'

export default function Sidebar({ onVerseSelect }) {
  const { state, goBack } = useApp()
  const { getConnectionsForVerse } = useRefs()
  const { getVerseByLabel } = useBible()
  const [query, setQuery] = useState(
    state.activeVerse ? verseIdToLabel(state.activeVerse) : ''
  )
  const [active, setActive] = useState(null)

  function handleSubmit(raw) {
    const verseId = parseUserInput(raw)
    if (!verseId) return
    onVerseSelect(verseId)
  }

  const { activeVerse, connections, centerText } = state
  const uniqueBooks = new Set(connections.map(c => c.to.split('.')[0])).size

  return (
    <aside className="w-80 flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-shrink-0">
        <button
          onClick={goBack}
          className="font-mono text-xs text-dim hover:text-gold transition-colors"
        >← Back</button>
        <div className="w-px h-4 bg-border" />
        <div className="font-mono text-xs text-gold tracking-widest">VERSE EXPLORER</div>
      </div>

      {/* Search */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <label className="font-mono text-xs text-dim tracking-widest uppercase block mb-2">
          Verse
        </label>
        <SearchInput value={query} onChange={setQuery} onSubmit={handleSubmit} />
        <button
          onClick={() => handleSubmit(query)}
          className="w-full mt-3 py-2.5 bg-gold text-black rounded-lg font-mono
            text-xs font-medium tracking-wide hover:bg-yellow-400 transition-colors"
        >
          Explore →
        </button>
      </div>

      {/* Verse text */}
      {activeVerse && (
        <div className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="font-mono text-xs text-gold tracking-widest uppercase mb-2">
            {verseIdToLabel(activeVerse)}
          </div>
          <div className="text-xs text-dim leading-relaxed">
            {centerText || 'Text unavailable'}
          </div>
        </div>
      )}

      {/* Stats */}
      {connections.length > 0 && (
        <div className="flex border-b border-border flex-shrink-0">
          <div className="flex-1 px-5 py-3 border-r border-border text-center">
            <div className="font-mono text-xl font-medium text-gold">{connections.length}</div>
            <div className="font-mono text-xs text-dim mt-0.5 uppercase tracking-wide">connections</div>
          </div>
          <div className="flex-1 px-5 py-3 text-center">
            <div className="font-mono text-xl font-medium text-gold">{uniqueBooks}</div>
            <div className="font-mono text-xs text-dim mt-0.5 uppercase tracking-wide">books</div>
          </div>
        </div>
      )}

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto py-2">
        {connections.map(c => (
          <VerseCard
            key={c.to}
            verseId={c.to}
            label={verseIdToLabel(c.to)}
            text={getVerseByLabel(verseIdToLabel(c.to))}
            votes={c.votes}
            active={active === c.to}
            onClick={() => setActive(c.to)}
          />
        ))}
      </div>

    </aside>
  )
}