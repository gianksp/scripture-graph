import { useEffect } from 'react'
import { useStore } from './store/store'
import Header from './components/navigation/Header'
import ArcCanvas from './components/canvas/ArcCanvas'
import InfoPanel from './components/InfoPanel'
import { SplashScreen } from './components/SplashScreen'
import InfoBar from './components/InfoBar'

function Inner() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans bg-canvas dark:bg-canvas-dark">
      <Header />
      <div className="relative" style={{ flex: '0 0 45%', minHeight: 0 }}>
        <ArcCanvas />
      </div>
      <InfoBar />
      <div
        className="overflow-hidden border-t border-hairline dark:border-hairline-dark"
        style={{ flex: '1 1 0%', minHeight: 0 }}
      >
        <InfoPanel />
      </div>
    </div>
  )
}

export default function App() {
  const loaded = useStore(s => s.loaded)
  const loadData = useStore(s => s.loadData)
  const selectFromUrl = useStore(s => s.selectFromUrl)

  useEffect(() => { loadData() }, [loadData])

  // Once loaded, check for deep link
  useEffect(() => {
    if (!loaded) return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) selectFromUrl(q)
  }, [loaded, selectFromUrl])

  if (!loaded) return <SplashScreen />
  return <Inner />
}