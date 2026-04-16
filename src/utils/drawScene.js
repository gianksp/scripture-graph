import { project3D } from './project'
import { BOOK_ORDER, BOOK_MAP, isOT, arcColor } from '../data/bookMap'
import { computeArcEndpoints, verseToScreenPos } from './arcGeometry'

let _maxLabelWidth = 0
let _labelFont = ''

function getMaxLabelWidth(ctx, fontSize) {
    const font = `${fontSize}px IBM Plex Mono`
    if (_labelFont === font && _maxLabelWidth > 0) return _maxLabelWidth
    ctx.font = font
    _maxLabelWidth = Math.max(...BOOK_ORDER.map(b => ctx.measureText(BOOK_MAP[b] || b).width))
    _labelFont = font
    return _maxLabelWidth
}

function drawWorldSquare(ctx, xn, z, size, camera, W, H) {
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W)
    const { ox } = getOrigin(W, H)
    const baseY = getBaseY(H)
    const half = size / 2
    const corners = [
        project3D(xn - half, 0, z - half, rotY.current, rotX.current, scale, ox, baseY),
        project3D(xn + half, 0, z - half, rotY.current, rotX.current, scale, ox, baseY),
        project3D(xn + half, 0, z + half, rotY.current, rotX.current, scale, ox, baseY),
        project3D(xn - half, 0, z + half, rotY.current, rotX.current, scale, ox, baseY),
    ]
    ctx.beginPath()
    ctx.moveTo(corners[0].sx, corners[0].sy)
    corners.slice(1).forEach(c => ctx.lineTo(c.sx, c.sy))
    ctx.closePath()
}

function drawChapterArc(ctx, chArc, isHovered, isFocused, maxVotes, versePositions, chapterData, bookRanges, camera, W, H, hasSel) {
    const ep = computeArcEndpoints(
        `${chArc.fromChapter}.1`, `${chArc.toChapter}.1`,
        versePositions, chapterData, bookRanges, camera, W, H
    )
    const color = arcColor(chArc.fromChapter.split('.')[0], chArc.toChapter.split('.')[0])
    const alpha = 0.75
    const lw = hasSel ? 0.75 : 0.025
    ctx.beginPath()
    ctx.strokeStyle = isFocused && !isHovered ? '#fff' : color
    ctx.globalAlpha = alpha
    ctx.lineWidth = lw
    ctx.moveTo(ep.x1, ep.y1)
    ctx.bezierCurveTo(ep.cp1x, ep.cp1y, ep.cp2x, ep.cp2y, ep.x2, ep.y2)
    ctx.stroke()
}

function isArcHovered(chArc, hoveredArc) {
    if (!hoveredArc?.chArc) return false
    const h = hoveredArc.chArc
    return (h.fromChapter === chArc.fromChapter && h.toChapter === chArc.toChapter) ||
        (h.fromChapter === chArc.toChapter && h.toChapter === chArc.fromChapter)
}

function isArcFocused(chArc, focusedConn) {
    if (!focusedConn) return false
    const fFrom = focusedConn.from.split('.').slice(0, 2).join('.')
    const fTo = focusedConn.to.split('.').slice(0, 2).join('.')
    return (fFrom === chArc.fromChapter && fTo === chArc.toChapter) ||
        (fFrom === chArc.toChapter && fTo === chArc.fromChapter)
}

function drawChapterSquare(ctx, d, isActive, isBookHovered, isChapterHovered, camera, W, H) {
    const { ch, xn, z, size, ot } = d
    const color = ot ? '#7ab8f5' : '#7dd4a0'
    ctx.globalAlpha = isActive ? 1 : isChapterHovered ? 0.9 : isBookHovered ? 0.6 : 0.5

    drawWorldSquare(ctx, xn, z, size, camera, W, H)
    ctx.fillStyle = isActive || isChapterHovered
        ? (ot ? 'rgba(122,184,245,0.15)' : 'rgba(125,212,160,0.15)')
        : (ot ? 'rgba(122,184,245,0.04)' : 'rgba(125,212,160,0.04)')
    ctx.strokeStyle = isActive || isChapterHovered
        ? (ot ? 'rgba(122,184,245,0.95)' : 'rgba(125,212,160,0.95)')
        : isBookHovered
            ? (ot ? 'rgba(122,184,245,0.6)' : 'rgba(125,212,160,0.6)')
            : (ot ? 'rgba(122,184,245,0.3)' : 'rgba(125,212,160,0.3)')
    ctx.lineWidth = isActive || isChapterHovered ? 2 : 0.5
    ctx.fill(); ctx.stroke()

    const screenSize = size * camera.getScale(W)
    if (screenSize > 8) {
        ctx.fillStyle = isActive || isChapterHovered
            ? color
            : (ot ? 'rgba(122,184,245,0.6)' : 'rgba(125,212,160,0.6)')
        ctx.font = `${Math.max(7, Math.min(10, screenSize * 0.5))}px IBM Plex Mono`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ch, d.sx, d.sy)
        ctx.textBaseline = 'alphabetic'
    }
    ctx.globalAlpha = 1
}

