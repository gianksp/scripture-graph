import { useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import { useBible } from '../../data/useBible'
import { BOOK_ORDER } from '../../data/bookMap'
import { project3D } from '../../utils/project'
import { groupRefsByChapterPair, findClosestChapterArc } from '../../utils/arcGeometry'
import { useCamera } from '../../utils/useCamera'
import { useCanvasSetup } from '../../utils/useCanvasSetup'
import { drawScene } from '../../utils/drawScene'
import { buildArcTooltipHTML, buildBookTooltipHTML } from './ArcTooltip'

/** Point-in-polygon test used for chapter square hit detection */
function pointInPolygon(px, py, corners) {
    let inside = false
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
        const xi = corners[i].sx, yi = corners[i].sy
        const xj = corners[j].sx, yj = corners[j].sy
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
            inside = !inside
    }
    return inside
}

/** Positions a tooltip element near the mouse, keeping it within viewport */
function positionTooltip(tipEl, clientX, clientY, tipWidth = 460) {
    tipEl.style.left = Math.min(clientX + 16, window.innerWidth - tipWidth - 8) + 'px'
    tipEl.style.top = Math.max(clientY - 10, 60) + 'px'
}

export default function ArcCanvas({ onVerseSelect }) {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const scheduleRef = useRef(null)
    const arcTipRef = useRef(null)
    const bookTipRef = useRef(null)
    const labelPosRef = useRef({})

    // All interaction state in refs — avoids stale closures in canvas draw loop
    const filteredRefsRef = useRef([])
    const hoveredArcRef = useRef(null)
    const hoveredBookRef = useRef(null)
    const hoveredChapterKeyRef = useRef(null)
    const selectedBookRef = useRef(null)
    const activeVerseRef = useRef(null)
    const connectionsRef = useRef([])

    // Pre-aggregated chapter arcs — expensive to compute, cached here
    const allChapterArcsRef = useRef([])  // from filteredRefs
    const selectedChapterArcsRef = useRef([])  // from current connections

    const { state } = useApp()
    const { filteredRefs } = useRefs()
    const { getVerse } = useBible()

    const scheduleDraw = useCallback(() => {
        if (scheduleRef.current) cancelAnimationFrame(scheduleRef.current)
        scheduleRef.current = requestAnimationFrame(() => {
            scheduleRef.current = null
            render()
        })
    }, [])

    const camera = useCamera(scheduleDraw)
    const { versePositions, bookRanges, chapterData, bookStats, attachResizeObserver } =
        useCanvasSetup(state, scheduleDraw)

    // Sync active verse + connections → recompute selected chapter arcs
    useEffect(() => {
        activeVerseRef.current = state.activeVerse
        connectionsRef.current = state.connections || []
        selectedChapterArcsRef.current = groupRefsByChapterPair(connectionsRef.current)
        scheduleDraw()
    }, [state.activeVerse, state.connections])

    // Sync filtered refs → recompute all chapter arcs
    useEffect(() => {
        filteredRefsRef.current = filteredRefs
        allChapterArcsRef.current = groupRefsByChapterPair(filteredRefs)
        scheduleDraw()
    }, [filteredRefs, scheduleDraw])

    // ── Render ────────────────────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !canvas.width || !canvas.height) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width
        const H = canvas.height

        const result = drawScene({
            ctx, canvasW: W, canvasH: H, camera,
            versePositions, bookRanges, chapterData,
            filteredRefs: filteredRefsRef.current,
            maxVotes: Math.max(...filteredRefsRef.current.map(r => r.votes), 1),
            activeVerse: activeVerseRef.current,
            connections: connectionsRef.current,
            selectedBook: selectedBookRef.current,
            hoveredBook: hoveredBookRef.current,
            hoveredArc: hoveredArcRef.current,
            hoveredChapterKey: hoveredChapterKeyRef.current,
            chapterArcs: allChapterArcsRef.current,
            chapterArcsSelected: selectedChapterArcsRef.current,
        })

        if (result?.labelPositions) labelPosRef.current = result.labelPositions
    }, [camera, versePositions, bookRanges, chapterData])

    // ── Setup effects ─────────────────────────────────────────
    useEffect(() => {
        if (!state.loaded) return
        return attachResizeObserver(canvasRef.current, containerRef.current)
    }, [state.loaded, state.bibleLookup, attachResizeObserver])

    // Poll info panel card hover for arc focus highlighting
    useEffect(() => {
        let lastFocused = null
        const interval = setInterval(() => {
            if (window.__focusedConn !== lastFocused) {
                lastFocused = window.__focusedConn
                scheduleDraw()
            }
        }, 50)
        return () => clearInterval(interval)
    }, [scheduleDraw])

    // Book selection events
    useEffect(() => {
        const onBookSelected = e => { selectedBookRef.current = e.detail; scheduleDraw() }
        const onBookDeselected = () => { selectedBookRef.current = null; scheduleDraw() }
        window.addEventListener('book:select', onBookSelected)
        window.addEventListener('book:deselect', onBookDeselected)
        return () => {
            window.removeEventListener('book:select', onBookSelected)
            window.removeEventListener('book:deselect', onBookDeselected)
        }
    }, [scheduleDraw])

    // Wheel zoom + suppress middle-click scroll
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const onWheel = e => camera.onWheel(e)
        const onMidClick = e => { if (e.button === 1) e.preventDefault() }
        canvas.addEventListener('wheel', onWheel, { passive: false })
        canvas.addEventListener('mousedown', onMidClick)
        return () => {
            canvas.removeEventListener('wheel', onWheel)
            canvas.removeEventListener('mousedown', onMidClick)
        }
    }, [camera])

    // ── Tooltip helpers ───────────────────────────────────────
    const showArcTooltip = useCallback((chArc, clientX, clientY) => {
        const tip = arcTipRef.current; if (!tip) return
        positionTooltip(tip, clientX, clientY)
        tip.style.opacity = '1'
        tip.innerHTML = buildArcTooltipHTML(chArc, getVerse)
    }, [getVerse])

    const hideArcTooltip = useCallback(() => {
        if (arcTipRef.current) arcTipRef.current.style.opacity = '0'
    }, [])

    const showBookTooltip = useCallback((book) => {
        const tip = bookTipRef.current; if (!tip) return
        const stats = bookStats.current[book] || {}
        const linkCount = state.allRefs.filter(r =>
            r.from.split('.')[0] === book || r.to.split('.')[0] === book
        ).length
        tip.style.opacity = '1'
        tip.innerHTML = buildBookTooltipHTML(book, stats, linkCount)
    }, [bookStats, state.allRefs])

    const hideBookTooltip = useCallback(() => {
        if (bookTipRef.current) bookTipRef.current.style.opacity = '0'
    }, [])

    // ── Chapter square hover detection ────────────────────────
    const detectChapterHover = useCallback((mouseX, mouseY, canvasW, canvasH) => {
        if (!camera.is3D()) return null
        const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
        const scale = getScale(canvasW)
        const { ox } = getOrigin(canvasW, canvasH)
        const baseY = getBaseY(canvasH)

        for (const book of BOOK_ORDER) {
            for (const { ch, xn, z, size } of chapterData.current[book] || []) {
                const half = size / 2
                const corners = [
                    project3D(xn - half, 0, z - half, rotY.current, rotX.current, scale, ox, baseY),
                    project3D(xn + half, 0, z - half, rotY.current, rotX.current, scale, ox, baseY),
                    project3D(xn + half, 0, z + half, rotY.current, rotX.current, scale, ox, baseY),
                    project3D(xn - half, 0, z + half, rotY.current, rotX.current, scale, ox, baseY),
                ]
                if (pointInPolygon(mouseX, mouseY, corners)) return `${book}.${ch}`
            }
        }
        return null
    }, [camera, chapterData])

    // ── Arc hover detection ───────────────────────────────────
    const detectArcHover = useCallback((mouseX, mouseY, canvasW, canvasH, hasSelection) => {
        const arcs = hasSelection ? selectedChapterArcsRef.current : allChapterArcsRef.current
        return findClosestChapterArc(
            mouseX, mouseY, arcs,
            versePositions, chapterData, bookRanges, camera, canvasW, canvasH
        )
    }, [camera, versePositions, chapterData, bookRanges])

    // ── Book label hover detection ────────────────────────────
    const detectBookHover = useCallback((mouseX, mouseY) => {
        let closestBook = null, bestDist = 36
        Object.entries(labelPosRef.current).forEach(([book, pos]) => {
            const dist = Math.sqrt((pos.sx - mouseX) ** 2 + (pos.sy - mouseY) ** 2)
            if (dist < bestDist) { bestDist = dist; closestBook = book }
        })
        return closestBook
    }, [])

    // ── Mouse move ────────────────────────────────────────────
    const handleMouseMove = useCallback(e => {
        if (camera.onMouseMove(e)) return  // camera consumed the event

        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const W = canvas.width
        const H = canvas.height
        const hasSelection = !!(activeVerseRef.current || selectedBookRef.current)

        // 1. Chapter square hover (highest priority)
        const hoveredChKey = detectChapterHover(mouseX, mouseY, W, H)
        if (hoveredChKey !== hoveredChapterKeyRef.current) {
            hoveredChapterKeyRef.current = hoveredChKey
            scheduleDraw()
        }

        // 2. Arc hover (only when not on a chapter square)
        const arcHit = hoveredChKey ? null : detectArcHover(mouseX, mouseY, W, H, hasSelection)
        if (arcHit?.chArc !== hoveredArcRef.current?.chArc) {
            hoveredArcRef.current = arcHit
            scheduleDraw()
            if (arcHit) showArcTooltip(arcHit.chArc, e.clientX, e.clientY)
            else hideArcTooltip()
        } else if (arcHit) {
            // Reposition tooltip as mouse moves
            positionTooltip(arcTipRef.current, e.clientX, e.clientY)
        }

        // 3. Book label hover
        const hoveredBook = detectBookHover(mouseX, mouseY)
        if (hoveredBook !== hoveredBookRef.current) {
            hoveredBookRef.current = hoveredBook
            if (hoveredBook) showBookTooltip(hoveredBook)
            else hideBookTooltip()
            scheduleDraw()
        } else if (hoveredBook) {
            showBookTooltip(hoveredBook)
        }
    }, [camera, detectChapterHover, detectArcHover, detectBookHover,
        showArcTooltip, hideArcTooltip, showBookTooltip, hideBookTooltip, scheduleDraw])

    const handleMouseLeave = useCallback(() => {
        camera.onMouseUp()
        hoveredArcRef.current = null
        hoveredBookRef.current = null
        hoveredChapterKeyRef.current = null
        hideArcTooltip()
        hideBookTooltip()
        scheduleDraw()
    }, [camera, hideArcTooltip, hideBookTooltip, scheduleDraw])

    // ── Click ─────────────────────────────────────────────────
    const handleClick = useCallback(e => {
        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const W = canvas.width
        const H = canvas.height

        // Arc click — show all verse pairs for this chapter pair in info panel
        if (hoveredArcRef.current?.chArc) {
            const { chArc } = hoveredArcRef.current
            selectedBookRef.current = null
            // Don't dispatch book:deselect here — it clears the verse state
            window.dispatchEvent(new CustomEvent('chaparc:select', { detail: { chArc } }))
            return
        }
        // Chapter square click — show all connections for that chapter
        if (camera.is3D()) {
            const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
            const scale = getScale(W)
            const { ox } = getOrigin(W, H)
            const baseY = getBaseY(H)
            for (const book of BOOK_ORDER) {
                for (const { ch, xn, z, size } of chapterData.current[book] || []) {
                    const center = project3D(xn, 0, z, rotY.current, rotX.current, scale, ox, baseY)
                    const screenSize = size * scale
                    if (Math.abs(center.sx - mouseX) < screenSize && Math.abs(center.sy - mouseY) < screenSize) {
                        selectedBookRef.current = null
                        window.dispatchEvent(new CustomEvent('book:deselect'))
                        // Fire chapter:select — App.jsx handles building connections
                        window.dispatchEvent(new CustomEvent('chapter:select', { detail: { book, chapter: ch } }))
                        return
                    }
                }
            }
        }

        // Book label click
        let closestBook = null, closestDist = Infinity
        Object.entries(labelPosRef.current).forEach(([book, pos]) => {
            const dist = Math.sqrt((pos.sx - mouseX) ** 2 + (pos.sy - mouseY) ** 2)
            if (dist < closestDist) { closestDist = dist; closestBook = book }
        })

        const threshold = Math.max((W / BOOK_ORDER.length) * 0.6, 44)
        if (closestBook && closestDist < threshold) {
            if (selectedBookRef.current === closestBook) {
                selectedBookRef.current = null
                window.dispatchEvent(new CustomEvent('book:deselect'))
            } else {
                selectedBookRef.current = closestBook
                // book:select → App.jsx builds all book connections → info panel shows them
                window.dispatchEvent(new CustomEvent('book:select', { detail: closestBook }))
            }
            scheduleDraw()
            return
        }

        // Empty click — clear
        selectedBookRef.current = null
        window.dispatchEvent(new CustomEvent('book:deselect'))
        scheduleDraw()
    }, [camera, chapterData, scheduleDraw])

    return (
        <div ref={containerRef} className="relative w-full h-full" style={{ background: '#080808' }}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block"
                style={{
                    cursor: camera.isDragging.current
                        ? (camera.dragButton.current === 2 ? 'grabbing' : camera.dragButton.current === 1 ? 'move' : 'default')
                        : 'crosshair',
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

            <div
                className="absolute bottom-4 right-4 font-mono text-[10px] text-right leading-relaxed pointer-events-none"
                style={{ color: '#2a2a2a' }}
            >
                middle drag · pan &nbsp;·&nbsp; right drag · rotate<br />scroll · zoom
            </div>

            {/* Arc hover tooltip — positioned near mouse */}
            <div
                ref={arcTipRef}
                className="fixed z-50 pointer-events-none font-mono rounded-lg"
                style={{
                    background: '#0d0d0d', border: '1px solid #222',
                    padding: '14px 18px', maxWidth: 460, width: 460,
                    opacity: 0, transition: 'opacity 0.1s',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
            />

            {/* Book hover tooltip — fixed at bottom center */}
            <div
                ref={bookTipRef}
                className="fixed z-50 pointer-events-none font-mono rounded-lg"
                style={{
                    bottom: 60, left: '50%', transform: 'translateX(-50%)',
                    background: '#0d0d0d', border: '1px solid #222',
                    padding: '14px 20px', minWidth: 220,
                    opacity: 0, transition: 'opacity 0.1s',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
            />
        </div>
    )
}