import { proj } from './project'
import { BOOK_ORDER, BOOK_MAP, isOT, arcColor, ABBREV } from '../../data/bookMap'
import { arcEndpoints, verseToScreen } from './arcUtils'
import { isFeatured } from './selectionUtils'

const STRIP = 40

function worldSquare(ctx, xn, z, size, camera, W, H) {
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W), { ox } = getOrigin(W, H), baseY = getBaseY(H)
    const h = size / 2
    const corners = [
        proj(xn - h, 0, z - h, rotY.current, rotX.current, scale, ox, baseY),
        proj(xn + h, 0, z - h, rotY.current, rotX.current, scale, ox, baseY),
        proj(xn + h, 0, z + h, rotY.current, rotX.current, scale, ox, baseY),
        proj(xn - h, 0, z + h, rotY.current, rotX.current, scale, ox, baseY),
    ]
    ctx.beginPath()
    ctx.moveTo(corners[0].sx, corners[0].sy)
    corners.slice(1).forEach(c => ctx.lineTo(c.sx, c.sy))
    ctx.closePath()
}

function drawChapter(ctx, d, hasSel, hb, endpointChs, camera, W, H, hovCh) {
  const color    = d.ot?'#7ab8f5':'#7dd4a0'
  const isActive = endpointChs.has(`${d.book}.${d.ch}`)
  const isHovCh  = hovCh===`${d.book}.${d.ch}`
  const isHovBook= hb===d.book

  ctx.globalAlpha= 1

  worldSquare(ctx,d.xn,d.z,d.size,camera,W,H)
  ctx.fillStyle  = isActive||isHovCh
    ?(d.ot?'rgba(122,184,245,0.15)':'rgba(125,212,160,0.15)')
    :(d.ot?'rgba(122,184,245,0.02)':'rgba(125,212,160,0.02)')
  ctx.strokeStyle= isActive||isHovCh
    ?(d.ot?'rgba(122,184,245,0.95)':'rgba(125,212,160,0.95)')
    :isHovBook
      ?(d.ot?'rgba(122,184,245,0.5)':'rgba(125,212,160,0.5)')
      :(d.ot?'rgba(122,184,245,0.15)':'rgba(125,212,160,0.15)')
  ctx.lineWidth= isActive||isHovCh?2:0.5
  ctx.fill(); ctx.stroke()

  const screenSize=d.size*camera.getScale(W)
  if (screenSize>8) {
    ctx.fillStyle   =isActive||isHovCh?color:(d.oft?'rgba(122,184,245,0.5)':'rgba(125,212,160,0.5)')
    ctx.font        =`${Math.max(7,Math.min(10,screenSize*0.5))}px IBM Plex Mono`
    ctx.textAlign   ='center'; ctx.textBaseline='middle'
    ctx.fillText(d.ch,d.sx,d.sy); ctx.textBaseline='alphabetic'
  }
  ctx.globalAlpha=1
}

function drawLabel(ctx, d, hasSel, hb, W, hovCh) {
    const dimmed = hasSel && !d.isSel
   const isHov = hb===d.book || hovCh?.startsWith(d.book+'.')
    const label = d.book.slice(0, 3)
    
    ctx.globalAlpha = (dimmed && !isHov) ? 0.2 : 1
    ctx.font = (d.isSel || isHov) ? 'bold 11px IBM Plex Mono' : '10px IBM Plex Mono'
    const tw = ctx.measureText(label).width
    const tx = Math.min(Math.max(d.sx, 60), W - 60)

    ctx.fillStyle = (d.isSel || isHov)
        ? (d.ot ? 'rgba(122,184,245,0.15)' : 'rgba(125,212,160,0.15)')
        : 'rgba(8,8,8,0.85)'
    ctx.beginPath(); ctx.roundRect(tx - tw / 2 - 8, d.sy - 16, tw + 16, 22, 4); ctx.fill()
    ctx.strokeStyle = (d.isSel || isHov)
        ? (d.ot ? 'rgba(122,184,245,0.5)' : 'rgba(125,212,160,0.5)')
        : (d.ot ? 'rgba(122,184,245,0.2)' : 'rgba(125,212,160,0.2)')
    ctx.lineWidth = 1; ctx.stroke()

    const lc = (d.isSel || isHov)
        ? (d.ot ? '#7ab8f5' : '#7dd4a0')
        : (d.ot ? 'rgba(122,184,245,0.85)' : 'rgba(125,212,160,0.85)')
    ctx.fillStyle = lc; ctx.textAlign = 'center'
    ctx.fillText(label, tx, d.sy - 2)

    ctx.beginPath(); ctx.strokeStyle = lc
    ctx.globalAlpha = (d.isSel || isHov) ? 0.7 : 0.25; ctx.lineWidth = 1
    ctx.moveTo(tx - tw / 2, d.sy); ctx.lineTo(tx + tw / 2, d.sy); ctx.stroke()
    ctx.globalAlpha = 1
}

