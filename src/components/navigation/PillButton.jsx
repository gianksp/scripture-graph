export const PillButton = ({ onClick, active, icon, label, title }) => {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2.5 rounded-full transition-colors active:opacity-70
        ${active
                    ? 'bg-gold text-canvas dark:text-canvas-dark'
                    : 'text-tertiary dark:text-tertiary-dark hover:bg-elevated dark:hover:bg-elevated-dark'
                }`}
        >
            <span className="flex items-center gap-1.5">
                {icon}
                <span className="hidden sm:block text-sm font-medium">{label}</span>
            </span>
        </button>
    )
}
