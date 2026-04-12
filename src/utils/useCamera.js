import { useRef, useCallback, useEffect } from 'react'

export const DEFAULT_PAN_Y = () => 0
const STRIP_HEIGHT = 40

export function useCamera(scheduleDraw) {
  const rotY = useRef(0)
  const rotX = useRef(0)
  const scaleZ = useRef(1)
  const panX = useRef(0)
  const panY = useRef(DEFAULT_PAN_Y())
  const isDragging = useRef(false)
  const dragButton = useRef(0)
  const lastDragPos = useRef({ x: 0, y: 0 })
  const pinchDist = useRef(null)

  const getScale = useCallback((W) => W * 0.38 * scaleZ.current, [])
  const getOrigin = useCallback((W, H) => ({ ox: W / 2 + panX.current, oy: H / 2 + panY.current }), [])
  const getBaseY = useCallback((H) => H - STRIP_HEIGHT + panY.current, [])
  const is3D = useCallback(() => rotX.current !== 0 || rotY.current !== 0, [])

  useEffect(() => {
    function onReset() {
      rotY.current = 0; rotX.current = 0; scaleZ.current = 1
      panX.current = 0; panY.current = DEFAULT_PAN_Y()
      scheduleDraw()
    }
    window.addEventListener('view:reset', onReset)
    return () => window.removeEventListener('view:reset', onReset)
  }, [scheduleDraw])

  const onWheel = useCallback(e => {
    e.preventDefault()
    scaleZ.current = Math.max(0.3, Math.min(5, scaleZ.current + (e.deltaY > 0 ? -0.08 : 0.08)))
    scheduleDraw()
  }, [scheduleDraw])

  const onMouseDown = useCallback(e => {
    e.preventDefault()
    isDragging.current = true
    dragButton.current = e.button
    lastDragPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback(e => {
    if (!isDragging.current) return false
    const dx = e.clientX - lastDragPos.current.x
    const dy = e.clientY - lastDragPos.current.y
    lastDragPos.current = { x: e.clientX, y: e.clientY }
    if (dragButton.current === 2) {
      rotY.current += dx * 0.005
      rotX.current = Math.max(-1.2, Math.min(1.2, rotX.current + dy * 0.005))
    } else if (dragButton.current === 1) {
      panX.current += dx
      panY.current += dy
    }
    scheduleDraw()
    return true
  }, [scheduleDraw])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  const onTouchStart = useCallback(e => {
    if (e.touches.length === 1) {
      isDragging.current = true
      dragButton.current = 1
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2) {
      pinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
    }
  }, [])

  const onTouchMove = useCallback(e => {
    e.preventDefault()
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      if (pinchDist.current !== null) {
        scaleZ.current = Math.max(0.3, Math.min(5, scaleZ.current + (d - pinchDist.current) * 0.006))
        scheduleDraw()
      }
      pinchDist.current = d
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastDragPos.current.x
      const dy = e.touches[0].clientY - lastDragPos.current.y
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      panX.current += dx
      panY.current += dy
      scheduleDraw()
    }
  }, [scheduleDraw])

  const onTouchEnd = useCallback(() => {
    isDragging.current = false
    pinchDist.current = null
  }, [])

  return {
    rotY, rotX, scaleZ, panX, panY,
    isDragging, dragButton,
    getScale, getOrigin, getBaseY, is3D,
    onWheel, onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove, onTouchEnd,
  }
}