import { createContext, useContext, useReducer, useCallback } from 'react'

const Ctx  = createContext(null)
const init = {
  allRefs: [], bibleLookup: {}, loaded: false,
  threshold: 20, activeVerse: null, connections: [], centerText: null,
}

function reducer(s, a) {
  switch (a.type) {
    case 'LOADED':    return { ...s, allRefs: a.allRefs, bibleLookup: a.bibleLookup, loaded: true }
    case 'THRESHOLD': return { ...s, threshold: a.value }
    case 'SET_VERSE': return { ...s, activeVerse: a.verseId, connections: a.connections, centerText: a.centerText }
    case 'CLEAR':     return { ...s, activeVerse: null, connections: [], centerText: null }
    default:          return s
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  const loadData = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch('/data/cross-references.json'),
      fetch('/data/bible-lookup.json'),
    ])
    dispatch({ type:'LOADED', allRefs: await r1.json(), bibleLookup: await r2.json() })
  }, [])

  const setThreshold = useCallback(v => dispatch({ type:'THRESHOLD', value:v }), [])
  const setVerse     = useCallback((verseId, connections, centerText) =>
    dispatch({ type:'SET_VERSE', verseId, connections, centerText }), [])
  const clearVerse   = useCallback(() => dispatch({ type:'CLEAR' }), [])

  return (
    <Ctx.Provider value={{ state, loadData, setThreshold, setVerse, clearVerse }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)