function drawBookLabel(ctx, d, hasSelection, hoveredBook, hoveredChapterKey, W, maxLabelWidth, fontSize) {
    const { book, ot, isSel, sx, sy } = d
    const isHov = hoveredBook === book || hoveredChapterKey?.startsWith(book + '.')
    const isDimmed = hasSelection && !isSel && !isHov

    const fullName = BOOK_MAP[book] || book
    const color = (isSel || isHov)
        ? (ot ? '#7ab8f5' : '#7dd4a0')
        : (ot ? 'rgba(122,184,245,0.75)' : 'rgba(125,212,160,0.75)')

    const labelY = sy
    const pad = 4
    const boxH = fontSize + pad * 2
    const boxW = maxLabelWidth + pad * 2

    ctx.save()
    ctx.globalAlpha = isDimmed ? 0.85 : 1
    ctx.translate(sx, labelY)
    ctx.rotate(-Math.PI / 2)

    ctx.font = `${isSel || isHov ? 'bold ' : ''}${fontSize}px IBM Plex Mono`

    ctx.fillStyle = (isSel || isHov)
        ? (ot ? 'rgba(122,184,245,0.12)' : 'rgba(125,212,160,0.12)')
        : 'rgba(8,8,8,0.7)'
    ctx.strokeStyle = (isSel || isHov)
        ? (ot ? 'rgba(122,184,245,0.5)' : 'rgba(125,212,160,0.5)')
        : (ot ? 'rgba(122,184,245,0.15)' : 'rgba(125,212,160,0.15)')
    ctx.lineWidth = 1
    // ctx.beginPath()
    // ctx.roundRect(-boxW, -boxH / 2, boxW, boxH, 3)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = color
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(fullName, -pad, 0)

    ctx.restore()
}

