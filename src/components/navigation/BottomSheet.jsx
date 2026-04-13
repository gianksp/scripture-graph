export default function BottomSheet({ open, onClose, title, bare, children }) {
    if (!open) return null
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="fixed top-16 left-4 right-4 z-50 rounded-md overflow-hidden
                      bg-surface dark:bg-surface-dark
                      border border-hairline dark:border-hairline-dark
                      shadow-2xl">
                {!bare && (
                    <div className="px-5 py-3 text-sm font-medium tracking-widest text-tertiary dark:text-tertiary-dark uppercase border-b border-hairline dark:border-hairline-dark">
                        {title}
                    </div>
                )}
                {children}
            </div>
        </>
    )
}