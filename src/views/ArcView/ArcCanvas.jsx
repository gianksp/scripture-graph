import { useEffect, useRef, useCallback, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import { useBible } from '../../data/useBible'
import {
  BOOK_ORDER, BOOK_MAP, isOT,
  getArcColor, verseIdToLabel, chronoSort
} from '../../data/bookMap'

const PADDING = 40
const STRIP_H = 36

const ABBREV = {
  'Gen': 'GEN', 'Exod': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deut': 'DEU',
  'Josh': 'JOS', 'Judg': 'JDG', 'Ruth': 'RUT', '1Sam': '1SA', '2Sam': '2SA',
  '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', 'Ezra': 'EZR',
  'Neh': 'NEH', 'Esth': 'EST', 'Job': 'JOB', 'Ps': 'PSA', 'Prov': 'PRO',
  'Eccl': 'ECC', 'Song': 'SNG', 'Isa': 'ISA', 'Jer': 'JER', 'Lam': 'LAM',
  'Ezek': 'EZK', 'Dan': 'DAN', 'Hos': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO',
  'Obad': 'OBA', 'Jonah': 'JON', 'Mic': 'MIC', 'Nah': 'NAH', 'Hab': 'HAB',
  'Zeph': 'ZEP', 'Hag': 'HAG', 'Zech': 'ZEC', 'Mal': 'MAL',
  'Matt': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Rom': 'ROM', '1Cor': '1CO', '2Cor': '2CO', 'Gal': 'GAL', 'Eph': 'EPH',
  'Phil': 'PHP', 'Col': 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI',
  '2Tim': '2TI', 'Titus': 'TIT', 'Phlm': 'PHM', 'Heb': 'HEB', 'Jas': 'JAS',
  '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN',
  'Jude': 'JUD', 'Rev': 'REV'
}

export default function ArcCanvas({ onVerseSelect }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const posRef = useRef({})
  const rangesRef = useRef({})
  const filteredRef = useRef([])
  const hoveredArcRef = useRef(null)
  const bookSelRef = useRef(null)
  const activeVerseRef = useRef(null)   // ← always current, no stale closure
  const connectionsRef = useRef([])     // ← always current
  const animRef = useRef(null)
  const tooltipRef = useRef(null)

  const { state } = useApp()
  const { filteredRefs } = useRefs()
  const { getVerseByLabel } = useBible()

  const [hoveredBook, setHoveredBook] = useState(null)
  const hoveredBookRef = useRef(null)

  // ── Keep refs in sync with state ─────────────────────────────
  useEffect(() => {
    activeVerseRef.current = state.activeVerse
    connectionsRef.current = state.connections || []
    scheduleDraw()
  }, [state.activeVerse, state.connections])

  // ── Build positions ──────────────────────────────────────────
  const buildPositions = useCallback((w) => {
    const lookup = state.bibleLookup
    if (!lookup || !Object.keys(lookup).length) return
    const usableW = w - PADDING * 2
    const counts = {}
    BOOK_ORDER.forEach(b => { counts[b] = 0 })
    Object.keys(lookup).forEach(key => {
      const b = key.split('.')[0]
      if (counts[b] !== undefined) counts[b]++
    })
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    let pos = 0
    const positions = {}
    const ranges = {}
    BOOK_ORDER.forEach(book => {
      const count = counts[book] || 1
      const startX = PADDING + (pos / total) * usableW
      const endX = PADDING + ((pos + count) / total) * usableW
      ranges[book] = { startX, endX, midX: (startX + endX) / 2 }
      Object.keys(lookup)
        .filter(k => k.startsWith(book + '.'))
        .sort((a, b) => {
          const [, ac, av] = a.split('.')
          const [, bc, bv] = b.split('.')
          return (parseInt(ac) * 1000 + parseInt(av)) - (parseInt(bc) * 1000 + parseInt(bv))
        })
        .forEach((key, i) => {
          positions[key] = PADDING + ((pos + i) / total) * usableW
        })
      pos += count
    })
    posRef.current = positions
    rangesRef.current = ranges
  }, [state.bibleLookup])

  const getX = useCallback((id) => {
    if (!id) return 0
    const base = id.split('-')[0]
    if (posRef.current[base] !== undefined) return posRef.current[base]
    const book = base.split('.')[0]
    return rangesRef.current[book]?.midX || 0
  }, [])

  // ── Draw — reads from refs, never stale ──────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.width || !canvas.height) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const baseY = H - STRIP_H
    const arcArea = baseY - 8
    const refs = filteredRef.current
    const maxV = Math.max(...refs.map(r => r.votes), 1)

    // Read from refs — never stale
    const activeVerse = activeVerseRef.current
    const connections = connectionsRef.current
    const bookSelected = bookSelRef.current
    const hovArc = hoveredArcRef.current
    const fConn = window.__focusedConn || null
    const hBook = hoveredBookRef.current

    const isBookMode = activeVerse?.startsWith('__book__')
    const bookCode = isBookMode ? activeVerse.replace('__book__', '') : null

    // Build a set of featured verse IDs for fast lookup
    const featuredFromSet = new Set()
    const featuredToSet = new Set()
    connections.forEach(conn => {
      if (conn.from) featuredFromSet.add(conn.from)
      if (conn.to) featuredToSet.add(conn.to)
    })

    // Is this ref featured?
    function isFeatured(ref) {
      if (activeVerse && !isBookMode) {
        return ref.from === activeVerse || ref.to === activeVerse
      }
      if (bookSelected) {
        return ref.from.split('.')[0] === bookSelected ||
          ref.to.split('.')[0] === bookSelected
      }
      if (isBookMode && bookCode) {
        return ref.from.split('.')[0] === bookCode ||
          ref.to.split('.')[0] === bookCode
      }
      return false
    }

    // Is this ref the focused one from panel?
    function isFocused(ref) {
      if (!fConn || typeof fConn !== 'object') return false
      return (ref.from === fConn.from && ref.to === fConn.to) ||
        (ref.from === fConn.to && ref.to === fConn.from)
    }

    const hasSel = !!(activeVerse || bookSelected)

    ctx.clearRect(0, 0, W, H)

    // ── Book bands ───────────────────────────────────────────
    BOOK_ORDER.forEach((book, idx) => {
      const r = rangesRef.current[book]
      if (!r) return
      const isSel = bookSelected === book || bookCode === book
      if (idx % 2 === 0 || isSel) {
        ctx.fillStyle = isSel
          ? (isOT(book) ? 'rgba(122,184,245,0.07)' : 'rgba(125,212,160,0.07)')
          : (isOT(book) ? 'rgba(122,184,245,0.02)' : 'rgba(125,212,160,0.02)')
        ctx.fillRect(r.startX, 0, r.endX - r.startX, baseY)
      }
      ctx.beginPath()
      ctx.strokeStyle = isSel
        ? (isOT(book) ? 'rgba(122,184,245,0.5)' : 'rgba(125,212,160,0.5)')
        : (isOT(book) ? 'rgba(122,184,245,0.15)' : 'rgba(125,212,160,0.15)')
      ctx.lineWidth = 1
      ctx.moveTo(r.startX, baseY - 4)
      ctx.lineTo(r.startX, baseY + 2)
      ctx.stroke()
    })

    // ── Baseline ─────────────────────────────────────────────
    ctx.beginPath()
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    ctx.moveTo(PADDING, baseY)
    ctx.lineTo(W - PADDING, baseY)
    ctx.stroke()

    // ── OT|NT divider ────────────────────────────────────────
    const mal = rangesRef.current['Mal']
    const matt = rangesRef.current['Matt']
    if (mal && matt) {
      const divX = (mal.endX + matt.startX) / 2
      ctx.save()
      ctx.strokeStyle = 'rgba(212,168,67,0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 6])
      ctx.beginPath()
      ctx.moveTo(divX, 0); ctx.lineTo(divX, baseY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(212,168,67,0.35)'
      ctx.font = '9px IBM Plex Mono'
      ctx.textAlign = 'center'
      ctx.fillText('OT | NT', divX, baseY + 26)
      ctx.restore()
    }

    // ── Book labels ──────────────────────────────────────────
    BOOK_ORDER.forEach(book => {
      const r = rangesRef.current[book]
      if (!r) return
      const bookW = r.endX - r.startX
      const abbrev = ABBREV[book] || book.slice(0, 3)
      const isHov = hBook === book
      const isSel = bookSelected === book || bookCode === book
      const color = (isHov || isSel)
        ? '#fff'
        : isOT(book) ? 'rgba(122,184,245,0.7)' : 'rgba(125,212,160,0.7)'

      ctx.save()
      ctx.textAlign = 'center'
      ctx.fillStyle = color

      if (bookW < 4) {
        ctx.beginPath()
        ctx.arc(r.midX, baseY + 14, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const label = bookW < 12 ? abbrev.slice(0, 1) : bookW < 20 ? abbrev.slice(0, 2) : abbrev
        const fitFont = Math.max(6, Math.min(10, bookW / label.length * 1.5))
        ctx.font = `${fitFont}px IBM Plex Mono`
        ctx.fillText(label, r.midX, baseY + 14)
      }

      if (isHov || isSel) {
        const fullName = BOOK_MAP[book]
        ctx.font = '11px IBM Plex Mono'
        const tw = ctx.measureText(fullName).width
        const tx = Math.min(Math.max(r.midX, 70), W - 70)
        ctx.fillStyle = 'rgba(8,8,8,0.95)'
        ctx.beginPath()
        ctx.roundRect(tx - tw / 2 - 8, baseY - 32, tw + 16, 22, 4)
        ctx.fill()
        ctx.strokeStyle = isOT(book) ? 'rgba(122,184,245,0.3)' : 'rgba(125,212,160,0.3)'
        ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.fillText(fullName, tx, baseY - 16)
      }
      ctx.restore()
    })

    // ── Pass 1: background arcs ──────────────────────────────
    const hovFrom = hovArc?.ref?.from
    const hovTo = hovArc?.ref?.to

    refs.forEach(ref => {
      const x1 = getX(ref.from)
      const x2 = getX(ref.to)
      if (!x1 || !x2) return

      const featured = isFeatured(ref)
      if (featured && hasSel) return  // drawn in pass 2

      const relatedToHover = hovArc
        ? (ref.from === hovFrom || ref.to === hovFrom ||
          ref.from === hovTo || ref.to === hovTo)
        : false

      const fromBook = ref.from.split('.')[0]
      const toBook = ref.to.split('.')[0]
      const color = getArcColor(fromBook, toBook)
      const span = Math.abs(x2 - x1)
      const aH = Math.min(span * 0.7, arcArea * 0.97)
      const midX = (x1 + x2) / 2

      let alpha, lw
      if (hovArc) {
        if (relatedToHover) {
          alpha = 0.35 + (ref.votes / maxV) * 0.5
          lw = 0.8 + (ref.votes / maxV) * 1.2
        } else {
          alpha = 0.012; lw = 0.3
        }
      } else if (hasSel) {
        alpha = 0.01; lw = 0.3
      } else {
        alpha = 0.08 + (ref.votes / maxV) * 0.55
        lw = 0.4 + (ref.votes / maxV) * 1.2
      }

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth = lw
      ctx.moveTo(x1, baseY)
      ctx.quadraticCurveTo(midX, baseY - aH, x2, baseY)
      ctx.stroke()
    })

    // ── Pass 2: featured arcs ────────────────────────────────
    if (hasSel) {
      connections.forEach(conn => {
        const fromId = conn.from || (activeVerse && !isBookMode ? activeVerse : null)
        const toId = conn.to
        if (!fromId || !toId) return

        const x1 = getX(fromId)
        const x2 = getX(toId)
        if (!x1 || !x2) return

        const focused = isFocused({ from: fromId, to: toId })
        const fromBook = fromId.split('.')[0]
        const toBook = toId.split('.')[0]
        const color = getArcColor(fromBook, toBook)
        const span = Math.abs(x2 - x1)
        const aH = Math.min(span * 0.7, arcArea * 0.97)
        const midX = (x1 + x2) / 2
        const alpha = focused ? 1 : 0.3 + (conn.votes / maxV) * 0.6
        const lw = focused ? 3 : 0.8 + (conn.votes / maxV) * 1.4

        ctx.beginPath()
        // Gold for focused, original color otherwise
        ctx.strokeStyle = focused ? '#d4a843' : color
        ctx.globalAlpha = alpha
        ctx.lineWidth = lw
        ctx.moveTo(x1, baseY)
        ctx.quadraticCurveTo(midX, baseY - aH, x2, baseY)
        ctx.stroke()
      })

      // Center dot for verse mode
      if (activeVerse && !isBookMode) {
        const cx = getX(activeVerse)
        const cOT = isOT(activeVerse.split('.')[0])
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(cx, baseY, 5, 0, Math.PI * 2)
        ctx.fillStyle = cOT ? '#7ab8f5' : '#7dd4a0'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx, baseY, 9, 0, Math.PI * 2)
        ctx.strokeStyle = cOT ? 'rgba(122,184,245,0.3)' : 'rgba(125,212,160,0.3)'
        ctx.lineWidth = 1.5; ctx.stroke()
      }
    }

    // ── Pass 3: hovered arc — gold ───────────────────────────
    if (hovArc) {
      const { ref } = hovArc
      const x1 = getX(ref.from)
      const x2 = getX(ref.to)
      if (x1 && x2) {
        const span = Math.abs(x2 - x1)
        const aH = Math.min(span * 0.7, arcArea * 0.97)
        const midX = (x1 + x2) / 2
        ctx.beginPath()
        ctx.strokeStyle = '#d4a843'   // gold
        ctx.globalAlpha = 0.95
        ctx.lineWidth = 2.5
        ctx.moveTo(x1, baseY)
        ctx.quadraticCurveTo(midX, baseY - aH, x2, baseY)
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
  }, [getX])   // ← minimal deps — reads everything from refs

  const scheduleDraw = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(() => {
      animRef.current = null
      draw()
    })
  }, [draw])

  // ── Resize ───────────────────────────────────────────────────
  useEffect(() => {
    if (!state.loaded) return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      canvas.width = Math.floor(rect.width)
      canvas.height = Math.floor(rect.height)
      buildPositions(Math.floor(rect.width))
      scheduleDraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [state.loaded, state.bibleLookup, buildPositions, scheduleDraw])

  useEffect(() => {
    filteredRef.current = filteredRefs
    scheduleDraw()
  }, [filteredRefs, scheduleDraw])

  useEffect(() => { scheduleDraw() }, [hoveredBook, scheduleDraw])

  // ── Book selection from external events ──────────────────────
  useEffect(() => {
    function onBookSel(e) {
      bookSelRef.current = e.detail
      scheduleDraw()
    }
    function onBookDesel() {
      bookSelRef.current = null
      scheduleDraw()
    }
    window.addEventListener('book:select', onBookSel)
    window.addEventListener('book:deselect', onBookDesel)
    return () => {
      window.removeEventListener('book:select', onBookSel)
      window.removeEventListener('book:deselect', onBookDesel)
    }
  }, [scheduleDraw])

  // ── Poll panel focus ─────────────────────────────────────────
  useEffect(() => {
    let last = null
    const iv = setInterval(() => {
      const cur = window.__focusedConn
      if (cur !== last) { last = cur; scheduleDraw() }
    }, 50)
    return () => clearInterval(iv)
  }, [scheduleDraw])

  // ── Mouse move ───────────────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const baseY = canvas.height - STRIP_H
    const arcArea = baseY - 8

    // Book hover
    let hBook = null
    for (const book of BOOK_ORDER) {
      const r = rangesRef.current[book]
      if (r && mx >= r.startX && mx <= r.endX && my >= baseY - 8 && my <= baseY + STRIP_H) {
        hBook = book; break
      }
    }
    hoveredBookRef.current = hBook
    if (hBook !== hoveredBook) setHoveredBook(hBook)

    // Arc hover — always active
    const refs = filteredRef.current
    let closest = null
    let minDist = 16

    refs.forEach(ref => {
      const x1 = getX(ref.from)
      const x2 = getX(ref.to)
      const midX = (x1 + x2) / 2
      const span = Math.abs(x2 - x1)
      const aH = Math.min(span * 0.7, arcArea * 0.97)

      for (let t = 0; t <= 1; t += 0.05) {
        const t1 = 1 - t
        const bx = t1 * t1 * x1 + 2 * t1 * t * midX + t * t * x2
        const by = t1 * t1 * baseY + 2 * t1 * t * (baseY - aH) + t * t * baseY
        const d = Math.sqrt((bx - mx) ** 2 + (by - my) ** 2)
        if (d < minDist) { minDist = d; closest = { ref } }
      }
    })

    if (closest?.ref !== hoveredArcRef.current?.ref) {
      hoveredArcRef.current = closest
      scheduleDraw()
    }

    // Tooltip — always
    if (closest && tooltipRef.current) {
      const fl = verseIdToLabel(closest.ref.from)
      const tl = verseIdToLabel(closest.ref.to)
      const ft = getVerseByLabel(fl) || ''
      const tt = getVerseByLabel(tl) || ''
      const fOT = isOT(closest.ref.from.split('.')[0])
      const tOT = isOT(closest.ref.to.split('.')[0])
      const dir = fOT && !tOT ? 'OT→NT' : !fOT && tOT ? 'NT→OT' : fOT ? 'OT→OT' : 'NT→NT'
      const fc = fOT ? '#7ab8f5' : '#7dd4a0'
      const tc = tOT ? '#7ab8f5' : '#7dd4a0'
      tooltipRef.current.style.left = Math.min(e.clientX + 16, window.innerWidth - 330) + 'px'
      tooltipRef.current.style.top = Math.max(e.clientY - 10, 60) + 'px'
      tooltipRef.current.style.opacity = '1'
      tooltipRef.current.innerHTML = `
        <div style="font-family:IBM Plex Mono;font-size:9px;color:#555;margin-bottom:8px;letter-spacing:0.08em">${dir} · ${closest.ref.votes} LINKS</div>
        <div style="font-family:IBM Plex Mono;font-size:12px;color:${fc};margin-bottom:4px">${fl}</div>
        <div style="font-size:13px;color:#999;line-height:1.65;margin-bottom:12px">${ft.slice(0, 150)}${ft.length > 150 ? '…' : ''}</div>
        <div style="font-family:IBM Plex Mono;font-size:12px;color:${tc};margin-bottom:4px">${tl}</div>
        <div style="font-size:13px;color:#999;line-height:1.65;margin-bottom:10px">${tt.slice(0, 150)}${tt.length > 150 ? '…' : ''}</div>
        <div style="font-family:IBM Plex Mono;font-size:9px;color:#3a3a3a">click to select</div>
      `
    } else if (!closest && tooltipRef.current) {
      tooltipRef.current.style.opacity = '0'
    }
  }, [getX, getVerseByLabel, hoveredBook, scheduleDraw])

  const handleMouseLeave = useCallback(() => {
    hoveredArcRef.current = null
    hoveredBookRef.current = null
    setHoveredBook(null)
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
    scheduleDraw()
  }, [scheduleDraw])

  const handleClick = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const baseY = canvas.height - STRIP_H

    // Book strip
    for (const book of BOOK_ORDER) {
      const r = rangesRef.current[book]
      if (r && mx >= r.startX && mx <= r.endX && my >= baseY - 8 && my <= baseY + STRIP_H) {
        if (bookSelRef.current === book) {
          bookSelRef.current = null
          window.dispatchEvent(new CustomEvent('book:deselect'))
        } else {
          bookSelRef.current = book
          window.dispatchEvent(new CustomEvent('book:select', { detail: book }))
        }
        scheduleDraw(); return
      }
    }

    // Arc click
    if (hoveredArcRef.current) {
      onVerseSelect(hoveredArcRef.current.ref.from)
      return
    }

    // Empty click — clear all
    if (bookSelRef.current) {
      bookSelRef.current = null
      window.dispatchEvent(new CustomEvent('book:deselect'))
      scheduleDraw()
    }
  }, [onVerseSelect, scheduleDraw])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'crosshair', position: 'absolute', top: 0, left: 0 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed', zIndex: 100, pointerEvents: 'none',
          background: '#0d0d0d', border: '1px solid #2a2a2a',
          borderRadius: 10, padding: '14px 18px',
          maxWidth: 320, opacity: 0, transition: 'opacity 0.1s',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  )
}