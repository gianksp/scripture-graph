import { proj } from './project'

export function verseToScreen(id, posRef, chDataRef, rangesRef, camera, W, H) {
  const base = id.split('-')[0]
  const p    = posRef.current[base]
  const { rotY, rotX, getScale, getOrigin, getBaseY } = camera
  const scale=getScale(W), {ox}=getOrigin(W,H), baseY=getBaseY(H)
  if (p) {
    const book    = base.split('.')[0]
    const ch      = parseInt(base.split('.')[1])||1
    const chEntry = chDataRef.current[book]?.find(c=>c.ch===ch)
    const xn = chEntry?chEntry.xn:p.xn
    const z  = chEntry?chEntry.z :p.z
    const r  = proj(xn,0,z,rotY.current,rotX.current,scale,ox,baseY)
    return { sx:r.sx, sy:r.sy }
  }
  const book=base.split('.')[0]
  const rng=rangesRef.current[book]
  return { sx:ox+(rng?.midXn||0)*scale, sy:baseY }
}

export function arcEndpoints(ref, posRef, chDataRef, rangesRef, camera, W, H) {
  const s1=verseToScreen(ref.from,posRef,chDataRef,rangesRef,camera,W,H)
  const s2=verseToScreen(ref.to,  posRef,chDataRef,rangesRef,camera,W,H)
  const baseY=camera.getBaseY(H)
  const span=Math.abs(s2.sx-s1.sx)
  const maxSpan=camera.getScale(W)*1.8
  const ratio=span/maxSpan
  const aH=ratio*baseY*0.75
  const pull=0.25
  const cp1x=s1.sx+(s2.sx-s1.sx)*pull
  const cp2x=s1.sx+(s2.sx-s1.sx)*(1-pull)
  const topY=s1.sy-aH
  return {
    x1:s1.sx, y1:s1.sy, x2:s2.sx, y2:s2.sy,
    cp1x, cp1y:topY, cp2x, cp2y:topY,
  }
}

// Aggregate verse-level refs into chapter-pair arcs
export function aggregateToChapterArcs(refs) {
  const map = new Map()
  refs.forEach(ref => {
    const fb = ref.from.split('-')[0]
    const tb = ref.to.split('-')[0]
    const fParts = fb.split('.')
    const tParts = tb.split('.')
    const fCh = `${fParts[0]}.${fParts[1]}`
    const tCh = `${tParts[0]}.${tParts[1]}`
    // Canonical key — always smaller first
    const [a,b] = fCh < tCh ? [fCh,tCh] : [tCh,fCh]
    const key   = `${a}|${b}`
    if (!map.has(key)) {
      map.set(key, {
        fromCh: a, toCh: b,
        votes: 0,
        verses: [],
      })
    }
    const entry = map.get(key)
    entry.votes += ref.votes
    entry.verses.push(ref)
  })
  return [...map.values()]
}

export function findClosestArc(mx, my, refs, posRef, chDataRef, rangesRef, camera, W, H, filter) {
  let closest=null, minD=Infinity
  refs.forEach(ref=>{
    if (filter&&!filter(ref)) return
    const ep=arcEndpoints(ref,posRef,chDataRef,rangesRef,camera,W,H)
    for (let t=0;t<=1;t+=0.02) {
      const t1=1-t
      const bx=t1*t1*t1*ep.x1+3*t1*t1*t*ep.cp1x+3*t1*t*t*ep.cp2x+t*t*t*ep.x2
      const by=t1*t1*t1*ep.y1+3*t1*t1*t*ep.cp1y+3*t1*t*t*ep.cp2y+t*t*t*ep.y2
      const d =Math.sqrt((bx-mx)**2+(by-my)**2)
      if (d<40&&d<minD){ minD=d; closest={ref,ep} }
    }
  })
  return closest
}