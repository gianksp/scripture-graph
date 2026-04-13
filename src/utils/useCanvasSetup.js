import { useRef, useCallback } from 'react'
import { useStore } from '../store/store'
import { BOOK_ORDER } from '../data/bookMap'

export function useCanvasSetup(scheduleDraw) {
  const versePositions = useRef({})
  const bookRanges = useRef({})
  const chapterData = useRef({})
  const bookStats = useRef({})

  const buildPositions = useCallback((W) => {
    const lookup = useStore.getState().bibleLookup
    if (!Object.keys(lookup).length) return

    const versesPerBook = {}, versesPerChapter = {}
    BOOK_ORDER.forEach(b => { versesPerBook[b] = 0; versesPerChapter[b] = {} })
    Object.keys(lookup).forEach(key => {
      const [book, ch] = key.split('.')
      if (versesPerBook[book] === undefined) return
      versesPerBook[book]++
      versesPerChapter[book][ch] = (versesPerChapter[book][ch] || 0) + 1
    })

    const maxChapters = Math.max(...BOOK_ORDER.map(b => Object.keys(versesPerChapter[b]).length))
    const totalBooks = BOOK_ORDER.length
    const PAD = 40
    const worldScale = W * 0.38
    const totalWorldW = (W - PAD * 2) / worldScale
    const worldStartX = -totalWorldW / 2

    const newVersePos = {}, newRanges = {}, newChData = {}, newStats = {}

    BOOK_ORDER.forEach((book, bi) => {
      const verseCount = versesPerBook[book] || 1
      const startXn = worldStartX + (bi / totalBooks) * totalWorldW
      const endXn = worldStartX + ((bi + 1) / totalBooks) * totalWorldW
      const midXn = (startXn + endXn) / 2

      newRanges[book] = { startXn, endXn, midXn }

      const chapters = Object.keys(versesPerChapter[book]).map(Number).sort((a, b) => a - b)
      const chSpacing = Math.max(1.4 / maxChapters, 0.035)
      newChData[book] = chapters.map((ch, ci) => ({ ch, xn: midXn, z: -0.08 - ci * chSpacing, size: 0.022 }))
      newStats[book] = { chapters: chapters.length, verses: verseCount }

      Object.keys(lookup)
        .filter(k => k.startsWith(book + '.'))
        .sort((a, b) => {
          const [, ac, av] = a.split('.')
          const [, bc, bv] = b.split('.')
          return (parseInt(ac) * 1000 + parseInt(av)) - (parseInt(bc) * 1000 + parseInt(bv))
        })
        .forEach((k, i) => {
          const ch = parseInt(k.split('.')[1]) || 1
          const chIdx = chapters.indexOf(ch)
          newVersePos[k] = {
            xn: startXn + (i / verseCount) * (endXn - startXn),
            z: chIdx >= 0 ? -0.08 - chIdx * chSpacing : -0.08,
          }
        })
    })

    versePositions.current = newVersePos
    bookRanges.current = newRanges
    chapterData.current = newChData
    bookStats.current = newStats
  }, [])

  // onResize(W, H) lets ArcCanvas track canvas size for cache invalidation
  const attachResizeObserver = useCallback((canvas, container, onResize) => {
    if (!canvas || !container) return () => { }
    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect()
      const W = Math.floor(r.width), H = Math.floor(r.height)
      canvas.width = W; canvas.height = H
      buildPositions(W)
      onResize?.(W, H)
      scheduleDraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [buildPositions, scheduleDraw])

  return { versePositions, bookRanges, chapterData, bookStats, attachResizeObserver }
}