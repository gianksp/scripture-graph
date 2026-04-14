export default function StatBadge({ label, value, color, compact }) {
    const display = value > 9999 ? `${(value / 1000).toFixed(1)}k` : value
    return (
        <div className="text-center" style={{ minWidth: compact ? 28 : 40 }}>
            <div className={`font-medium ${compact ? 'text-sm' : 'text-xl'}`} style={{ color }}>
                {display}
            </div>
            <div className="text-2xs text-tertiary dark:text-tertiary-dark mt-0.5">{label}</div>
        </div>
    )
}