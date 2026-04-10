import { useEffect } from 'react'
import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import { useBible } from '../../data/useBible'
import { verseIdToLabel, BOOK_MAP } from '../../data/bookMap'
import ArcControls from './ArcControls'
import ArcCanvas from './ArcCanvas'
import InfoPanel from './InfoPanel'

export default function ArcView() {
  const { state, setVerse, clearVerse } = useApp()
  const { getConnectionsForVerse }      = useRefs()
  const { getVerseByLabel }             = useBible()

  function handleVerseSelect(verseId) {
    if (!verseId || verseId.startsWith('__')) return
    const connections = getConnectionsForVerse(verseId)
    const centerText  = getVerseByLabel(verseIdToLabel(verseId))
    setVerse(verseId, connections, centerText)
  }

  useEffect(() => {
    function onSearch(e) {
      handleVerseSelect(e.detail)
    }

    function onBookSelect(e) {
      const book    = e.detail
      const allRefs = state.allRefs
      const conns   = allRefs
        .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
        .map(r => {
          const fromBook = r.from.split('.')[0]
          const from     = fromBook === book ? r.from : r.to
          const to       = fromBook === book ? r.to   : r.from
          return { from, to, votes: r.votes }
        })
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 200)
      setVerse(`__book__${book}`, conns, null)
    }

    function onBookDeselect() {
      clearVerse()
    }

    window.addEventListener('verse:search',  onSearch)
    window.addEventListener('book:select',   onBookSelect)
    window.addEventListener('book:deselect', onBookDeselect)
    return () => {
      window.removeEventListener('verse:search',  onSearch)
      window.removeEventListener('book:select',   onBookSelect)
      window.removeEventListener('book:deselect', onBookDeselect)
    }
  }, [state.allRefs])

  return (
    <div style={{ position:'fixed', inset:0, background:'#0a0a0a' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:30 }}>
        <ArcControls />
      </div>
      <div style={{ position:'absolute', top:48, left:0, right:0, bottom:0 }}>
        <ArcCanvas onVerseSelect={handleVerseSelect} />
      </div>
      {state.activeVerse && (
        <div style={{ position:'absolute', top:48, left:0, right:0, zIndex:20 }}>
          <InfoPanel
            onVerseSelect={handleVerseSelect}
            onClose={() => {
              clearVerse()
              window.dispatchEvent(new CustomEvent('book:deselect'))
            }}
          />
        </div>
      )}
    </div>
  )
}