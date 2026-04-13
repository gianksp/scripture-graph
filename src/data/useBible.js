import { useStore } from '../store/store'

export function useBible() {
  const bibleLookup = useStore(s => s.bibleLookup)
  const getVerse = key => bibleLookup[key] ?? null
  return { getVerse }
}