import { useState } from 'react'
import ScriptureGraphLogo from '../ScriptureGraphLogo'
import GraphDropdown, { GraphIcon } from './GraphDropdown'
import SourceDropdown, { BookIcon } from './SourceDropdown'
import { PillButton } from './PillButton'
import { IconButton } from './IconButton'
import SearchBar from './SearchBar'

const GRAPH_TYPES = [{ id: 'cross-references', label: 'Cross References' }]
const BIBLE_VERSIONS = [{ id: 'kjv', label: 'King James Version', short: 'KJV' }]

export default function Header() {
  const [showGraphSheet, setShowGraphSheet] = useState(false)
  const [showVersionSheet, setShowVersionSheet] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [activeGraph, setActiveGraph] = useState(GRAPH_TYPES[0])
  const [activeVersion, setActiveVersion] = useState(BIBLE_VERSIONS[0])

  return (
    <div className="relative shrink-0">
      <div className="font-sans bg-canvas dark:bg-canvas-dark border-b border-hairline dark:border-hairline-dark">
        <div className="flex items-center gap-1 px-3 h-16">

          <ScriptureGraphLogo size={28} />

          <div className="flex-1" />

          {/* Bible version */}
          <PillButton
            onClick={() => { setShowVersionSheet(v => !v); setShowGraphSheet(false); setShowSearch(false) }}
            active={showVersionSheet}
            icon={<BookIcon />}
            label={activeVersion.short}
            title="Bible version"
          />

          {/* Graph type */}
          <PillButton
            onClick={() => { setShowGraphSheet(v => !v); setShowVersionSheet(false); setShowSearch(false) }}
            active={showGraphSheet}
            icon={<GraphIcon />}
            label={activeGraph.label}
            title="Graph type"
          />

          {/* {dataStats && (
            <span className="hidden lg:block text-2xs text-ghost dark:text-ghost-dark px-2">
              {dataStats.links.toLocaleString()} refs
            </span>
          )} */}

          {/* Search */}
          <IconButton
            onClick={() => { setShowSearch(v => !v); setShowGraphSheet(false); setShowVersionSheet(false) }}
            active={showSearch}
            title="Search"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </IconButton>

          {/* Theme */}
          {/* <IconButton onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark'
              ? (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8.5A5 5 0 017 2a6 6 0 100 12 5 5 0 006-5.5z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              )
            }
          </IconButton> */}

          {/* Reset */}
          {/* <IconButton onClick={resetView} title="Reset view">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8a5 5 0 105-5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M4 5L6 8H2L4 5z" fill="currentColor" />
            </svg>
          </IconButton> */}
        </div>
      </div>

      {/* Graph type sheet */}
      <GraphDropdown
        open={showGraphSheet}
        active={activeGraph}
        onSelect={setActiveGraph}
        onClose={() => setShowGraphSheet(false)}
      />

      {/* Bible version sheet */}
      <SourceDropdown
        open={showVersionSheet}
        active={activeVersion}
        onSelect={setActiveVersion}
        onClose={() => setShowVersionSheet(false)}
      />

      {/* Search sheet */}
      <SearchBar open={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  )
}