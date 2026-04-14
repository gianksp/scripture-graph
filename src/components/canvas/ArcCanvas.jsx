import { useEffect, useRef, useCallback } from 'react'
import { useStore, selectFilteredRefs, selectBookLinkCounts, selectMaxVotes } from '../../store/store'
import { useBible } from '../../data/useBible'
import { BOOK_ORDER } from '../../data/bookMap'
import { groupRefsByChapterPair, computeArcEndpoints } from '../../utils/arcGeometry'
import { useCamera } from '../../utils/useCamera'
import { useCanvasSetup } from '../../utils/useCanvasSetup'
import { drawScene } from '../../utils/drawScene'
import { buildArcTooltipHTML, buildBookTooltipHTML } from './ArcTooltip'
import {
    buildChapterCornerCache, pointInCachedPolygon,
    buildArcSampleCache, hitTestArcSamples,
} from '../../utils/geometryCache'

function positionTooltip(tipEl, clientX, clientY) {
    const tipWidth = Math.min(460, window.innerWidth - 16)
    const tipLeft = Math.min(clientX + 16, window.innerWidth - tipWidth - 8)
    const tipTop = Math.max(clientY - 10, 60)
    tipEl.style.left = Math.max(8, tipLeft) + 'px'
    tipEl.style.top = tipTop + 'px'
    tipEl.style.width = tipWidth + 'px'
    tipEl.style.maxWidth = tipWidth + 'px'
}

