import { useApp } from '../../store/AppContext'
import { useRefs } from '../../data/useRefs'
import SearchInput from '../../components/SearchInput'
import { useState } from 'react'
import { parseUserInput } from '../../data/bookMap'

export default function ArcControls() {
  const { state, setThreshold } = useApp()
  const { filteredRefs, stats } = useRefs()
  const [query, setQuery]       = useState('')

  function handleSubmit(raw) {
    const verseId = parseUserInput(raw)
    if (verseId) window.dispatchEvent(new CustomEvent('verse:search', { detail: verseId }))
  }

  const count = filteredRefs.length
  const countLabel = count > 10000
    ? `${(count/1000).toFixed(0)}k`
    : count.toLocaleString()

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 24px', height:48,
      background:'#0a0a0a', borderBottom:'1px solid #1e1e1e',
      gap:16, flexWrap:'wrap',
    }}>
      {/* Brand */}
      <div style={{ flexShrink:0 }}>
        <span style={{ fontFamily:'IBM Plex Mono', fontSize:14, color:'#d4a843', letterSpacing:'0.08em' }}>
          BIBLE EXPLORER
        </span>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, fontFamily:'IBM Plex Mono', fontSize:12, color:'#444' }}>
        <span><span style={{ display:'inline-block', width:12, height:2, background:'#7ab8f5', marginRight:6, verticalAlign:'middle' }}/>OT→OT</span>
        <span><span style={{ display:'inline-block', width:12, height:2, background:'#7dd4a0', marginRight:6, verticalAlign:'middle' }}/>NT→NT</span>
        <span><span style={{ display:'inline-block', width:12, height:2, background:'#d4a843', marginRight:6, verticalAlign:'middle' }}/>OT→NT</span>
      </div>

      {/* Threshold */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:'#444' }}>density</span>
        <input
          type="range" min="5" max="200"
          value={state.threshold}
          onChange={e => setThreshold(parseInt(e.target.value))}
          style={{ width:100, accentColor:'#d4a843' }}
        />
        <span style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:'#d4a843', minWidth:32 }}>
          {countLabel}
        </span>
      </div>

      {/* Search */}
      <div style={{ width:200 }}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          placeholder="Go to verse..."
        />
      </div>
    </div>
  )
}