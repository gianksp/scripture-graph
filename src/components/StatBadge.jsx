export default function StatBadge({ label, value, color }) {
    const display = value > 9999 ? `${(value / 1000).toFixed(1)}k` : value
    return (
        <div className="text-center min-w-[40px]">
            <div className="text-xl font-medium" style={{ color }}>{display}</div>
            <div className="text-2xs text-tertiary dark:text-tertiary-dark mt-0.5">{label}</div>
        </div>
    )
}