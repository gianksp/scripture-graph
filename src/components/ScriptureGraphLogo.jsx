export default function ScriptureGraphLogo({ size = 64 }) {
    const cx = size / 2
    const cy = size / 2
    const s = size / 64 // scale factor

    const nodes = [
        { x: cx, y: cy - 22 * s, r: 3.5 * s, color: '#7ab8f5', opacity: 0.9 },
        { x: cx, y: cy + 22 * s, r: 3.5 * s, color: '#7ab8f5', opacity: 0.9 },
        { x: cx - 22 * s, y: cy, r: 3.5 * s, color: '#7dd4a0', opacity: 0.9 },
        { x: cx + 22 * s, y: cy, r: 3.5 * s, color: '#7dd4a0', opacity: 0.9 },
        { x: cx - 16 * s, y: cy - 16 * s, r: 2.5 * s, color: '#d4a843', opacity: 0.5 },
        { x: cx + 16 * s, y: cy - 16 * s, r: 2 * s, color: '#d4a843', opacity: 0.4 },
        { x: cx + 16 * s, y: cy + 16 * s, r: 3 * s, color: '#d4a843', opacity: 0.5 },
        { x: cx - 16 * s, y: cy + 16 * s, r: 1.5 * s, color: '#d4a843', opacity: 0.35 },
        { x: cx - 28 * s, y: cy - 8 * s, r: 1.5 * s, color: '#7dd4a0', opacity: 0.3 },
        { x: cx + 28 * s, y: cy + 8 * s, r: 1.5 * s, color: '#7ab8f5', opacity: 0.3 },
        { x: cx + 8 * s, y: cy - 28 * s, r: 1.5 * s, color: '#7ab8f5', opacity: 0.3 },
        { x: cx - 8 * s, y: cy + 28 * s, r: 1.5 * s, color: '#7dd4a0', opacity: 0.3 },
    ]

    const edges = [
        [0, 4], [0, 5], [0, 8], [0, 10],
        [1, 6], [1, 7], [1, 9], [1, 11],
        [2, 4], [2, 7], [2, 8],
        [3, 5], [3, 6], [3, 9],
        [4, 7], [5, 6],
    ]

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
            {/* Edges */}
            {edges.map(([a, b], i) => (
                <line
                    key={i}
                    x1={nodes[a].x} y1={nodes[a].y}
                    x2={nodes[b].x} y2={nodes[b].y}
                    stroke="#d4a843"
                    strokeWidth={0.5 * s}
                    opacity="0.15"
                />
            ))}

            {/* Cross arms — vertical */}
            <line
                x1={cx} y1={cy - 22 * s}
                x2={cx} y2={cy + 22 * s}
                stroke="#d4a843"
                strokeWidth={s}
                opacity="0.6"
            />
            {/* Cross arms — horizontal */}
            <line
                x1={cx - 22 * s} y1={cy}
                x2={cx + 22 * s} y2={cy}
                stroke="#d4a843"
                strokeWidth={s}
                opacity="0.6"
            />

            {/* Outer nodes */}
            {nodes.map((n, i) => (
                <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity={n.opacity} />
            ))}

            {/* Center node */}
            <circle cx={cx} cy={cy} r={5 * s} fill="#d4a843" />
        </svg>
    )
}