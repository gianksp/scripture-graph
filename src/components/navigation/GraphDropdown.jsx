import BottomSheet from './BottomSheet'
import SheetOption from './SheetOption'

const GRAPH_TYPES = [
    { id: 'cross-references', label: 'Cross References' },
]

function GraphIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="2" cy="3" r="1.5" fill="currentColor" opacity="0.6" />
            <circle cx="12" cy="3" r="1.5" fill="currentColor" opacity="0.6" />
            <circle cx="2" cy="11" r="1.5" fill="currentColor" opacity="0.6" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.6" />
            <line x1="7" y1="7" x2="2" y2="3" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            <line x1="7" y1="7" x2="12" y2="3" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            <line x1="7" y1="7" x2="2" y2="11" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            <line x1="7" y1="7" x2="12" y2="11" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        </svg>
    )
}

export { GraphIcon }

export default function GraphDropdown({ open, active, onSelect, onClose }) {
    return (
        <BottomSheet open={open} onClose={onClose} title="Graph Type">
            {GRAPH_TYPES.map(g => (
                <SheetOption
                    key={g.id}
                    label={g.label}
                    active={active.id === g.id}
                    onClick={() => { onSelect(g); onClose() }}
                />
            ))}
            <div className="px-5 py-4 border-t border-hairline dark:border-hairline-dark">
                <p className="text-sm text-tertiary dark:text-tertiary-dark">More graph types coming soon</p>
            </div>
        </BottomSheet>
    )
}