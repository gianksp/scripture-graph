import { useRef, useCallback } from 'react'
import { BOOK_ORDER } from '../../data/bookMap'

export function useCanvasSetup(state, scheduleDraw) {
  const posRef = useRef({})
  const rangesRef = useRef({})
  const chDataRef = useRef({})
  const bookStats = useRef({})

  const buildPos = useCallback((W) => {
    const lk = state.bibleLookup
    if (!Object.keys(lk).length) return

    const bookCounts = {}, chCounts = {}
    BOOK_ORDER.forEach(b => { bookCounts[b] = 0; chCounts[b] = {} })
    Object.keys(lk).forEach(k => {
      const [book, ch] = k.split('.')
      if (bookCounts[book] === undefined) return
      bookCounts[book]++
      chCounts[book][ch] = (chCounts[book][ch] || 0) + 1
    })

    const maxCh = Math.max(...BOOK_ORDER.map(b => Object.keys(chCounts[b]).length))
    const totalBooks = BOOK_ORDER.length
    const PAD = 40
    const scale0 = W * 0.38
    const xnTotal = (W - PAD * 2) / scale0
    const xnStart = -xnTotal / 2

    const positions = {}, ranges = {}, chData = {}, stats = {}

    BOOK_ORDER.forEach((book, bi) => {
      const count = bookCounts[book] || 1
      const sxn = xnStart + (bi / totalBooks) * xnTotal
      const exn = xnStart + ((bi + 1) / totalBooks) * xnTotal
      const midXn = (sxn + exn) / 2

      ranges[book] = {
        startXn: sxn, endXn: exn, midXn,
        startX: W / 2 + sxn * scale0, endX: W / 2 + exn * scale0, midX: W / 2 + midXn * scale0,
      }

      const chs = Object.keys(chCounts[book]).map(Number).sort((a, b) => a - b)
      const chSpacing = Math.max(1.4 / maxCh, 0.035)
      chData[book] = chs.map((ch, ci) => ({ ch, xn: midXn, z: -0.08 - ci * chSpacing, size: 0.022 }))
      stats[book] = { chapters: chs.length, verses: count }

      Object.keys(lk).filter(k => k.startsWith(book + '.')).sort((a, b) => {
        const [, ac, av] = a.split('.'), [, bc, bv] = b.split('.')
        return (parseInt(ac) * 1000 + parseInt(av)) - (parseInt(bc) * 1000 + parseInt(bv))
      }).forEach((k, i) => {
        const ch = parseInt(k.split('.')[1]) || 1
        const xn = sxn + (i / count) * (exn - sxn)
        const chIdx = chs.indexOf(ch)
        positions[k] = { xn, z: chIdx >= 0 ? -0.08 - chIdx * chSpacing : -0.08 }
      })
    })

    posRef.current = positions
    rangesRef.current = ranges
    chDataRef.current = chData
    bookStats.current = stats
  }, [state.bibleLookup])

  const attach = useCallback((canvas, container) => {
    if (!canvas || !container) return () => { }
    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect()
      canvas.width = Math.floor(r.width)
      canvas.height = Math.floor(r.height)
      buildPos(Math.floor(r.width))
      scheduleDraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [buildPos, scheduleDraw])

  return { posRef, rangesRef, chDataRef, bookStats, buildPos, attach }
}