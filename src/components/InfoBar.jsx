import { useStore, selectFilteredRefs } from '../store/store'
import { isOT } from '../data/bookMap'

export default function InfoBar() {
    const activeVerse = useStore(s => s.activeVerse)
    const connections = useStore(s => s.connections)
    const filteredRefs = useStore(selectFilteredRefs)
    const activeGraph = useStore(s => s.activeGraph)
    const activeVersion = useStore(s => s.activeVersion)

    const isSelected = !!activeVerse
    const refs = isSelected ? connections : filteredRefs

    const total = refs.length
    const otLinks = refs.filter(r => isOT(r.from.split('.')[0]) && isOT(r.to.split('.')[0])).length
    const ntLinks = refs.filter(r => !isOT(r.from.split('.')[0]) && !isOT(r.to.split('.')[0])).length
    const crossLinks = refs.filter(r => isOT(r.from.split('.')[0]) !== isOT(r.to.split('.')[0])).length

    function fmt(n) {
        return n > 9999 ? `${(n / 1000).toFixed(1)}k` : n
    }

    return (
        <div className="shrink-0 flex items-center px-4 h-14 sm:h-16
                    bg-canvas dark:bg-canvas-dark
                    border-t border-hairline dark:border-hairline-dark
                    font-sans">

            {/* Left — title + subtitle */}
            <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm sm:text-xl font-semibold text-primary dark:text-primary-dark leading-tight">
                    {activeVersion.short} · {activeGraph.label}
                </span>
                <span className="text-xs sm:text-sm text-tertiary dark:text-tertiary-dark mt-0.5">
                    OpenBible.info · {fmt(filteredRefs.length)} links
                </span>
            </div>

            <div className="flex-1" />

            {/* Right — stats */}
            <div className="flex items-end gap-4 sm:gap-6">
                <div className="flex flex-col items-center">
                    <span className="text-base sm:text-2xl font-medium text-gold leading-none">{fmt(total)}</span>
                    <span className="text-sm text-tertiary dark:text-tertiary-dark mt-0.5">total</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-base sm:text-2xl font-medium text-ot leading-none">{fmt(otLinks)}</span>
                    <span className="text-sm text-tertiary dark:text-tertiary-dark mt-0.5">OT→OT</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-base sm:text-2xl font-medium text-nt leading-none">{fmt(ntLinks)}</span>
                    <span className="text-sm text-tertiary dark:text-tertiary-dark mt-0.5">NT→NT</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-base sm:text-2xl font-medium text-gold leading-none">{fmt(crossLinks)}</span>
                    <span className="text-sm text-tertiary dark:text-tertiary-dark mt-0.5">Cross</span>
                </div>
            </div>
        </div>
    )
}