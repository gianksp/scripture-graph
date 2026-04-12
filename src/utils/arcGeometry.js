import { project3D } from './project'

export function verseToScreenPos(verseId, versePositions, chapterData, bookRanges, camera, W, H) {
    const baseId = verseId.split('-')[0]
    const pos = versePositions.current[baseId]
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W)
    const { ox } = getOrigin(W, H)
    const baseY = getBaseY(H)

    if (pos) {
        const book = baseId.split('.')[0]
        const chapter = parseInt(baseId.split('.')[1]) || 1
        const chEntry = chapterData.current[book]?.find(c => c.ch === chapter)
        const worldX = chEntry ? chEntry.xn : pos.xn
        const worldZ = chEntry ? chEntry.z : pos.z
        const p = project3D(worldX, 0, worldZ, rotY.current, rotX.current, scale, ox, baseY)
        return { sx: p.sx, sy: p.sy }
    }

    const book = baseId.split('.')[0]
    const range = bookRanges.current[book]
    return { sx: ox + (range?.midXn || 0) * scale, sy: baseY }
}

export function computeArcEndpoints(fromId, toId, versePositions, chapterData, bookRanges, camera, W, H) {
    const start = verseToScreenPos(fromId, versePositions, chapterData, bookRanges, camera, W, H)
    const end = verseToScreenPos(toId, versePositions, chapterData, bookRanges, camera, W, H)
    const baseY = camera.getBaseY(H)
    const span = Math.abs(end.sx - start.sx)
    const maxSpan = camera.getScale(W) * 1.8
    const height = (span / maxSpan) * baseY * 0.75
    const pull = 0.25
    const peakY = start.sy - height
    return {
        x1: start.sx, y1: start.sy,
        x2: end.sx, y2: end.sy,
        cp1x: start.sx + (end.sx - start.sx) * pull, cp1y: peakY,
        cp2x: start.sx + (end.sx - start.sx) * (1 - pull), cp2y: peakY,
    }
}

export function groupRefsByChapterPair(verseRefs) {
    const map = new Map()
    verseRefs.forEach(ref => {
        const fromBase = ref.from.split('-')[0]
        const toBase = ref.to.split('-')[0]
        const fromCh = fromBase.split('.').slice(0, 2).join('.')
        const toCh = toBase.split('.').slice(0, 2).join('.')
        const [a, b] = fromCh < toCh ? [fromCh, toCh] : [toCh, fromCh]
        const key = `${a}|${b}`
        if (!map.has(key)) map.set(key, { fromChapter: a, toChapter: b, totalVotes: 0, versePairs: [] })
        const entry = map.get(key)
        entry.totalVotes += ref.votes
        entry.versePairs.push({ from: fromBase, to: toBase, votes: ref.votes })
    })
    return [...map.values()]
}

export function deduplicateConnections(connections) {
    const map = new Map()
    connections.forEach(c => {
        if (!c.from || !c.to) return
        const from = c.from.split('-')[0]
        const to = c.to.split('-')[0]
        const key = [from, to].sort().join('|')
        const ex = map.get(key)
        if (!ex || c.votes > ex.votes) map.set(key, { ...c, from, to })
    })
    return [...map.values()]
}

export function findClosestChapterArc(mouseX, mouseY, chapterArcs, versePositions, chapterData, bookRanges, camera, W, H, hitRadius = 40) {
    let closestArc = null
    let minDist = Infinity

    chapterArcs.forEach(chArc => {
        const ep = computeArcEndpoints(
            `${chArc.fromChapter}.1`, `${chArc.toChapter}.1`,
            versePositions, chapterData, bookRanges, camera, W, H
        )
        for (let t = 0; t <= 1; t += 0.02) {
            const t1 = 1 - t
            const bx = t1 ** 3 * ep.x1 + 3 * t1 ** 2 * t * ep.cp1x + 3 * t1 * t ** 2 * ep.cp2x + t ** 3 * ep.x2
            const by = t1 ** 3 * ep.y1 + 3 * t1 ** 2 * t * ep.cp1y + 3 * t1 * t ** 2 * ep.cp2y + t ** 3 * ep.y2
            const d = Math.sqrt((bx - mouseX) ** 2 + (by - mouseY) ** 2)
            if (d < hitRadius && d < minDist) { minDist = d; closestArc = { chArc, ep } }
        }
    })

    return closestArc
}