/**
 * Returns true if a verse-level ref belongs to the active selection.
 * Matches at chapter level so all verse pairs within a selected chapter pair are included.
 */
export function isRefFeatured(ref, { activeVerse, selectedBook, connections }) {
    if (!activeVerse && !selectedBook) return true

    if (connections.length > 0) {
        const refFromCh = ref.from.split('-')[0].split('.').slice(0, 2).join('.')
        const refToCh = ref.to.split('-')[0].split('.').slice(0, 2).join('.')
        return connections.some(c => {
            const cFrom = c.from.split('-')[0].split('.').slice(0, 2).join('.')
            const cTo = c.to.split('-')[0].split('.').slice(0, 2).join('.')
            return (refFromCh === cFrom && refToCh === cTo) ||
                (refFromCh === cTo && refToCh === cFrom)
        })
    }

    if (selectedBook) {
        return ref.from.split('.')[0] === selectedBook ||
            ref.to.split('.')[0] === selectedBook
    }

    return false
}