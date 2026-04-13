import { project3D } from './project'
import { BOOK_ORDER } from '../data/bookMap'
import { computeArcEndpoints } from './arcGeometry'

const SAMPLES = 40

export function buildChapterCornerCache(chapterData, camera, W, H) {
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W)
    const { ox } = getOrigin(W, H)
    const baseY = getBaseY(H)
    const ry = rotY.current, rx = rotX.current

    const meta = [], floats = []

    for (const book of BOOK_ORDER) {
        for (const { ch, xn, z, size } of chapterData.current[book] || []) {
            const half = size / 2
            const corners = [
                project3D(xn - half, 0, z - half, ry, rx, scale, ox, baseY),
                project3D(xn + half, 0, z - half, ry, rx, scale, ox, baseY),
                project3D(xn + half, 0, z + half, ry, rx, scale, ox, baseY),
                project3D(xn - half, 0, z + half, ry, rx, scale, ox, baseY),
            ]
            for (const c of corners) floats.push(c.sx, c.sy)
            const center = project3D(xn, 0, z, ry, rx, scale, ox, baseY)
            meta.push({ book, ch, xn, z, size, sx: center.sx, sy: center.sy, depth: center.depth })
        }
    }

    return { corners: new Float32Array(floats), meta }
}

export function pointInCachedPolygon(px, py, corners, idx) {
    const base = idx * 8
    let inside = false
    for (let i = 0, j = 3; i < 4; j = i++) {
        const xi = corners[base + i * 2], yi = corners[base + i * 2 + 1]
        const xj = corners[base + j * 2], yj = corners[base + j * 2 + 1]
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
            inside = !inside
    }
    return inside
}

export function buildArcSampleCache(chapterArcs, versePositions, chapterData, bookRanges, camera, W, H) {
    const floats = new Float32Array(chapterArcs.length * SAMPLES * 2)
    for (let a = 0; a < chapterArcs.length; a++) {
        const ep = computeArcEndpoints(
            `${chapterArcs[a].fromChapter}.1`, `${chapterArcs[a].toChapter}.1`,
            versePositions, chapterData, bookRanges, camera, W, H
        )
        const base = a * SAMPLES * 2
        for (let s = 0; s < SAMPLES; s++) {
            const t = s / (SAMPLES - 1), t1 = 1 - t
            floats[base + s * 2] = t1 ** 3 * ep.x1 + 3 * t1 ** 2 * t * ep.cp1x + 3 * t1 * t ** 2 * ep.cp2x + t ** 3 * ep.x2
            floats[base + s * 2 + 1] = t1 ** 3 * ep.y1 + 3 * t1 ** 2 * t * ep.cp1y + 3 * t1 * t ** 2 * ep.cp2y + t ** 3 * ep.y2
        }
    }
    return floats
}

export function hitTestArcSamples(mouseX, mouseY, arcSamples, hitRadius = 40) {
    const hr2 = hitRadius * hitRadius
    let bestIdx = -1, bestDist2 = Infinity
    const arcCount = arcSamples.length / (SAMPLES * 2)
    for (let a = 0; a < arcCount; a++) {
        const base = a * SAMPLES * 2
        for (let s = 0; s < SAMPLES; s++) {
            const dx = arcSamples[base + s * 2] - mouseX
            const dy = arcSamples[base + s * 2 + 1] - mouseY
            const d2 = dx * dx + dy * dy
            if (d2 < hr2 && d2 < bestDist2) { bestDist2 = d2; bestIdx = a }
        }
    }
    return bestIdx
}