import { deduplicateConnections } from './arcGeometry'

export function buildBookConnections(book, allRefs) {
    const raw = allRefs
        .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
        .map(r => {
            const fb = r.from.split('.')[0]
            return { from: fb === book ? r.from : r.to, to: fb === book ? r.to : r.from, votes: r.votes }
        })
    return deduplicateConnections(raw).sort((a, b) => b.votes - a.votes)
}

export function buildChapterConnections(book, chapter, allRefs) {
    const prefix = `${book}.${chapter}.`
    const raw = allRefs
        .filter(r => r.from.startsWith(prefix) || r.to.startsWith(prefix))
        .map(r => ({
            from: r.from.startsWith(prefix) ? r.from : r.to,
            to: r.from.startsWith(prefix) ? r.to : r.from,
            votes: r.votes,
        }))
    return deduplicateConnections(raw).sort((a, b) => b.votes - a.votes)
}

export function buildVerseConnections(verseId, allRefs) {
    const raw = allRefs
        .filter(r => r.from === verseId || r.to === verseId)
        .map(r => ({ from: verseId, to: r.from === verseId ? r.to : r.from, votes: r.votes }))
    return deduplicateConnections(raw).sort((a, b) => b.votes - a.votes)
}

export function buildRangeConnections(book, chapter, verseStart, verseEnd, allRefs) {
    const inRange = id => {
        const p = id.split('.')
        return p[0] === book && parseInt(p[1]) === chapter &&
            parseInt(p[2]) >= verseStart && parseInt(p[2]) <= verseEnd
    }
    const raw = allRefs
        .filter(r => inRange(r.from) || inRange(r.to))
        .map(r => ({
            from: inRange(r.from) ? r.from : r.to,
            to: inRange(r.from) ? r.to : r.from,
            votes: r.votes,
        }))
    return deduplicateConnections(raw).sort((a, b) => b.votes - a.votes)
}