function drawArcs(ctx, refs, conns, av, sb, ha, hasSel, maxV, posRef, chDataRef, rangesRef, camera, W, H) {
    const hovFrom = ha?.ref?.from, hovTo = ha?.ref?.to

    if (!hasSel) {
        refs.forEach(ref => {
            const isHov = ha && ref.from === hovFrom && ref.to === hovTo
            const related = !isHov && ha
                ? (ref.from === hovFrom || ref.to === hovFrom || ref.from === hovTo || ref.to === hovTo)
                : false
            const ep = arcEndpoints(ref, posRef, chDataRef, rangesRef, camera, W, H)
            const col = arcColor(ref.from.split('.')[0], ref.to.split('.')[0])
            const alpha = isHov ? 1 : related ? 0.6 + (ref.votes / maxV) * 0.4 : 0.08 + (ref.votes / maxV) * 0.5
            const lw = isHov ? 2.5 : related ? 1.5 + (ref.votes / maxV) * 1.5 : 0.4 + (ref.votes / maxV) * 1.1
            ctx.beginPath(); ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = lw
            ctx.moveTo(ep.x1, ep.y1); ctx.quadraticCurveTo(ep.cx, ep.cy, ep.x2, ep.y2); ctx.stroke()
        })
    }

    if (hasSel) {
        conns.forEach(conn => {
            const fid = conn.from || av, tid = conn.to; if (!fid || !tid) return
            const isHov = ha && fid === hovFrom && tid === hovTo
            const ep = arcEndpoints({ from: fid, to: tid }, posRef, chDataRef, rangesRef, camera, W, H)
            const foc = window.__focusedConn &&
                ((fid === window.__focusedConn.from && tid === window.__focusedConn.to) ||
                    (fid === window.__focusedConn.to && tid === window.__focusedConn.from))
            const col = arcColor(fid.split('.')[0], tid.split('.')[0])
            const alpha = isHov ? 1 : foc ? 1 : 0.55 + (conn.votes / maxV) * 0.45
            const lw = isHov ? 2.5 : foc ? 3 : 1.2 + (conn.votes / maxV) * 2.0
            ctx.beginPath()
            ctx.strokeStyle = foc && !isHov ? '#fff' : col
            ctx.globalAlpha = alpha; ctx.lineWidth = lw
            ctx.moveTo(ep.x1, ep.y1); ctx.quadraticCurveTo(ep.cx, ep.cy, ep.x2, ep.y2); ctx.stroke()
        })
    }

    ctx.globalAlpha = 1
}

