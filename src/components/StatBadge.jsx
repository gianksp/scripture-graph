export default function StatBadge({ label, value, color }) {
    const display = value > 9999 ? `${(value / 1000).toFixed(1)}k` : value
    return (
        <div style={{ textAlign: 'center', minWidth: 48 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 17, color: color || '#d4a843', fontWeight: 500 }}>{display}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#555', marginTop: 1 }}>{label}</div>
        </div>
    )
}