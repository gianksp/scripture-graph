import { useEffect, useRef } from 'react'

export default function Loader({ visible }) {
    const barRef = useRef(null)

    useEffect(() => {
        if (!visible || !barRef.current) return
        // Restart animation by removing and re-adding the element
        const bar = barRef.current
        bar.style.display = 'none'
        requestAnimationFrame(() => {
            bar.style.display = 'block'
        })
    }, [visible])

    return (
        <div ref={barRef} className="rendering-bar" />
    )
}