export function drawScene({ ctx, W, H, camera, posRef, rangesRef, chDataRef, refs, maxV, av, conns, sb, hb, ha, hovCh  }) {
    const { rotY, rotX, getScale, getOrigin, getBaseY, is3D } = camera
    const baseY = getBaseY(H)
    const scale0 = getScale(W)
    const { ox: ox0 } = getOrigin(W, H)
    const show3D = is3D()
    const hasSel = !!(av || sb)

    const isBookMode = av?.startsWith('__book__')
    const isChMode = av?.includes('__ch__')
    const bookCode = av?.startsWith('__book__') ? av.replace('__book__', '').replace(/__ch__.*$/, '') : null
    const chNum = isChMode ? parseInt(av.split('__ch__')[1]) : null

    ctx.clearRect(0, 0, W, H)

    // ── Bands ────────────────────────────────────────────────
    BOOK_ORDER.forEach((book, idx) => {
        const r = rangesRef.current[book]; if (!r) return
        const sx = ox0 + r.startXn * scale0, ex = ox0 + r.endXn * scale0
        if (idx % 2 === 0) {
            ctx.fillStyle = isOT(book) ? 'rgba(122,184,245,0.025)' : 'rgba(125,212,160,0.025)'
            ctx.fillRect(sx, 0, ex - sx, H)
        }
    })

    // ── Baseline ─────────────────────────────────────────────
    ctx.beginPath(); ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1
    ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke()

    // ── OT/NT divider ────────────────────────────────────────
    const mal = rangesRef.current['Mal'], matt = rangesRef.current['Matt']
    if (mal && matt) {
        const dx = (ox0 + mal.endXn * scale0 + ox0 + matt.startXn * scale0) / 2
        ctx.save()
        ctx.strokeStyle = 'rgba(212,168,67,0.1)'; ctx.lineWidth = 1
        ctx.setLineDash([3, 6]); ctx.beginPath()
        ctx.moveTo(dx, 0); ctx.lineTo(dx, baseY); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(212,168,67,0.3)'; ctx.font = '8px IBM Plex Mono'
        ctx.textAlign = 'center'; ctx.fillText('OT·NT', dx, baseY + 26); ctx.restore()
    }

    // ── Active chapters ───────────────────────────────────────
    const endpointChs = new Set()
    if (hasSel) {
        conns.forEach(c => {
            const add = id => { if (!id) return; const p = id.split('.'); if (p[0] && p[1]) endpointChs.add(`${p[0]}.${p[1]}`) }
            add(c.from); add(c.to)
        })
    }

    // ── Build drawables ───────────────────────────────────────
    const drawables = [], labelPositions = {}

    BOOK_ORDER.forEach(book => {
        const chs = chDataRef.current[book] || []
        const ot = isOT(book)
        const isSel = sb === book || bookCode === book

        if (show3D) {
            chs.forEach(({ ch, xn, z, size }) => {
                const scale = getScale(W), { ox } = getOrigin(W, H)
                const center = proj(xn, 0, z, rotY.current, rotX.current, scale, ox, baseY)
                drawables.push({ type: 'ch', book, ch, ot, size, isSel, xn, z, sx: center.sx, sy: center.sy, depth: center.depth })
            })
        }

        const scale = getScale(W), { ox } = getOrigin(W, H)
        const midXn = rangesRef.current[book]?.midXn || 0
        const ld = proj(midXn, -0.035, 0, rotY.current, rotX.current, scale, ox, baseY)
        drawables.push({ type: 'lbl', book, ot, isSel, sx: ld.sx, sy: ld.sy, depth: ld.depth })
        labelPositions[book] = { sx: ld.sx, sy: ld.sy }
    })

    const lbls = drawables.filter(d => d.type === 'lbl')
    const rest = drawables.filter(d => d.type === 'ch').sort((a, b) => a.depth - b.depth)

        ;[...rest, ...lbls].forEach(d => {
            if (d.type==='ch') drawChapter(ctx,d,hasSel,hb,endpointChs,camera,W,H,hovCh)
            else drawLabel(ctx,d,hasSel,hb,W,hovCh)
        })

    // ── Active verse dot ──────────────────────────────────────
    if (av && !isBookMode && !isChMode) {
        const s = verseToScreen(av, posRef, chDataRef, rangesRef, camera, W, H)
        const ot = isOT(av.split('.')[0])
        ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(s.sx, s.sy, 5, 0, Math.PI * 2)
        ctx.fillStyle = ot ? '#7ab8f5' : '#7dd4a0'; ctx.fill()
        ctx.beginPath(); ctx.arc(s.sx, s.sy, 9, 0, Math.PI * 2)
        ctx.strokeStyle = ot ? 'rgba(122,184,245,0.25)' : 'rgba(125,212,160,0.25)'
        ctx.lineWidth = 1.5; ctx.stroke()
    }

    // ── Arcs ─────────────────────────────────────────────────
    drawArcs(ctx, refs, conns, av, sb, ha, hasSel, maxV, posRef, chDataRef, rangesRef, camera, W, H)

    return { labelPositions }
}