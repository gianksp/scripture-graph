import { createContext, useContext, useReducer, useCallback } from 'react'
import { BOOK_MAP } from '../data/bookMap'

const AppContext = createContext(null)

const initialState = {
  allRefs:     [],
  bibleLookup: {},
  loaded:      false,
  threshold:   20,
  activeVerse: null,
  connections: [],
  centerText:  null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'DATA_LOADED':
      return { ...state, allRefs: action.allRefs, bibleLookup: action.bibleLookup, loaded: true }
    case 'SET_THRESHOLD':
      return { ...state, threshold: action.value }
    case 'SET_VERSE':
      return { ...state, activeVerse: action.verseId, connections: action.connections, centerText: action.centerText }
    case 'CLEAR_VERSE':
      return { ...state, activeVerse: null, connections: [], centerText: null }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadData = useCallback(async () => {
    try {
      const [refsRes, bibleRes] = await Promise.all([
        fetch('/data/cross-references.json'),
        fetch('/data/bible-lookup.json'),
      ])
      const allRefsRaw = await refsRes.json()
      const allRefs = allRefsRaw.filter(item => item.votes > 1);
      const bibleLookup = await bibleRes.json()
      dispatch({ type: 'DATA_LOADED', allRefs, bibleLookup })
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }, [])

  const setThreshold = useCallback(value => {
    dispatch({ type: 'SET_THRESHOLD', value })
  }, [])

  const setVerse = useCallback((verseId, connections, centerText) => {
    dispatch({ type: 'SET_VERSE', verseId, connections, centerText })
  }, [])

  const clearVerse = useCallback(() => {
    dispatch({ type: 'CLEAR_VERSE' })
  }, [])

  return (
    <AppContext.Provider value={{
      state,
      loadData,
      setThreshold,
      setVerse,
      clearVerse,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)