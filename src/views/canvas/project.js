export function proj(x, y, z, ry, rx, scale, ox, oy) {
  const cy = Math.cos(ry), sy = Math.sin(ry)
  const rx2 = x * cy - z * sy, rz = x * sy + z * cy
  const cx = Math.cos(rx), sx2 = Math.sin(rx)
  const ry2 = y * cx - rz * sx2, rz2 = y * sx2 + rz * cx
  return { sx: ox + rx2 * scale, sy: oy - ry2 * scale, depth: rz2 }
}