import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useRefs } from '../data/useRefs'
import { POPULAR, parseUserInput } from '../data/bookMap'

export default function ArcControls() {
  const { state, setThreshold } = useApp()
  const { filteredRefs }        = useRefs()
  const [q, setQ]               = useState('')
  const [open, setOpen]         = useState(false)

  const count = filteredRefs.length
  const label = count>10000?`${(count/1000).toFixed(0)}k`:count.toLocaleString()

  function submit(raw) {
    const id = parseUserInput(raw)
    if (id) window.dispatchEvent(new CustomEvent('verse:search',{detail:id}))
    setOpen(false); setQ('')
  }

  const matches = q.length>=2
    ? POPULAR.filter(p=>p.toLowerCase().includes(q.toLowerCase())).slice(0,5)
    : []

  return (
    <div className="flex items-center gap-4 px-5 h-12 bg-[#080808] border-b border-[#1e1e1e] font-mono text-xs shrink-0">
      <span className="text-[#d4a843] tracking-widest shrink-0">BIBLE EXPLORER</span>

      <div className="hidden sm:flex items-center gap-4 text-[#333]">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px bg-[#7ab8f5]"/>OT→OT</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px bg-[#7dd4a0]"/>NT→NT</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-px bg-[#d4a843]"/>OT→NT</span>
      </div>

      <div className="flex-1"/>

      <div className="hidden sm:flex items-center gap-2 text-[#333]">
        <span>density</span>
        <input type="range" min="5" max="200" value={state.threshold}
          onChange={e=>setThreshold(parseInt(e.target.value))} className="w-24"/>
        <span className="text-[#d4a843] w-8">{label}</span>
      </div>

      <button
        onClick={()=>window.dispatchEvent(new CustomEvent('view:reset'))}
        className="text-[#333] hover:text-white transition-colors shrink-0"
      >reset</button>

      <div className="relative shrink-0">
        <input
          value={q}
          onChange={e=>{setQ(e.target.value);setOpen(true)}}
          onKeyDown={e=>e.key==='Enter'&&submit(q)}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          placeholder="verse..."
          className="bg-[#0f0f0f] border border-[#1e1e1e] rounded px-3 py-1.5 text-xs font-mono text-white placeholder-[#333] focus:outline-none focus:border-[#d4a843] w-36 transition-colors"
        />
        {open&&matches.length>0&&(
          <div className="absolute right-0 top-full mt-1 bg-[#0f0f0f] border border-[#1e1e1e] rounded overflow-hidden z-50 w-48">
            {matches.map(m=>(
              <div key={m} onMouseDown={()=>submit(m)}
                className="px-3 py-2 text-xs font-mono text-[#555] hover:text-white hover:bg-[#161616] cursor-pointer transition-colors">
                {m}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}