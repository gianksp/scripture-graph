import { project3D } from './project'
import { BOOK_ORDER } from '../data/bookMap'

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
    const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
    const scale = getScale(W)
    const { ox } = getOrigin(W, H)
    const baseY = getBaseY(H)

    function getChapterWorldPos(id) {
        const base = id.split('-')[0]
        const book = base.split('.')[0]
        const chapter = parseInt(base.split('.')[1]) || 1
        const chEntry = chapterData.current[book]?.find(c => c.ch === chapter)
        if (chEntry) return { xn: chEntry.xn, z: chEntry.z }
        return { xn: bookRanges.current[book]?.midXn ?? 0, z: 0 }
    }

    const from = getChapterWorldPos(fromId)
    const to = getChapterWorldPos(toId)
    const dx = to.xn - from.xn
    const dz = to.z - from.z

    // Height determined by number of books between from and to
    const fromBook = fromId.split('-')[0].split('.')[0]
    const toBook = toId.split('-')[0].split('.')[0]
    const fromIdx = BOOK_ORDER.indexOf(fromBook)
    const toIdx = BOOK_ORDER.indexOf(toBook)
    const bookSpan = Math.abs(toIdx - fromIdx)
    const worldHeight = (bookSpan / (BOOK_ORDER.length - 1)) * 0.75

    const s1 = project3D(from.xn, 0, from.z, rotY.current, rotX.current, scale, ox, baseY)
    const s2 = project3D(to.xn, 0, to.z, rotY.current, rotX.current, scale, ox, baseY)
    const cp1 = project3D(from.xn + dx * 0.25, worldHeight, from.z + dz * 0.25, rotY.current, rotX.current, scale, ox, baseY)
    const cp2 = project3D(from.xn + dx * 0.75, worldHeight, from.z + dz * 0.75, rotY.current, rotX.current, scale, ox, baseY)

    return {
        x1: s1.sx, y1: s1.sy,
        x2: s2.sx, y2: s2.sy,
        cp1x: cp1.sx, cp1y: cp1.sy,
        cp2x: cp2.sx, cp2y: cp2.sy,
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