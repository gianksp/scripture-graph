import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import { useBible } from '../../data/useBible'
import { parseUserInput, verseIdToLabel } from '../../data/bookMap'
import Sidebar from './Sidebar'
import ForceGraph from './ForceGraph'

export default function GraphView() {
  const { state, exploreVerse } = useApp()
  const { getConnectionsForVerse } = useRefs()
  const { getVerseByLabel } = useBible()

  function handleVerseSelect(verseId) {
    const connections = getConnectionsForVerse(verseId)
    connections.forEach(c => {
      c.text = getVerseByLabel(verseIdToLabel(c.to))
    })
    const centerText = getVerseByLabel(verseIdToLabel(verseId))
    exploreVerse(verseId, connections, centerText)
  }

  function handleNodeClick(verseId) {
    handleVerseSelect(verseId)
  }

  return (
    <div className="flex h-screen">
      <Sidebar onVerseSelect={handleVerseSelect} />
      <ForceGraph onNodeClick={handleNodeClick} />
      {/* Global tooltip for D3 */}
      <div
        id="graph-tooltip"
        className="fixed z-50 bg-surface border border-border2 rounded-lg px-4 py-3
          text-xs text-[#e8e4dc] pointer-events-none max-w-xs leading-relaxed"
        style={{ opacity: 0, transition: 'opacity 0.15s' }}
      />
    </div>
  )
}