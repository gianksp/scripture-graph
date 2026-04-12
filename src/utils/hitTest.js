import { BOOK_ORDER } from '../data/bookMap'

const STRIP = 40

export function findClosestArc(mx, my, refs, getEndpoints, hasSel, getFeatured) {
  let closest=null, minD=16
  refs.forEach(ref=>{
    if (hasSel && !getFeatured(ref)) return  // only hover featured when selected
    const {x1,y1,x2,y2,cx,cy}=getEndpoints(ref)
    for(let t=0;t<=1;t+=0.05){
      const t1=1-t
      const bx=t1*t1*x1+2*t1*t*cx+t*t*x2
      const by=t1*t1*y1+2*t1*t*cy+t*t*y2
      const d=Math.sqrt((bx-mx)**2+(by-my)**2)
      if(d<minD){ minD=d; closest={ref} }
    }
  })
  return closest
}

export function findClosestBook(mx, my, rangesRef, bookLabelPositions, W, scale, ox, baseY) {
  // Always find closest label — no isFlat distinction
  let bestBook=null, bestDist=Infinity
  const threshold=48  // px — same in 2D and 3D

  BOOK_ORDER.forEach(book=>{
    const lb=bookLabelPositions[book]
    if (!lb) return
    const dist=Math.sqrt((lb.sx-mx)**2+(lb.sy-my)**2)
    if (dist<dist&&dist<threshold) { bestDist=dist; bestBook=book }
    if (dist<bestDist) { bestDist=dist; bestBook=book }
  })

  return bestDist<threshold ? bestBook : null
}