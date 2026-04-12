import { BOOK_MAP, isOT, verseIdToLabel } from '../../data/bookMap'

export function buildArcTooltipHTML(chArc, getVerse, maxPairs = 8) {
    const fromBook = chArc.fromChapter.split('.')[0]
    const toBook = chArc.toChapter.split('.')[0]
    const fromOT = isOT(fromBook)
    const toOT = isOT(toBook)
    const fromColor = fromOT ? '#7ab8f5' : '#7dd4a0'
    const toColor = toOT ? '#7ab8f5' : '#7dd4a0'
    const direction = fromOT && !toOT ? 'OT→NT' : !fromOT && toOT ? 'NT→OT' : fromOT ? 'OT→OT' : 'NT→NT'
    const fromChLabel = `${BOOK_MAP[fromBook] || fromBook} ${chArc.fromChapter.split('.')[1]}`
    const toChLabel = `${BOOK_MAP[toBook] || toBook} ${chArc.toChapter.split('.')[1]}`

    const visiblePairs = chArc.versePairs
        .slice().sort((a, b) => b.votes - a.votes).slice(0, maxPairs)

    const pairRows = visiblePairs.map((pair) => {
        const fromLbl = verseIdToLabel(pair.from)
        const toLbl = verseIdToLabel(pair.to)
        const fromText = getVerse(fromLbl)
        const toText = getVerse(toLbl)
        return `
    <div style="padding:10px;margin-bottom:6px;border:1px solid #1e1e1e;border-radius:6px;background:#111">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        <span style="font-family:IBM Plex Mono;font-size:9px;color:#333">#pair</span>
        <span style="font-family:IBM Plex Mono;font-size:9px;color:#333;margin-left:auto">${pair.votes}v</span>
      </div>
      <div style="margin-bottom:8px;padding:6px 8px;background:#0a0a0a;border-radius:4px">
        <div style="font-family:IBM Plex Mono;font-size:10px;color:${fromColor};margin-bottom:3px">${fromLbl}</div>
        ${fromText ? `<div style="font-size:11px;color:#777;line-height:1.55">${fromText.slice(0, 100)}${fromText.length > 100 ? '…' : ''}</div>` : ''}
      </div>
      <div style="font-family:IBM Plex Mono;font-size:9px;color:#333;text-align:center;margin-bottom:6px">references ↓</div>
      <div style="padding:6px 8px;background:#0a0a0a;border-radius:4px">
        <div style="font-family:IBM Plex Mono;font-size:10px;color:${toColor};margin-bottom:3px">${toLbl}</div>
        ${toText ? `<div style="font-size:11px;color:#888;line-height:1.55">${toText.slice(0, 100)}${toText.length > 100 ? '…' : ''}</div>` : ''}
      </div>
    </div>
  `
    }).join('')

    const remaining = chArc.versePairs.length - maxPairs
    const footer = remaining > 0
        ? `<div style="font-family:IBM Plex Mono;font-size:9px;color:#333;padding-top:8px">+${remaining} more · click to see all</div>`
        : `<div style="font-family:IBM Plex Mono;font-size:9px;color:#333;padding-top:8px">click to see all in panel</div>`

    return `
    <div style="font-family:IBM Plex Mono;font-size:10px;color:#555;margin-bottom:6px">
      ${direction} · ${chArc.totalVotes} votes · ${chArc.versePairs.length} pairs
    </div>
    <div style="font-family:IBM Plex Mono;font-size:12px;margin-bottom:10px">
      <span style="color:${fromColor}">${fromChLabel}</span>
      <span style="color:#444;margin:0 6px">↔</span>
      <span style="color:${toColor}">${toChLabel}</span>
    </div>
    <div style="max-height:380px;overflow-y:auto">${pairRows}</div>
    ${footer}
  `
}

export function buildBookTooltipHTML(book, stats, linkCount) {
    const ot = isOT(book)
    const color = ot ? '#7ab8f5' : '#7dd4a0'
    return `
    <div style="font-family:IBM Plex Mono;font-size:13px;color:${color};margin-bottom:6px;font-weight:500">${BOOK_MAP[book] || book}</div>
    <div style="font-family:IBM Plex Mono;font-size:10px;color:#555;margin-bottom:8px">${ot ? 'Old Testament' : 'New Testament'}</div>
    <div style="display:flex;gap:16px">
      <div>
        <div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${stats.chapters || 0}</div>
        <div style="font-family:IBM Plex Mono;font-size:9px;color:#555">chapters</div>
      </div>
      <div>
        <div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${(stats.verses || 0).toLocaleString()}</div>
        <div style="font-family:IBM Plex Mono;font-size:9px;color:#555">verses</div>
      </div>
      <div>
        <div style="font-family:IBM Plex Mono;font-size:16px;color:#d4a843">${linkCount.toLocaleString()}</div>
        <div style="font-family:IBM Plex Mono;font-size:9px;color:#555">links</div>
      </div>
    </div>
    <div style="font-family:IBM Plex Mono;font-size:9px;color:#333;margin-top:8px">click to highlight all links</div>
  `
}