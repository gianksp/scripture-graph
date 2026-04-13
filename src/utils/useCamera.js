import { useRef, useCallback, useEffect } from 'react'

const STRIP_HEIGHT = 40

export function useCamera(scheduleDraw, resetSignal) {
  const rotY = useRef(0)
  const rotX = useRef(0)
  const scaleZ = useRef(1)
  const panX = useRef(0)
  const panY = useRef(0)
  const version = useRef(0) // increments on every camera change

  const isDragging = useRef(false)
  const dragButton = useRef(0)
  const lastDragPos = useRef({ x: 0, y: 0 })
  const pinchDist = useRef(null)

  const bump = useCallback(() => { version.current++ }, [])

  const getScale = useCallback((W) => W * 0.38 * scaleZ.current, [])
  const getOrigin = useCallback((W, H) => ({ ox: W / 2 + panX.current, oy: H / 2 + panY.current }), [])
  const getBaseY = useCallback((H) => H - STRIP_HEIGHT + panY.current, [])
  const is3D = useCallback(() => rotX.current !== 0 || rotY.current !== 0, [])

  useEffect(() => {
    if (resetSignal === 0) return
    rotY.current = 0; rotX.current = 0; scaleZ.current = 1
    panX.current = 0; panY.current = 0
    bump(); scheduleDraw()
  }, [resetSignal])

  const onWheel = useCallback(e => {
    e.preventDefault()
    scaleZ.current = Math.max(0.3, Math.min(5, scaleZ.current + (e.deltaY > 0 ? -0.08 : 0.08)))
    bump(); scheduleDraw()
  }, [])

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
    bump(); scheduleDraw()
    return true
  }, [])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  const onTouchStart = useCallback(e => {
    if (e.touches.length === 1) {
      isDragging.current = true
      dragButton.current = 2
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2) {
      isDragging.current = false
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
        bump(); scheduleDraw()
      }
      pinchDist.current = d
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastDragPos.current.x
      const dy = e.touches[0].clientY - lastDragPos.current.y
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      if (dragButton.current === 2) {
        rotY.current += dx * 0.005
        rotX.current = Math.max(-1.2, Math.min(1.2, rotX.current + dy * 0.005))
      } else {
        panX.current += dx
        panY.current += dy
      }
      bump(); scheduleDraw()
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    isDragging.current = false
    pinchDist.current = null
  }, [])

  return {
    rotY, rotX, scaleZ, panX, panY,
    isDragging, dragButton, version,
    getScale, getOrigin, getBaseY, is3D,
    onWheel, onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove, onTouchEnd,
  }
}