export function drawScene({
    ctx, canvasW, canvasH, camera,
    versePositions, bookRanges, chapterData,
    activeVerse, connections, selectedBook,
    hoveredBook, hoveredArc, hoveredChapterKey,
    chapterArcs, chapterArcsSelected,
    focusedConn,
}) {
    const { rotY, rotX, getScale, getOrigin, getBaseY, is3D } = camera
    const baseY = getBaseY(canvasH)
    const scale0 = getScale(canvasW)
    const { ox } = getOrigin(canvasW, canvasH)
    const show3D = is3D()

    const isChMode = activeVerse?.includes('__ch__')
    const isBookMode = activeVerse?.startsWith('__book__') && !isChMode
    const bookCode = activeVerse?.startsWith('__book__')
        ? activeVerse.replace('__book__', '').replace(/__ch__.*$/, '') : null
    const hasSel = !!(activeVerse || selectedBook)

    ctx.clearRect(0, 0, canvasW, canvasH)

    // ── Book bands ─────────────────────────────────────────────
    BOOK_ORDER.forEach((book, idx) => {
        const r = bookRanges.current[book]; if (!r) return
        const sx = ox + r.startXn * scale0
        const ex = ox + r.endXn * scale0
        if (idx % 2 === 0) {
            ctx.fillStyle = isOT(book) ? 'rgba(122,184,245,0.025)' : 'rgba(125,212,160,0.025)'
            ctx.fillRect(sx, 0, ex - sx, canvasH)
        }
    })

    // ── Baseline ───────────────────────────────────────────────
    // ctx.beginPath(); ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1
    // ctx.moveTo(0, baseY); ctx.lineTo(canvasW, baseY); ctx.stroke()

    // // ── OT/NT divider ──────────────────────────────────────────
    // const malR = bookRanges.current['Mal']
    // const mattR = bookRanges.current['Matt']
    // if (malR && mattR) {
    //     const dx = (ox + malR.endXn * scale0 + ox + mattR.startXn * scale0) / 2
    //     ctx.save()
    //     ctx.strokeStyle = 'rgba(212,168,67,0.1)'; ctx.lineWidth = 1
    //     ctx.setLineDash([3, 6])
    //     ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, baseY); ctx.stroke()
    //     ctx.setLineDash([])
    //     ctx.fillStyle = 'rgba(212,168,67,0.3)'; ctx.font = '8px IBM Plex Mono'
    //     ctx.textAlign = 'center'; ctx.fillText('OT·NT', dx, baseY + 26)
    //     ctx.restore()
    // }

    // ── Active chapter keys ────────────────────────────────────
    const activeChKeys = new Set()
    if (hasSel) {
        connections.forEach(c => {
            const add = id => {
                const p = id.split('.')
                if (p[0] && p[1]) activeChKeys.add(`${p[0]}.${p[1]}`)
            }
            add(c.from); add(c.to)
        })
    }

    // ── Max label width — before BOOK_ORDER.forEach ────────────
    const baseFontSize = canvasW < 500 ? 7 : canvasW < 800 ? 9 : 16
    const fontSize = Math.max(6, Math.min(16, Math.floor(baseFontSize * camera.scaleZ.current)))
    const maxLabelWidth = getMaxLabelWidth(ctx, fontSize)
    const pad = 4
    const boxW = maxLabelWidth + pad * 2

    // ── Build drawables ────────────────────────────────────────
    const drawables = []
    const labelPositions = {}

    BOOK_ORDER.forEach(book => {
        const chapters = chapterData.current[book] || []
        const ot = isOT(book)
        const isSel = selectedBook === book || bookCode === book

        if (show3D) {
            chapters.forEach(ch => {
                const scale = getScale(canvasW)
                const { ox: ox2 } = getOrigin(canvasW, canvasH)
                const c = project3D(ch.xn, 0, ch.z, rotY.current, rotX.current, scale, ox2, baseY)
                drawables.push({ type: 'chapter', book, ot, isSel, ...ch, sx: c.sx, sy: c.sy, depth: c.depth })
            })
        }

        const scale = getScale(canvasW)
        const { ox: ox2 } = getOrigin(canvasW, canvasH)
        const lp = project3D(bookRanges.current[book]?.midXn || 0, 0, 0, rotY.current, rotX.current, scale, ox2, baseY)

        drawables.push({ type: 'label', book, ot, isSel, sx: lp.sx, sy: lp.sy, depth: lp.depth })
        labelPositions[book] = { sx: lp.sx, sy: lp.sy - boxW / 2 }
    })

    const chapters = drawables.filter(d => d.type === 'chapter').sort((a, b) => a.depth - b.depth)
    const labels = drawables.filter(d => d.type === 'label')

    chapters.forEach(d => {
        const isActive = activeChKeys.has(`${d.book}.${d.ch}`)
        const isBookHov = hoveredBook === d.book
        const isChHov = hoveredChapterKey === `${d.book}.${d.ch}`
        drawChapterSquare(ctx, d, isActive, isBookHov, isChHov, camera, canvasW, canvasH)
    })

    labels.forEach(d => drawBookLabel(ctx, d, hasSel, hoveredBook, hoveredChapterKey, canvasW, maxLabelWidth, fontSize))

    // ── Arcs ───────────────────────────────────────────────────
    const arcs = hasSel ? chapterArcsSelected : chapterArcs
    if (!hasSel || arcs.length > 0) {
        const maxV = arcs.reduce((m, a) => a.totalVotes > m ? a.totalVotes : m, 1)
        arcs.forEach(chArc => drawChapterArc(
            ctx, chArc,
            isArcHovered(chArc, hoveredArc),
            isArcFocused(chArc, focusedConn),
            maxV, versePositions, chapterData, bookRanges, camera, canvasW, canvasH, hasSel
        ))
    }

    // ── Active verse dot ───────────────────────────────────────
    if (activeVerse && !isBookMode && !isChMode) {
        const s = verseToScreenPos(activeVerse, versePositions, chapterData, bookRanges, camera, canvasW, canvasH)
        const ot = isOT(activeVerse.split('.')[0])
        ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(s.sx, s.sy, 5, 0, Math.PI * 2)
        ctx.fillStyle = ot ? '#7ab8f5' : '#7dd4a0'; ctx.fill()
        ctx.beginPath(); ctx.arc(s.sx, s.sy, 9, 0, Math.PI * 2)
        ctx.strokeStyle = ot ? 'rgba(122,184,245,0.25)' : 'rgba(125,212,160,0.25)'
        ctx.lineWidth = 1.5; ctx.stroke()
    }

    ctx.globalAlpha = 1
    return { labelPositions }
}