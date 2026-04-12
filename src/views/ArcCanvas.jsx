import { useEffect, useRef, useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { useRefs } from '../data/useRefs'
import { useBible } from '../data/useBible'
import { BOOK_ORDER, BOOK_MAP, isOT, verseIdToLabel } from '../data/bookMap'
import { proj } from './canvas/project'
import { useCamera } from './canvas/useCamera'
import { useCanvasSetup } from './canvas/useCanvasSetup'
import { drawScene } from './canvas/drawScene'
import { findClosestArc } from './canvas/arcUtils'
import { isFeatured } from './canvas/selectionUtils'

const STRIP = 40

export default function ArcCanvas({ onVerseSelect }) {
    const hovChRef = useRef(null)
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const scheduleRef = useRef(null)
    const tipRef = useRef(null)
    const bookTipRef = useRef(null)
    const labelPosRef = useRef({})

    const filtRef = useRef([])
    const hovArcRef = useRef(null)
    const hovBookRef = useRef(null)
    const selBookRef = useRef(null)
    const actVerRef = useRef(null)
    const connsRef = useRef([])

    const { state } = useApp()
    const { filteredRefs } = useRefs()
    const { getVerse } = useBible()

    function pointInPoly(px, py, corners) {
        let inside = false
        for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
            const xi = corners[i].sx, yi = corners[i].sy
            const xj = corners[j].sx, yj = corners[j].sy
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside
        }
        return inside
    }
    const scheduleDraw = useCallback(() => {
        if (scheduleRef.current) cancelAnimationFrame(scheduleRef.current)
        scheduleRef.current = requestAnimationFrame(() => { scheduleRef.current = null; doRender() })
    }, [])

    const camera = useCamera(scheduleDraw)
    const { posRef, rangesRef, chDataRef, bookStats, attach } = useCanvasSetup(state, scheduleDraw)

    useEffect(() => {
        actVerRef.current = state.activeVerse
        connsRef.current = state.connections || []
        scheduleDraw()
    }, [state.activeVerse, state.connections])

    const doRender = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !canvas.width || !canvas.height) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width, H = canvas.height
        const refs = filtRef.current
        const maxV = Math.max(...refs.map(r => r.votes), 1)
        const result = drawScene({
            ctx, W, H, camera, posRef, rangesRef, chDataRef,
            refs, maxV,
            av: actVerRef.current,
            conns: connsRef.current,
            sb: selBookRef.current,
            hb: hovBookRef.current,
            ha: hovArcRef.current,
            hovCh: hovChRef.current,
        })
        if (result?.labelPositions) labelPosRef.current = result.labelPositions
    }, [camera, posRef, rangesRef, chDataRef])

    useEffect(() => {
        if (!state.loaded) return
        return attach(canvasRef.current, containerRef.current)
    }, [state.loaded, state.bibleLookup, attach])

    useEffect(() => { filtRef.current = filteredRefs; scheduleDraw() }, [filteredRefs, scheduleDraw])

    useEffect(() => {
        let last = null
        const iv = setInterval(() => {
            if (window.__focusedConn !== last) { last = window.__focusedConn; scheduleDraw() }
        }, 50)
        return () => clearInterval(iv)
    }, [scheduleDraw])

    useEffect(() => {
        function onSel(e) { selBookRef.current = e.detail; scheduleDraw() }
        function onDesel() { selBookRef.current = null; scheduleDraw() }
        window.addEventListener('book:select', onSel)
        window.addEventListener('book:deselect', onDesel)
        return () => {
            window.removeEventListener('book:select', onSel)
            window.removeEventListener('book:deselect', onDesel)
        }
    }, [scheduleDraw])

    useEffect(() => {
        const c = canvasRef.current; if (!c) return
        const onW = e => camera.onWheel(e)
        const onMid = e => { if (e.button === 1) e.preventDefault() }
        c.addEventListener('wheel', onW, { passive: false })
        c.addEventListener('mousedown', onMid)
        return () => { c.removeEventListener('wheel', onW); c.removeEventListener('mousedown', onMid) }
    }, [camera])

    // ── Book tooltip ──────────────────────────────────────────
    const showBookTip = useCallback((book) => {
        const tip = bookTipRef.current; if (!tip) return
        const stats = bookStats.current[book] || {}
        const ot = isOT(book)
        const color = ot ? '#7ab8f5' : '#7dd4a0'
        const linkCount = state.allRefs.filter(r =>
            r.from.split('.')[0] === book || r.to.split('.')[0] === book
        ).length
        tip.style.opacity = '1'
        tip.innerHTML = `
      <div style="font-family:IBM Plex Mono;font-size:13px;color:${color};margin-bottom:6px;font-weight:500">${BOOK_MAP[book] || book}</div>
      <div style="font-family:IBM Plex Mono;font-size:10px;color:#555;margin-bottom:8px">${ot ? 'Old Testament' : 'New Testament'}</div>
      <div style="display:flex;gap:16px">
        <div><div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${stats.chapters || 0}</div><div style="font-family:IBM Plex Mono;font-size:9px;color:#555">chapters</div></div>
        <div><div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${(stats.verses || 0).toLocaleString()}</div><div style="font-family:IBM Plex Mono;font-size:9px;color:#555">verses</div></div>
        <div><div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${linkCount.toLocaleString()}</div><div style="font-family:IBM Plex Mono;font-size:9px;color:#555">links</div></div>
      </div>
      <div style="font-family:IBM Plex Mono;font-size:9px;color:#333;margin-top:8px">click to highlight all links</div>
    `
    }, [bookStats, state.allRefs])

    const hideBookTip = useCallback(() => {
        if (bookTipRef.current) bookTipRef.current.style.opacity = '0'
    }, [])

    // ── Mouse move ────────────────────────────────────────────
    const handleMouseMove = useCallback(e => {
        if (camera.onMouseMove(e)) return
        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const W = canvas.width, H = canvas.height
        const av = actVerRef.current, sb = selBookRef.current
        const hasSel = !!(av || sb)

        // Book hover
        let hb = null, bestD = 36
        Object.entries(labelPosRef.current).forEach(([book, lb]) => {
            const d = Math.sqrt((lb.sx - mx) ** 2 + (lb.sy - my) ** 2)
            if (d < bestD) { bestD = d; hb = book }
        })
        if (hb !== hovBookRef.current) {
            hovBookRef.current = hb
            if (hb) showBookTip(hb); else hideBookTip()
            scheduleDraw()
        } else if (hb) showBookTip(hb)

        // Chapter hover
        if (camera.is3D()) {
            const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
            const scale = getScale(W), { ox } = getOrigin(W, H), baseY = getBaseY(H)
            let hovCh = null
            let minDist = Infinity

            for (const book of BOOK_ORDER) {
                for (const { ch, xn, z, size } of chDataRef.current[book] || []) {
                    const h = size / 2
                    // Project all 4 corners — same as worldSquare
                    const corners = [
                        proj(xn - h, 0, z - h, rotY.current, rotX.current, scale, ox, baseY),
                        proj(xn + h, 0, z - h, rotY.current, rotX.current, scale, ox, baseY),
                        proj(xn + h, 0, z + h, rotY.current, rotX.current, scale, ox, baseY),
                        proj(xn - h, 0, z + h, rotY.current, rotX.current, scale, ox, baseY),
                    ]
                    // Point-in-polygon test
                    if (pointInPoly(mx, my, corners)) {
                        hovCh = `${book}.${ch}`; break
                    }
                }
                if (hovCh) break
            }

            if (hovCh !== hovChRef.current) { hovChRef.current = hovCh; scheduleDraw() }
        }

        // Arc hover
        const conns = connsRef.current
        const filter = hasSel
            ? ref => isFeatured(ref, { av, sb, conns })
            : null

        const closest = findClosestArc(mx, my, filtRef.current, posRef, chDataRef, rangesRef, camera, W, H, filter)

        if (closest?.ref !== hovArcRef.current?.ref) {
            hovArcRef.current = closest
            scheduleDraw()
            if (closest && tipRef.current) {
                const fl = verseIdToLabel(closest.ref.from)
                const tl = verseIdToLabel(closest.ref.to)
                const ft = getVerse(fl) || ''
                const tt = getVerse(tl) || ''
                const fOT = isOT(closest.ref.from.split('.')[0])
                const tOT = isOT(closest.ref.to.split('.')[0])
                const fc = fOT ? '#7ab8f5' : '#7dd4a0'
                const tc = tOT ? '#7ab8f5' : '#7dd4a0'
                const dir = fOT && !tOT ? 'OT→NT' : !fOT && tOT ? 'NT→OT' : fOT ? 'OT→OT' : 'NT→NT'
                tipRef.current.style.left = Math.min(e.clientX + 16, window.innerWidth - 340) + 'px'
                tipRef.current.style.top = Math.max(e.clientY - 10, 60) + 'px'
                tipRef.current.style.opacity = '1'
                tipRef.current.innerHTML = `
          <div style="font-family:IBM Plex Mono;font-size:10px;color:#555;margin-bottom:8px">${dir} · ${closest.ref.votes} LINKS</div>
          <div style="font-family:IBM Plex Mono;font-size:13px;color:${fc};margin-bottom:4px">${fl}</div>
          <div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:12px">${ft.slice(0, 160)}${ft.length > 160 ? '…' : ''}</div>
          <div style="font-family:IBM Plex Mono;font-size:13px;color:${tc};margin-bottom:4px">${tl}</div>
          <div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:10px">${tt.slice(0, 160)}${tt.length > 160 ? '…' : ''}</div>
          <div style="font-family:IBM Plex Mono;font-size:10px;color:#333">click to select</div>
        `
            } else if (!closest && tipRef.current) {
                tipRef.current.style.opacity = '0'
            }
        }
    }, [camera, posRef, chDataRef, rangesRef, getVerse, showBookTip, hideBookTip, scheduleDraw])

    const handleMouseLeave = useCallback(() => {
        camera.onMouseUp()
        hovArcRef.current = null; hovBookRef.current = null; hovChRef.current = null
        if (tipRef.current) tipRef.current.style.opacity = '0'
        hideBookTip()
        scheduleDraw()
    }, [camera, hideBookTip, scheduleDraw])

    // ── Click ─────────────────────────────────────────────────
    const handleClick = useCallback(e => {
        if (hovArcRef.current) {
            selBookRef.current = null
            window.dispatchEvent(new CustomEvent('book:deselect'))
            onVerseSelect(hovArcRef.current.ref.from)
            return
        }

        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const W = canvas.width, H = canvas.height

        // Chapter square click
        if (camera.is3D()) {
            const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
            const scale = getScale(W), { ox } = getOrigin(W, H), baseY = getBaseY(H)
            for (const book of BOOK_ORDER) {
                for (const { ch, xn, z, size } of chDataRef.current[book] || []) {
                    const c = proj(xn, 0, z, rotY.current, rotX.current, scale, ox, baseY)
                    const ss = size * scale
                    if (Math.abs(c.sx - mx) < ss && Math.abs(c.sy - my) < ss) {
                        selBookRef.current = null
                        window.dispatchEvent(new CustomEvent('book:deselect'))
                        window.dispatchEvent(new CustomEvent('chapter:select', { detail: { book, chapter: ch } }))
                        return
                    }
                }
            }
        }

        // Book label click
        let bestBook = null, bestDist = Infinity
        Object.entries(labelPosRef.current).forEach(([book, lb]) => {
            const d = Math.sqrt((lb.sx - mx) ** 2 + (lb.sy - my) ** 2)
            if (d < bestDist) { bestDist = d; bestBook = book }
        })

        if (bestBook && bestDist < Math.max((W / BOOK_ORDER.length) * 0.6, 44)) {
            if (selBookRef.current === bestBook) {
                selBookRef.current = null
                window.dispatchEvent(new CustomEvent('book:deselect'))
            } else {
                selBookRef.current = bestBook
                window.dispatchEvent(new CustomEvent('book:select', { detail: bestBook }))
            }
            scheduleDraw(); return
        }

        selBookRef.current = null
        window.dispatchEvent(new CustomEvent('book:deselect'))
        scheduleDraw()
    }, [onVerseSelect, camera, chDataRef, scheduleDraw])

    return (
        <div ref={containerRef} className="relative w-full h-full" style={{ background: '#080808' }}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block"
                style={{
                    cursor: camera.drag.current
                        ? (camera.dragBtn.current === 2 ? 'grabbing' : camera.dragBtn.current === 1 ? 'move' : 'default')
                        : 'crosshair'
                }}
                onMouseDown={camera.onMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={camera.onMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onContextMenu={e => e.preventDefault()}
                onTouchStart={camera.onTouchStart}
                onTouchMove={camera.onTouchMove}
                onTouchEnd={camera.onTouchEnd}
            />

            <button
                onClick={() => window.dispatchEvent(new CustomEvent('view:reset'))}
                className="absolute top-4 right-4 font-mono text-[10px] px-3 py-1.5 rounded transition-colors"
                style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid #1e1e1e', color: '#444' }}
                onMouseEnter={e => { e.target.style.color = '#d4a843'; e.target.style.borderColor = '#d4a843' }}
                onMouseLeave={e => { e.target.style.color = '#444'; e.target.style.borderColor = '#1e1e1e' }}
            >reset view</button>

            <div className="absolute bottom-4 right-4 font-mono text-[10px] text-right leading-relaxed pointer-events-none"
                style={{ color: '#2a2a2a' }}>
                middle drag · pan &nbsp;·&nbsp; right drag · rotate<br />scroll · zoom
            </div>

            <div ref={tipRef} className="fixed z-50 pointer-events-none font-mono rounded-lg"
                style={{ background: '#0d0d0d', border: '1px solid #222', padding: '14px 18px', maxWidth: 340, opacity: 0, transition: 'opacity 0.1s', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
            />
            <div ref={bookTipRef} className="fixed z-50 pointer-events-none font-mono rounded-lg"
                style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', background: '#0d0d0d', border: '1px solid #222', padding: '14px 20px', opacity: 0, transition: 'opacity 0.1s', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', minWidth: 220 }}
            />
        </div>
    )
}