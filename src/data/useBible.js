import { useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { BOOK_MAP } from './bookMap'

export function useBible() {
  const { state } = useApp()
  const { bibleLookup } = state

  const getVerse = useCallback(label => {
    if (!label) return ''
    const m = label.split('-')[0].trim().match(/^(.+?)\s+(\d+):(\d+)$/)
    if (!m) return ''
    const code = Object.entries(BOOK_MAP).find(([,v])=>v===m[1])?.[0]
    if (!code) return ''
    return bibleLookup[`${code}.${m[2]}.${m[3]}`]||''
  }, [bibleLookup])

  return { getVerse }
}