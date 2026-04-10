import { useEffect } from 'react'
import { useApp } from './store/AppContext'
import ArcView from './views/ArcView/ArcView'

export default function App() {
  const { state, loadData } = useApp()

  useEffect(() => { loadData() }, [loadData])

  if (!state.loaded) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0a' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'IBM Plex Mono', fontSize:14, color:'#d4a843', letterSpacing:'0.1em', marginBottom:8 }}>BIBLE EXPLORER</div>
        <div style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:'#444' }}>Loading data...</div>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#0a0a0a' }}>
      <ArcView />
    </div>
  )
}