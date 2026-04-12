import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { isOT } from './bookMap'
import { deduplicateConnections } from '../utils/arcGeometry'

export function useRefs() {
  const { state } = useApp()
  const { allRefs, threshold } = state

  /** Filtered + deduplicated refs above vote threshold */
  const filteredRefs = useMemo(() => {
    const aboveThreshold = allRefs.filter(r => r.votes >= threshold)
    return deduplicateConnections(aboveThreshold)
  }, [allRefs, threshold])

  /** Returns all connections for a single verse, deduplicated */
  const getConnectionsForVerse = useMemo(() => verseId =>
    deduplicateConnections(
      allRefs
        .filter(r => r.from === verseId || r.to === verseId)
        .map(r => ({ from: verseId, to: r.from === verseId ? r.to : r.from, votes: r.votes }))
    ).sort((a, b) => b.votes - a.votes),
    [allRefs]
  )

  /** OT/NT breakdown stats for filtered refs */
  const stats = useMemo(() => {
    let OT_OT = 0, NT_NT = 0, OT_NT = 0
    filteredRefs.forEach(r => {
      const fromOT = isOT(r.from.split('.')[0])
      const toOT = isOT(r.to.split('.')[0])
      if (fromOT && toOT) OT_OT++
      else if (!fromOT && !toOT) NT_NT++
      else OT_NT++
    })
    return { OT_OT, NT_NT, OT_NT, total: filteredRefs.length }
  }, [filteredRefs])

  return { filteredRefs, getConnectionsForVerse, stats }
}