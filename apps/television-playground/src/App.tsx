import { useEffect, useState } from 'react'
import { CHANNELS, loadState, saveState, type Artifact, type BoardState, type ChannelId } from './board.ts'

function kicker(kind: Artifact['kind']): string {
  switch (kind) {
    case 'status':
      return 'Status'
    case 'checklist':
      return 'Checks'
    case 'week':
      return 'Week'
    case 'note':
      return 'Note'
    case 'table':
      return 'Table'
    case 'pin':
      return 'Pin'
  }
}

function CardFace({
  card,
  onToggle,
}: {
  card: Artifact
  onToggle: (cardId: string, itemId: string) => void
}) {
  if (card.kind === 'status') {
    return (
      <div className="status-lines">
        {card.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    )
  }

  if (card.kind === 'checklist') {
    return (
      <ul className="checks">
        {card.items.map((item) => (
          <li key={item.id}>
            <label className={item.done ? 'check done' : 'check'}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(card.id, item.id)}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    )
  }

  if (card.kind === 'week') {
    return (
      <ol className="week">
        {card.days.map((day) => (
          <li key={day.id} className={day.hot ? 'hot' : undefined}>
            <span className="day">{day.label}</span>
            <span className="mark">{day.mark}</span>
          </li>
        ))}
      </ol>
    )
  }

  if (card.kind === 'note') {
    return <p className="note-body">{card.body}</p>
  }

  if (card.kind === 'table') {
    return (
      <table>
        <thead>
          <tr>
            {card.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {card.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <p className="pin-caption">Pinned on this channel. Not from a model.</p>
}

function ArtifactCard({
  card,
  onRemove,
  onToggle,
}: {
  card: Artifact
  onRemove: (id: string) => void
  onToggle: (cardId: string, itemId: string) => void
}) {
  return (
    <article className={`card card-${card.kind}`}>
      <header className="card-top">
        <span className="kicker">{kicker(card.kind)}</span>
        <button type="button" className="take-down" onClick={() => onRemove(card.id)}>
          take down
        </button>
      </header>
      <h2>{card.title}</h2>
      <CardFace card={card} onToggle={onToggle} />
    </article>
  )
}

export default function App() {
  const [state, setState] = useState<BoardState>(() => loadState())
  const [draft, setDraft] = useState('')

  useEffect(() => {
    saveState(state)
  }, [state])

  const visible = state.cards.filter((card) => card.channel === state.channel)
  const active = CHANNELS.find((channel) => channel.id === state.channel) ?? CHANNELS[0]

  function setChannel(channel: ChannelId) {
    setState((current) => ({ ...current, channel }))
  }

  function takeDown(id: string) {
    setState((current) => ({ ...current, cards: current.cards.filter((card) => card.id !== id) }))
  }

  function toggleItem(cardId: string, itemId: string) {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) => {
        if (card.id !== cardId || card.kind !== 'checklist') return card
        return {
          ...card,
          items: card.items.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
        }
      }),
    }))
  }

  function pin(title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    const card: Artifact = {
      id: crypto.randomUUID(),
      channel: state.channel,
      kind: 'pin',
      title: trimmed,
    }
    setState((current) => ({ ...current, cards: [card, ...current.cards] }))
    setDraft('')
  }

  return (
    <div className="cabinet">
      <div className="bezel">
        <header className="mast">
          <div>
            <p className="brand">Television</p>
            <p className="brand-sub">Channel board · artifacts, not a transcript</p>
          </div>
          <p className="osd">
            <span className="lamp" aria-hidden="true" />
            CH {active.number} {active.label}
          </p>
        </header>

        <div className="screen">
          <aside className="rail">
            <p className="rail-label">Channels</p>
            <div className="channel-list" role="listbox" aria-label="Channels">
              {CHANNELS.map((channel) => {
                const count = state.cards.filter((card) => card.channel === channel.id).length
                const selected = channel.id === state.channel
                return (
                  <button
                    key={channel.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? 'channel on' : 'channel'}
                    onClick={() => setChannel(channel.id)}
                  >
                    <span className="ch-no">{channel.number}</span>
                    <span className="ch-name">{channel.label}</span>
                    <span className="ch-count">{count}</span>
                  </button>
                )
              })}
            </div>

            <form
              className="pin-box"
              onSubmit={(event) => {
                event.preventDefault()
                pin(draft)
              }}
            >
              <label htmlFor="pin-title">Put on TV</label>
              <input
                id="pin-title"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Title to pin"
                autoComplete="off"
              />
              <button type="submit">Pin</button>
              <p className="hint">Enter puts a card on {active.label}.</p>
            </form>
          </aside>

          <main className="board" aria-label={`${active.label} artifacts`}>
            {visible.length === 0 ? (
              <p className="empty">This channel is dark. Pin a title to put a card on the glass.</p>
            ) : (
              visible.map((card) => (
                <ArtifactCard key={card.id} card={card} onRemove={takeDown} onToggle={toggleItem} />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
