import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { isOT } from './bookMap'

export function useRefs() {
  const { state } = useApp()
  const { allRefs, threshold } = state

  const filteredRefs = useMemo(() =>
    allRefs.filter(r => r.votes >= threshold),
    [allRefs, threshold]
  )

  const getConnectionsForVerse = useMemo(() => verseId =>
    allRefs
      .filter(r => r.from===verseId||r.to===verseId)
      .map(r => ({ from:verseId, to:r.from===verseId?r.to:r.from, votes:r.votes }))
      .sort((a,b) => b.votes-a.votes)
      .slice(0,120),
    [allRefs]
  )

  const stats = useMemo(() => {
    let OT_OT=0,NT_NT=0,OT_NT=0
    filteredRefs.forEach(r => {
      const fo=isOT(r.from.split('.')[0]), to=isOT(r.to.split('.')[0])
      if(fo&&to) OT_OT++; else if(!fo&&!to) NT_NT++; else OT_NT++
    })
    return { OT_OT, NT_NT, OT_NT, total:filteredRefs.length }
  }, [filteredRefs])

  return { filteredRefs, getConnectionsForVerse, stats }
}