/**
 * Projects a 3D point (x, y, z) to 2D screen coordinates.
 * Applies Y-axis rotation (spin) then X-axis rotation (tilt).
 *
 * @param {number} x - World X (horizontal, book position)
 * @param {number} y - World Y (vertical, unused in flat mode)
 * @param {number} z - World Z (depth, chapter position)
 * @param {number} rotY - Y-axis rotation in radians
 * @param {number} rotX - X-axis rotation in radians
 * @param {number} scale - Pixels per world unit
 * @param {number} originX - Screen X center
 * @param {number} originY - Screen Y center (baseline)
 * @returns {{ sx: number, sy: number, depth: number }}
 */
export function project3D(x, y, z, rotY, rotX, scale, originX, originY) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const rotatedX = x * cosY - z * sinY
  const rotatedZ = x * sinY + z * cosY

  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
  const rotatedY = y * cosX - rotatedZ * sinX
  const finalDepth = y * sinX + rotatedZ * cosX

  return {
    sx: originX + rotatedX * scale,
    sy: originY - rotatedY * scale,
    depth: finalDepth,
  }
}