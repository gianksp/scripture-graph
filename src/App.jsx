import { useEffect } from 'react'
import { useStore } from './store/store'
import Header from './components/navigation/Header'
import ArcCanvas from './components/canvas/ArcCanvas'
import InfoPanel from './components/InfoPanel'
import { SplashScreen } from './components/SplashScreen'

function Inner() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans bg-canvas dark:bg-canvas-dark">
      <Header />
      <div className="relative" style={{ flex: '0 0 60%', minHeight: 0 }}>
        <ArcCanvas />
      </div>
      <div className="overflow-hidden border-t border-hairline dark:border-hairline-dark" style={{ flex: '0 0 40%', minHeight: 0 }}>
        <InfoPanel />
      </div>
    </div>
  )
}

export default function App() {
  const loaded = useStore(s => s.loaded)
  const loadData = useStore(s => s.loadData)

  useEffect(() => { loadData() }, [loadData])

  if (!loaded) return (<SplashScreen />)

  return <Inner />
}