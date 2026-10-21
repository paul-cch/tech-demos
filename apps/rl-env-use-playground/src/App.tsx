import { useEffect, useState } from 'react'
import { ForecastTab } from './features/forecast/ForecastTab'
import { HillclimbTab } from './features/hillclimb/HillclimbTab'
import { meta } from './lib/data'

type Tab = 'forecast' | 'hillclimb'
const fromHash = (): Tab => (window.location.hash === '#hillclimb' ? 'hillclimb' : 'forecast')

export default function App() {
  const [tab, setTab] = useState<Tab>(fromHash)

  useEffect(() => {
    const onHash = () => {
      setTab(fromHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">
            <a href="https://github.com/browser-use/rl-env-use" target="_blank" rel="noreferrer">
              browser-use/rl-env-use
            </a>{' '}
            · <code>envs/trial-forecast</code> · {meta.nTasks} forecasts · {meta.nCases} ClinicalTrials.gov cases ({meta.nTrials} distinct NCT IDs)
          </p>
          <h1>rl-env-use Playground</h1>
          <p className="lede">
            Forecast real trial outcomes from the registered protocol, scored with the env's own 1 − Brier reward, then walk the prompt hillclimb that took Qwen from{' '}
            {meta.finalRegraded.baseline_test.toFixed(2)} to {meta.finalRegraded.best_test.toFixed(2)}.
          </p>
        </div>
        <nav className="segmented tabs" aria-label="Views">
          <a href="#forecast" className={tab === 'forecast' ? 'active' : ''}>
            Forecast
          </a>
          <a href="#hillclimb" className={tab === 'hillclimb' ? 'active' : ''}>
            Hillclimb
          </a>
        </nav>
      </header>
      <main>{tab === 'forecast' ? <ForecastTab /> : <HillclimbTab />}</main>
      <footer className="footer">
        Data vendored from{' '}
        <a href={`https://github.com/browser-use/rl-env-use/tree/${meta.commit}/envs/trial-forecast`} target="_blank" rel="noreferrer">
          rl-env-use@{meta.commit.slice(0, 7)}
        </a>{' '}
        (MIT, © Browser Use). Nothing here calls a model; every model answer shown is a stored run from the repo.
      </footer>
    </div>
  )
}
