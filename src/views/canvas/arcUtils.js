import { proj } from './project'

export function verseToScreen(id, posRef, chDataRef, rangesRef, camera, W, H) {
    const base = id.split('-')[0]
    const p = posRef.current[base]
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W), { ox } = getOrigin(W, H), baseY = getBaseY(H)
    if (p) {
        const book = base.split('.')[0]
        const ch = parseInt(base.split('.')[1]) || 1
        const chEntry = chDataRef.current[book]?.find(c => c.ch === ch)
        const xn = chEntry ? chEntry.xn : p.xn
        const z = chEntry ? chEntry.z : p.z
        const r = proj(xn, 0, z, rotY.current, rotX.current, scale, ox, baseY)
        return { sx: r.sx, sy: r.sy }
    }
    const book = base.split('.')[0]
    const rng = rangesRef.current[book]
    return { sx: ox + (rng?.midXn || 0) * scale, sy: baseY }
}

export function arcEndpoints(ref, posRef, chDataRef, rangesRef, camera, W, H) {
    const s1 = verseToScreen(ref.from, posRef, chDataRef, rangesRef, camera, W, H)
    const s2 = verseToScreen(ref.to, posRef, chDataRef, rangesRef, camera, W, H)
    const baseY = camera.getBaseY(H)
    const span = Math.abs(s2.sx - s1.sx)
    const aH = Math.min(Math.pow(span, 0.8) * 2.2, baseY * 0.97)
    return {
        x1: s1.sx, y1: s1.sy, x2: s2.sx, y2: s2.sy,
        cx: (s1.sx + s2.sx) / 2, cy: s1.sy - aH,
    }
}

export function findClosestArc(mx, my, refs, posRef, chDataRef, rangesRef, camera, W, H, filter) {
    let closest = null, minD = 14
    refs.forEach(ref => {
        if (filter && !filter(ref)) return
        const ep = arcEndpoints(ref, posRef, chDataRef, rangesRef, camera, W, H)
        for (let t = 0; t <= 1; t += 0.05) {
            const t1 = 1 - t
            const bx = t1 * t1 * ep.x1 + 2 * t1 * t * ep.cx + t * t * ep.x2
            const by = t1 * t1 * ep.y1 + 2 * t1 * t * ep.cy + t * t * ep.y2
            const d = Math.sqrt((bx - mx) ** 2 + (by - my) ** 2)
            if (d < minD) { minD = d; closest = { ref, ep } }
        }
    })
    return closest
}