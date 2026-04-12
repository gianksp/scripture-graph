import { useEffect } from 'react'
import { useApp } from './store/AppContext'
import { useRefs } from './data/useRefs'
import { useBible } from './data/useBible'
import { verseIdToLabel } from './data/bookMap'
import ArcControls from './components/ArcControls'
import ArcCanvas from './components/canvas/ArcCanvas'
import InfoPanel from './components/InfoPanel'

function dedupConns(conns) {
  const map = new Map()
  conns.forEach(c => {
    // Normalize ranges — John.1.1-John.1.3 → John.1.1
    const normFrom = c.from.split('-')[0]
    const normTo = c.to.split('-')[0]
    const key = [normFrom, normTo].sort().join('|')
    const existing = map.get(key)
    if (!existing || c.votes > existing.votes) map.set(key, c)
  })
  return [...map.values()]
}
function buildBookConns(book, allRefs) {
  const raw = allRefs
    .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
    .map(r => {
      const fb = r.from.split('.')[0]
      return { from: fb === book ? r.from : r.to, to: fb === book ? r.to : r.from, votes: r.votes }
    })
  return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildChapterConns(book, chapter, allRefs) {
  const prefix = `${book}.${chapter}.`
  const raw = allRefs
    .filter(r => r.from.startsWith(prefix) || r.to.startsWith(prefix))
    .map(r => ({
      from: r.from.startsWith(prefix) ? r.from : r.to,
      to: r.from.startsWith(prefix) ? r.to : r.from,
      votes: r.votes,
    }))

  // Debug
  const pairs = raw.filter(c =>
    (c.from === 'John.1.1' && c.to === 'Gen.1.1') ||
    (c.from === 'Gen.1.1' && c.to === 'John.1.1')
  )
  console.log('RAW pairs before dedup:', pairs)

  return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildVerseConns(verseId, allRefs) {
  const raw = allRefs
    .filter(r => r.from === verseId || r.to === verseId)
    .map(r => ({
      from: verseId,
      to: r.from === verseId ? r.to : r.from,
      votes: r.votes,
    }))
  return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildRangeConns(fromBook, ch, v1, v2, allRefs) {
  const raw = allRefs
    .filter(r => {
      const inRange = vid => {
        const p = vid.split('.')
        return p[0] === fromBook && parseInt(p[1]) === ch && parseInt(p[2]) >= v1 && parseInt(p[2]) <= v2
      }
      return inRange(r.from) || inRange(r.to)
    })
    .map(r => {
      const p = r.from.split('.')
      const fromIn = p[0] === fromBook && parseInt(p[1]) === ch
      return { from: fromIn ? r.from : r.to, to: fromIn ? r.to : r.from, votes: r.votes }
    })
  return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

// ─────────────────────────────────────────────────────────────
function Inner() {
  const { state, setVerse, clearVerse } = useApp()
  const { getConnectionsForVerse } = useRefs()
  const { getVerse } = useBible()

  function handleVerseSelect(id) {
    if (!id || id.startsWith('__')) return
    const conns = buildVerseConns(id, state.allRefs)
    const text = getVerse(verseIdToLabel(id))
    setVerse(id, conns, text)
  }

  useEffect(() => {
    function handleId(id) {
      if (!id) return

      if (id.startsWith('__range__')) {
        const rangeStr = id.replace('__range__', '')
        const [fromId, toId] = rangeStr.split('-')
        const fromBook = fromId.split('.')[0]
        const ch = parseInt(fromId.split('.')[1])
        const v1 = parseInt(fromId.split('.')[2])
        const v2 = parseInt(toId.split('.')[2])
        const conns = buildRangeConns(fromBook, ch, v1, v2, state.allRefs)
        setVerse(`__book__${fromBook}__ch__${ch}`, conns, null)
        return
      }

      if (id.startsWith('__book__') && id.includes('__ch__')) {
        const bookPart = id.replace('__book__', '')
        const [book, chStr] = bookPart.split('__ch__')
        const conns = buildChapterConns(book, parseInt(chStr), state.allRefs)
        setVerse(id, conns, null)
        return
      }

      if (id.startsWith('__book__')) {
        const book = id.replace('__book__', '')
        const conns = buildBookConns(book, state.allRefs)
        setVerse(id, conns, null)
        return
      }

      handleVerseSelect(id)
    }

    function onSearch(e) {
      window.dispatchEvent(new CustomEvent('book:deselect'))
      handleId(e.detail)
    }

    function onBookSel(e) {
      const conns = buildBookConns(e.detail, state.allRefs)
      setVerse(`__book__${e.detail}`, conns, null)
    }

    function onChSel(e) {
      handleId(`__book__${e.detail.book}__ch__${e.detail.chapter}`)
    }

    // Moved inside — now has access to setVerse
    function onChArcSel(e) {
      const { chArc } = e.detail
      const conns = chArc.versePairs
        .map(v => ({ from: v.from, to: v.to, votes: v.votes }))
        .sort((a, b) => b.votes - a.votes)
      const id = `__book__${chArc.fromChapter.split('.')[0]}__ch__${chArc.fromChapter.split('.')[1]}`
      setVerse(id, conns, null)
    }

    function onDesel() { clearVerse() }

    window.addEventListener('verse:search', onSearch)
    window.addEventListener('book:select', onBookSel)
    window.addEventListener('book:deselect', onDesel)
    window.addEventListener('chapter:select', onChSel)
    window.addEventListener('chaparc:select', onChArcSel)
    return () => {
      window.removeEventListener('verse:search', onSearch)
      window.removeEventListener('book:select', onBookSel)
      window.removeEventListener('book:deselect', onDesel)
      window.removeEventListener('chapter:select', onChSel)
      window.removeEventListener('chaparc:select', onChArcSel)
    }
  }, [state.allRefs])


  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-mono" style={{ background: '#080808' }}>
      <ArcControls />
      <div style={{ flex: '0 0 60%', minHeight: 0, position: 'relative' }}>
        <ArcCanvas onVerseSelect={handleVerseSelect} />
      </div>
      <div
        style={{ flex: '0 0 40%', minHeight: 0, borderTop: '1px solid #1a1a1a', overflow: 'hidden' }}
        onContextMenu={e => e.preventDefault()}
      >
        <InfoPanel
          onVerseSelect={handleVerseSelect}
          onClose={() => { clearVerse(); window.dispatchEvent(new CustomEvent('book:deselect')) }}
        />
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