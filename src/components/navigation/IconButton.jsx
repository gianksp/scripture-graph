export const IconButton = ({ onClick, active, children, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors active:opacity-70
        ${active
          ? 'bg-gold text-canvas dark:text-canvas-dark'
          : 'text-tertiary dark:text-tertiary-dark hover:bg-elevated dark:hover:bg-elevated-dark'
        }`}
    >
      {children}
    </button>
  )
}