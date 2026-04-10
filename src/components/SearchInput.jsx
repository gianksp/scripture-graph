import { useState } from 'react'
import { POPULAR_VERSES } from '../data/bookMap'

export default function SearchInput({ value, onChange, onSubmit, placeholder = 'e.g. John 3:16' }) {
  const [showSugg, setShowSugg] = useState(false)

  const matches = value?.length >= 2
    ? POPULAR_VERSES.filter(p => p.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : []

  function handleSelect(v) {
    onChange(v)
    setShowSugg(false)
    onSubmit(v)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        onChange={e => { onChange(e.target.value); setShowSugg(true) }}
        onKeyDown={e => { if (e.key === 'Enter') { setShowSugg(false); onSubmit(value) } }}
        onBlur={() => setTimeout(() => setShowSugg(false), 150)}
        className="w-full bg-surface2 border border-border2 rounded-lg px-4 py-2.5
          text-sm font-mono text-[#e8e4dc] focus:outline-none focus:border-gold
          transition-colors placeholder:text-faint"
      />
      {showSugg && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border
          rounded-lg overflow-hidden z-50">
          {matches.map(m => (
            <div
              key={m}
              onMouseDown={() => handleSelect(m)}
              className="px-4 py-2 text-xs font-mono text-dim bg-surface2
                hover:bg-border hover:text-[#e8e4dc] cursor-pointer transition-colors"
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}