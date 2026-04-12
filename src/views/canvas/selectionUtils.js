// Single source of truth for whether a ref is part of the active selection

export function isFeatured(ref, { av, sb, conns }) {
    if (!av && !sb) return true

    if (conns.length > 0) {
        return conns.some(c => {
            const a = c.from || av
            const b = c.to
            if (!a || !b) return false
            return (ref.from === a && ref.to === b) ||
                (ref.from === b && ref.to === a)
        })
    }

    if (sb) return ref.from.split('.')[0] === sb || ref.to.split('.')[0] === sb
    return false
}