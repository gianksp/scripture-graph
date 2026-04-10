export default function Tooltip({ x, y, children, visible }) {
  if (!visible) return null
  return (
    <div
      className="fixed z-50 bg-surface border border-border2 rounded-lg px-4 py-3 text-xs pointer-events-none max-w-xs leading-relaxed"
      style={{ left: Math.min(x + 16, window.innerWidth - 300), top: y - 10 }}
    >
      {children}
    </div>
  )
}