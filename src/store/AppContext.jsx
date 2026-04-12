import { createContext, useContext, useReducer, useCallback } from 'react'

const AppContext = createContext(null)

const initialState = {
  allRefs: [],
  bibleLookup: {},
  loaded: false,
  threshold: 44,
  activeVerse: null,
  connections: [],
  centerText: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED': return { ...state, allRefs: action.allRefs, bibleLookup: action.bibleLookup, loaded: true }
    case 'THRESHOLD': return { ...state, threshold: action.value }
    case 'SET_VERSE': return { ...state, activeVerse: action.verseId, connections: action.connections, centerText: action.centerText }
    case 'CLEAR': return { ...state, activeVerse: null, connections: [], centerText: null }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadData = useCallback(async () => {
    const [refsRes, bibleRes] = await Promise.all([
      fetch('/data/cross-references.json'),
      fetch('/data/bible-lookup.json'),
    ])
    dispatch({ type: 'LOADED', allRefs: await refsRes.json(), bibleLookup: await bibleRes.json() })
  }, [])

  const setThreshold = useCallback(value => dispatch({ type: 'THRESHOLD', value }), [])
  const setVerse = useCallback((verseId, connections, centerText) =>
    dispatch({ type: 'SET_VERSE', verseId, connections, centerText }), [])
  const clearVerse = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  return (
    <AppContext.Provider value={{ state, loadData, setThreshold, setVerse, clearVerse }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)