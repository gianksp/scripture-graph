import { useEffect } from 'react'
import { useStore } from './store/store'
import ArcControls from './components/ArcControls'
import ArcCanvas from './components/canvas/ArcCanvas'
import InfoPanel from './components/InfoPanel'

function Inner() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-mono" style={{ background: '#080808' }}>
      <ArcControls />
      <div style={{ flex: '0 0 60%', minHeight: 0, position: 'relative' }}>
        <ArcCanvas />
      </div>
      <div style={{ flex: '0 0 40%', minHeight: 0, borderTop: '1px solid #1a1a1a', overflow: 'hidden' }}>
        <InfoPanel />
      </div>
    </div>
  )
}

export default function App() {
  const loaded = useStore(s => s.loaded)
  const loadData = useStore(s => s.loadData)

  useEffect(() => { loadData() }, [loadData])

  if (!loaded) return (
    <div className="fixed inset-0 flex items-center justify-center font-mono" style={{ background: '#080808' }}>
      <div className="text-center">
        <div className="text-xs tracking-widest mb-2" style={{ color: '#d4a843' }}>BIBLE EXPLORER</div>
        <div className="text-xs" style={{ color: '#333' }}>loading...</div>
      </div>
    </div>
  )

  return <Inner />
}