export default function ArcCanvas() {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const scheduleRef = useRef(null)
    const arcTipRef = useRef(null)
    const bookTipRef = useRef(null)
    const labelPosRef = useRef({})

    const hoveredArcRef = useRef(null)
    const hoveredBookRef = useRef(null)
    const hoveredChapterKeyRef = useRef(null)
    const allChapterArcsRef = useRef([])
    const selChapterArcsRef = useRef([])

    // geometry cache
    const cornerCacheRef = useRef({ corners: new Float32Array(0), meta: [] })
    const allArcSampRef = useRef(new Float32Array(0))
    const selArcSampRef = useRef(new Float32Array(0))
    const cacheVerRef = useRef(-1)
    const canvasSizeRef = useRef({ W: 0, H: 0 })

    // rAF-batched mouse
    const pendingMouseRef = useRef(null)
    const mousePendingRef = useRef(false)

    const activeVerse = useStore(s => s.activeVerse)
    const connections = useStore(s => s.connections)
    const selectedBook = useStore(s => s.selectedBook)
    const focusedConn = useStore(s => s.focusedConn)
    const resetSignal = useStore(s => s.resetSignal)
    const loaded = useStore(s => s.loaded)
    const filteredRefs = useStore(selectFilteredRefs)
    const bookLinkCounts = useStore(selectBookLinkCounts)
    const maxVotes = useStore(selectMaxVotes)
    const selectBook = useStore(s => s.selectBook)
    const deselectBook = useStore(s => s.deselectBook)
    const selectChapter = useStore(s => s.selectChapter)
    const selectChArc = useStore(s => s.selectChapterArc)

    const { getVerse } = useBible()

    const scheduleDraw = useCallback(() => {
        if (scheduleRef.current) cancelAnimationFrame(scheduleRef.current)
        scheduleRef.current = requestAnimationFrame(() => {
            scheduleRef.current = null
            renderFrameRef.current()   // ← was: renderFrame()
        })
    }, [])

    const camera = useCamera(scheduleDraw, resetSignal)
    const { versePositions, bookRanges, chapterData, bookStats, attachResizeObserver } =
        useCanvasSetup(scheduleDraw)

    const rebuildCache = useCallback(() => {
        const { W, H } = canvasSizeRef.current
        if (!W || !H || camera.version.current === cacheVerRef.current) return
        cornerCacheRef.current = buildChapterCornerCache(chapterData, camera, W, H)
        allArcSampRef.current = buildArcSampleCache(allChapterArcsRef.current, versePositions, chapterData, bookRanges, camera, W, H)
        selArcSampRef.current = buildArcSampleCache(selChapterArcsRef.current, versePositions, chapterData, bookRanges, camera, W, H)
        cacheVerRef.current = camera.version.current
    }, [camera, chapterData, versePositions, bookRanges])

    const renderFrame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !canvas.width || !canvas.height) return
        rebuildCache()
        const result = drawScene({
            ctx: canvas.getContext('2d'),
            canvasW: canvas.width, canvasH: canvas.height,
            camera, versePositions, bookRanges, chapterData,
            filteredRefs, maxVotes,
            activeVerse, connections, selectedBook,
            hoveredBook: hoveredBookRef.current,
            hoveredArc: hoveredArcRef.current,
            hoveredChapterKey: hoveredChapterKeyRef.current,
            chapterArcs: allChapterArcsRef.current,
            chapterArcsSelected: selChapterArcsRef.current,
            focusedConn,
        })
        if (result?.labelPositions) labelPosRef.current = result.labelPositions
    }, [camera, versePositions, bookRanges, chapterData,
        filteredRefs, maxVotes, activeVerse, connections,
        selectedBook, focusedConn, rebuildCache])

    const renderFrameRef = useRef(renderFrame)
    useEffect(() => { renderFrameRef.current = renderFrame }, [renderFrame])

    useEffect(() => {
        allChapterArcsRef.current = groupRefsByChapterPair(filteredRefs)
        cacheVerRef.current = -1
        scheduleDraw()
    }, [filteredRefs])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const onTouchMove = e => camera.onTouchMove(e)
        canvas.addEventListener('touchmove', onTouchMove, { passive: false })
        return () => canvas.removeEventListener('touchmove', onTouchMove)
    }, [camera])

    useEffect(() => {
        selChapterArcsRef.current = groupRefsByChapterPair(connections)
        cacheVerRef.current = -1
        scheduleDraw()
    }, [connections])

    useEffect(() => { scheduleDraw() }, [focusedConn, activeVerse, selectedBook])

    useEffect(() => {
        if (!loaded) return
        return attachResizeObserver(canvasRef.current, containerRef.current, (W, H) => {
            canvasSizeRef.current = { W, H }
            cacheVerRef.current = -1
        })
    }, [loaded])

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

    const showArcTooltip = useCallback((chArc, clientX, clientY) => {
        const tip = arcTipRef.current; if (!tip) return
        positionTooltip(tip, clientX, clientY)
        tip.style.opacity = '1'
        tip.innerHTML = buildArcTooltipHTML(chArc, getVerse)
    }, [getVerse])

    const hideArcTooltip = useCallback(() => { if (arcTipRef.current) arcTipRef.current.style.opacity = '0' }, [])
    const hideBookTooltip = useCallback(() => { if (bookTipRef.current) bookTipRef.current.style.opacity = '0' }, [])

    const showBookTooltip = useCallback(book => {
        const tip = bookTipRef.current; if (!tip) return
        tip.style.opacity = '1'
        tip.innerHTML = buildBookTooltipHTML(book, bookStats.current[book] || {}, bookLinkCounts[book] || 0)
    }, [bookStats, bookLinkCounts])

    const detectChapterHover = useCallback((mx, my) => {
        if (!camera.is3D()) return null
        const { meta, corners } = cornerCacheRef.current
        for (let i = 0; i < meta.length; i++) {
            if (pointInCachedPolygon(mx, my, corners, i)) return `${meta[i].book}.${meta[i].ch}`
        }
        return null
    }, [camera])

    const detectArcHover = useCallback((mx, my, hasSel) => {
        const arcs = hasSel ? selChapterArcsRef.current : allChapterArcsRef.current
        const samples = hasSel ? selArcSampRef.current : allArcSampRef.current
        const idx = hitTestArcSamples(mx, my, samples)
        if (idx === -1 || !arcs[idx]) return null
        return { chArc: arcs[idx] }
    }, [])

    const detectBookHover = useCallback((mx, my) => {
        let best = null, bestD = 36
        for (const [book, pos] of Object.entries(labelPosRef.current)) {
            const d = Math.sqrt((pos.sx - mx) ** 2 + (pos.sy - my) ** 2)
            if (d < bestD) { bestD = d; best = book }
        }
        return best
    }, [])

    const processMouseMove = useCallback(e => {
        if (camera.onMouseMove(e)) return
        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const hasSel = !!(activeVerse || selectedBook)

        const hovCh = detectChapterHover(mx, my)
        if (hovCh !== hoveredChapterKeyRef.current) {
            hoveredChapterKeyRef.current = hovCh
            scheduleDraw()
        }

        const arcHit = hovCh ? null : detectArcHover(mx, my, hasSel)
        if (arcHit?.chArc !== hoveredArcRef.current?.chArc) {
            hoveredArcRef.current = arcHit
            scheduleDraw()
            if (arcHit) showArcTooltip(arcHit.chArc, e.clientX, e.clientY)
            else hideArcTooltip()
        } else if (arcHit) {
            positionTooltip(arcTipRef.current, e.clientX, e.clientY)
        }

        const hovBook = detectBookHover(mx, my)
        if (hovBook !== hoveredBookRef.current) {
            hoveredBookRef.current = hovBook
            hovBook ? showBookTooltip(hovBook) : hideBookTooltip()
            scheduleDraw()
        } else if (hovBook) {
            showBookTooltip(hovBook)
        }
    }, [camera, activeVerse, selectedBook,
        detectChapterHover, detectArcHover, detectBookHover,
        showArcTooltip, hideArcTooltip, showBookTooltip, hideBookTooltip, scheduleDraw])

    const handleMouseMove = useCallback(e => {
        pendingMouseRef.current = e
        if (mousePendingRef.current) return
        mousePendingRef.current = true
        requestAnimationFrame(() => {
            mousePendingRef.current = false
            if (pendingMouseRef.current) {
                processMouseMove(pendingMouseRef.current)
                pendingMouseRef.current = null
            }
        })
    }, [processMouseMove])

    const handleMouseLeave = useCallback(() => {
        camera.onMouseUp()
        hoveredArcRef.current = hoveredBookRef.current = hoveredChapterKeyRef.current = null
        hideArcTooltip(); hideBookTooltip(); scheduleDraw()
    }, [camera, hideArcTooltip, hideBookTooltip, scheduleDraw])

    const handleClick = useCallback(e => {
        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top

        if (hoveredArcRef.current?.chArc) { selectChArc(hoveredArcRef.current.chArc); return }

        if (camera.is3D()) {
            const { meta } = cornerCacheRef.current
            for (let i = 0; i < meta.length; i++) {
                const m = meta[i]
                const ss = m.size * camera.getScale(canvas.width)
                if (Math.abs(m.sx - mx) < ss && Math.abs(m.sy - my) < ss) {
                    selectChapter(m.book, m.ch); return
                }
            }
        }

        let closestBook = null, closestDist = Infinity
        for (const [book, pos] of Object.entries(labelPosRef.current)) {
            const d = Math.sqrt((pos.sx - mx) ** 2 + (pos.sy - my) ** 2)
            if (d < closestDist) { closestDist = d; closestBook = book }
        }
        const threshold = Math.max((canvas.width / BOOK_ORDER.length) * 0.6, 44)
        if (closestBook && closestDist < threshold) {
            selectedBook === closestBook ? deselectBook() : selectBook(closestBook)
            scheduleDraw(); return
        }

        deselectBook(); scheduleDraw()
    }, [camera, selectedBook, selectBook, deselectBook, selectChapter, selectChArc, scheduleDraw])

    return (
        <div ref={containerRef} className="relative w-full h-full bg-canvas dark:bg-canvas-dark">
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, display: 'block', cursor: 'crosshair' }}
                onMouseDown={camera.onMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={camera.onMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onContextMenu={e => e.preventDefault()}
                onTouchStart={camera.onTouchStart}
                // onTouchMove={camera.onTouchMove}
                onTouchEnd={camera.onTouchEnd}
            />
            {/* Navigation hint + reset — top left */}
            <button
                onClick={() => useStore.getState().resetView()}
                className="absolute top-3 right-3 flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors active:opacity-90"
                style={{ background: 'rgba(8,8,8,0.7)', border: '1px solid #2a2a2a' }}
                title="Reset view"
            >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    {/* Pan arrows — horizontal */}
                    <line x1="4" y1="16" x2="28" y2="16" stroke="#7ab8f5" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                    <path d="M4 16L7 13M4 16L7 19" stroke="#7ab8f5" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                    <path d="M28 16L25 13M28 16L25 19" stroke="#7ab8f5" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

                    {/* Pan arrows — vertical */}
                    <line x1="16" y1="4" x2="16" y2="28" stroke="#7dd4a0" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                    <path d="M16 4L13 7M16 4L19 7" stroke="#7dd4a0" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                    <path d="M16 28L13 25M16 28L19 25" stroke="#7dd4a0" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

                    {/* Rotation arc */}
                    <path d="M9 9 A10 10 0 0 1 23 9" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
                    <path d="M23 9L21 6M23 9L26 8" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

                    {/* Center dot */}
                    <circle cx="16" cy="16" r="2" fill="#d4a843" opacity="0.9" />
                </svg>
            </button>
            <div
                ref={arcTipRef}
                style={{
                    position: 'fixed', zIndex: 50, pointerEvents: 'none',
                    fontFamily: 'IBM Plex Mono', borderRadius: 10,
                    background: '#0d0d0d', border: '1px solid #222',
                    padding: '12px 14px',
                    maxWidth: 'calc(100vw - 16px)',
                    opacity: 0, transition: 'opacity 0.1s',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                    overflowY: 'auto', maxHeight: '60vh',
                }}
            /><div ref={bookTipRef} style={{ position: 'fixed', zIndex: 50, pointerEvents: 'none', fontFamily: 'IBM Plex Mono', borderRadius: 10, bottom: 60, left: '50%', transform: 'translateX(-50%)', background: '#0d0d0d', border: '1px solid #222', padding: '14px 20px', minWidth: 220, opacity: 0, transition: 'opacity 0.1s', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }} />
        </div>
    )
}