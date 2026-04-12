import { useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { BOOK_MAP } from './bookMap'

export function useBible() {
  const { state } = useApp()
  const { bibleLookup } = state

  /** Returns verse text for a human label like "John 3:16" */
  const getVerse = useCallback(label => {
    if (!label) return ''
    const match = label.split('-')[0].trim().match(/^(.+?)\s+(\d+):(\d+)$/)
    if (!match) return ''
    const code = Object.entries(BOOK_MAP).find(([, name]) => name === match[1])?.[0]
    if (!code) return ''
    return bibleLookup[`${code}.${match[2]}.${match[3]}`] || ''
  }, [bibleLookup])

  return { getVerse }
}