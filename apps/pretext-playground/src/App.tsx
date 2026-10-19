import { useEffect, useState } from 'react'
import { FlowTab } from './features/flow/FlowTab'
import { MeasureTab } from './features/measure/MeasureTab'

type Tab = 'measure' | 'flow'
const fromHash = (): Tab => (window.location.hash === '#flow' ? 'flow' : 'measure')

export default function App() {
  const [tab, setTab] = useState<Tab>(fromHash)

  useEffect(() => {
    const onHash = () => setTab(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">
            <a href="https://github.com/chenglou/pretext" target="_blank" rel="noreferrer">
              @chenglou/pretext
            </a>{' '}
            · v1.0.0
          </p>
          <h1>Pretext Playground</h1>
          <p className="lede">Multiline text measurement and layout in pure arithmetic — checked live against what the browser actually paints.</p>
        </div>
        <nav className="segmented tabs" aria-label="Views">
          <a href="#measure" className={tab === 'measure' ? 'active' : ''}>
            Measure vs DOM
          </a>
          <a href="#flow" className={tab === 'flow' ? 'active' : ''}>
            Canvas flow
          </a>
        </nav>
      </header>
      <main>{tab === 'measure' ? <MeasureTab /> : <FlowTab />}</main>
    </div>
  )
}
