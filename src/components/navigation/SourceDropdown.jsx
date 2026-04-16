import BottomSheet from './BottomSheet'
import SheetOption from './SheetOption'

const BIBLE_VERSIONS = [
    { id: 'kjv', label: 'King James Version', short: 'KJV' },
]

function BookIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M2 2.5C2 2.5 4 2 7 2C10 2 12 2.5 12 2.5V11.5C12 11.5 10 11 7 11C4 11 2 11.5 2 11.5V2.5Z"
                stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            <line x1="7" y1="2" x2="7" y2="11" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
        </svg>
    )
}

export { BookIcon }

export default function SourceDropdown({ open, active, onSelect, onClose }) {
    return (
        <BottomSheet open={open} onClose={onClose} title="Bible Translation">
            {BIBLE_VERSIONS.map(v => (
                <SheetOption
                    key={v.id}
                    label={v.label}
                    sublabel={v.short}
                    active={active.id === v.id}
                    onClick={() => { onSelect(v); onClose() }}
                />
            ))}
            <div className="px-5 py-4 border-t border-hairline dark:border-hairline-dark">
                <p className="text-sm text-ghost dark:text-ghost-dark">More translations coming soon</p>
            </div>
        </BottomSheet>
    )
}