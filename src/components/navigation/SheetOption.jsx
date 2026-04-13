export default function SheetOption({ label, sublabel, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors
        border-t border-hairline dark:border-hairline-dark
        ${active
                    ? 'bg-elevated dark:bg-elevated-dark'
                    : 'hover:bg-elevated dark:hover:bg-elevated-dark'
                }`}
        >
            <div className="flex flex-col gap-0.5">
                <span className={`text-sm ${active ? 'text-gold' : 'text-primary dark:text-primary-dark'}`}>
                    {label}
                </span>
                {sublabel && (
                    <span className="text-2xs text-tertiary dark:text-tertiary-dark">{sublabel}</span>
                )}
            </div>
            {active && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="#d4a843" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    )
}