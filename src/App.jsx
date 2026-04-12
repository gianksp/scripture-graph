import { useEffect } from 'react'
import { useApp } from './store/AppContext'
import { useRefs } from './data/useRefs'
import { useBible } from './data/useBible'
import { verseIdToLabel, BOOK_MAP } from './data/bookMap'
import ArcControls from './views/ArcControls'
import ArcCanvas from './views/ArcCanvas'
import InfoPanel from './views/InfoPanel'

function Inner() {
  const { state, setVerse, clearVerse } = useApp()
  const { getConnectionsForVerse } = useRefs()
  const { getVerse } = useBible()

  function handleVerseSelect(id) {
    if (!id || id.startsWith('__')) return
    setVerse(id, getConnectionsForVerse(id), getVerse(verseIdToLabel(id)))
  }

  useEffect(() => {
    function handleId(id) {
      if (!id) return

      // Range: __range__Gen.1.1-Gen.1.5
      if (id.startsWith('__range__')) {
        const rangeStr = id.replace('__range__', '')
        const [fromId, toId] = rangeStr.split('-')
        const fromBook = fromId.split('.')[0]
        const ch = parseInt(fromId.split('.')[1])
        const v1 = parseInt(fromId.split('.')[2])
        const v2 = parseInt(toId.split('.')[2])
        const conns = state.allRefs
          .filter(r => {
            function inRange(vid) {
              const parts = vid.split('.')
              return parts[0] === fromBook
                && parseInt(parts[1]) === ch
                && parseInt(parts[2]) >= v1
                && parseInt(parts[2]) <= v2
            }
            return inRange(r.from) || inRange(r.to)
          })
          .map(r => {
            const fromIn = r.from.split('.')[0] === fromBook
              && parseInt(r.from.split('.')[1]) === ch
            return { from: fromIn ? r.from : r.to, to: fromIn ? r.to : r.from, votes: r.votes }
          })
          .sort((a, b) => b.votes - a.votes).slice(0, 200)
        setVerse(`__book__${fromBook}__ch__${ch}`, conns, null)
        return
      }

      // Chapter mode: __book__Gen__ch__1
      if (id.startsWith('__book__') && id.includes('__ch__')) {
        const book = id.replace('__book__', '').split('__ch__')[0]
        const chapter = parseInt(id.split('__ch__')[1])
        const prefix = `${book}.${chapter}.`
        const conns = state.allRefs
          .filter(r => r.from.startsWith(prefix) || r.to.startsWith(prefix))
          .map(r => ({
            from: r.from.startsWith(prefix) ? r.from : r.to,
            to: r.from.startsWith(prefix) ? r.to : r.from,
            votes: r.votes,
          }))
          .sort((a, b) => b.votes - a.votes).slice(0, 200)
        setVerse(id, conns, null)
        return
      }

      // Book mode: __book__Gen
      if (id.startsWith('__book__') && !id.includes('__ch__')) {
        const book = id.replace('__book__', '')
        const conns = state.allRefs
          .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
          .map(r => {
            const fb = r.from.split('.')[0]
            return { from: fb === book ? r.from : r.to, to: fb === book ? r.to : r.from, votes: r.votes }
          })
          .sort((a, b) => b.votes - a.votes).slice(0, 200)
        setVerse(id, conns, null)
        return
      }

      // Regular verse
      handleVerseSelect(id)
    }

    function onSearch(e) {
      window.dispatchEvent(new CustomEvent('book:deselect'))
      handleId(e.detail)
    }

    function onBookSel(e) {
      const book = e.detail
      const conns = state.allRefs
        .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
        .map(r => {
          const fb = r.from.split('.')[0]
          return { from: fb === book ? r.from : r.to, to: fb === book ? r.to : r.from, votes: r.votes }
        })
        .sort((a, b) => b.votes - a.votes).slice(0, 200)
      setVerse(`__book__${book}`, conns, null)
    }

    function onChSel(e) {
      const { book, chapter } = e.detail
      handleId(`__book__${book}__ch__${chapter}`)
    }

    function onDesel() { clearVerse() }

    window.addEventListener('verse:search', onSearch)
    window.addEventListener('book:select', onBookSel)
    window.addEventListener('book:deselect', onDesel)
    window.addEventListener('chapter:select', onChSel)
    return () => {
      window.removeEventListener('verse:search', onSearch)
      window.removeEventListener('book:select', onBookSel)
      window.removeEventListener('book:deselect', onDesel)
      window.removeEventListener('chapter:select', onChSel)
    }
  }, [state.allRefs])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-mono" style={{ background: '#080808' }}>
      <ArcControls />
      {state.activeVerse && (
        <InfoPanel onClose={() => { clearVerse(); window.dispatchEvent(new CustomEvent('book:deselect')) }} />
      )}
      <div className="flex-1 min-h-0">
        <ArcCanvas onVerseSelect={handleVerseSelect} />
      </div>
    </div>
  )
}

export default function App() {
  const { state, loadData } = useApp()
  useEffect(() => { loadData() }, [loadData])
  if (!state.loaded) return (
    <div className="fixed inset-0 flex items-center justify-center font-mono" style={{ background: '#080808' }}>
      <div className="text-center">
        <div className="text-xs tracking-widest mb-2" style={{ color: '#d4a843' }}>BIBLE EXPLORER</div>
        <div className="text-xs" style={{ color: '#333' }}>loading...</div>
      </div>
    </div>
  )
  return <Inner />
}