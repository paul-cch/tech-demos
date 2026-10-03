export const STORAGE_KEY = 'television-playground.v1'

export const CHANNELS = [
  { id: 'today', label: 'Today', number: '01' },
  { id: 'work', label: 'Work', number: '02' },
] as const

export type ChannelId = (typeof CHANNELS)[number]['id']

export type ChecklistItem = { id: string; label: string; done: boolean }

export type Artifact =
  | { id: string; channel: ChannelId; kind: 'status'; title: string; lines: string[] }
  | { id: string; channel: ChannelId; kind: 'checklist'; title: string; items: ChecklistItem[] }
  | {
      id: string
      channel: ChannelId
      kind: 'week'
      title: string
      days: { id: string; label: string; mark: string; hot?: boolean }[]
    }
  | { id: string; channel: ChannelId; kind: 'note'; title: string; body: string }
  | { id: string; channel: ChannelId; kind: 'table'; title: string; headers: string[]; rows: string[][] }
  | { id: string; channel: ChannelId; kind: 'pin'; title: string }

export type BoardState = { channel: ChannelId; cards: Artifact[] }

const KINDS = new Set(['status', 'checklist', 'week', 'note', 'table', 'pin'])

export function seedState(): BoardState {
  return {
    channel: 'today',
    cards: [
      {
        id: 'status-bench',
        channel: 'today',
        kind: 'status',
        title: 'Bench',
        lines: [
          'Today is the live channel.',
          'Three artifacts are on the glass. Nothing is sitting in a transcript.',
          'Work is the other room: a draft note and a three-row cut list.',
        ],
      },
      {
        id: 'checks-site',
        channel: 'today',
        kind: 'checklist',
        title: 'Site pass',
        items: [
          { id: 'title', label: 'Title reads Television, not a product tour', done: true },
          { id: 'og', label: 'Open Graph image is 1200×630', done: false },
          { id: 'favicon', label: 'Favicon still reads at 16px', done: true },
          { id: 'apex', label: 'television.run answers on the apex', done: false },
        ],
      },
      {
        id: 'week-strip',
        channel: 'today',
        kind: 'week',
        title: '28 Sep – 4 Oct',
        days: [
          { id: 'mon', label: 'Mon 28', mark: '·' },
          { id: 'tue', label: 'Tue 29', mark: '·' },
          { id: 'wed', label: 'Wed 30', mark: 'ship' },
          { id: 'thu', label: 'Thu 1', mark: '·' },
          { id: 'fri', label: 'Fri 2', mark: 'review' },
          { id: 'sat', label: 'Sat 3', mark: 'on air', hot: true },
          { id: 'sun', label: 'Sun 4', mark: '·' },
        ],
      },
      {
        id: 'note-channels',
        channel: 'work',
        kind: 'note',
        title: 'Draft — channels',
        body: 'A channel is a named room, not a thread. Leave the morning pins on Today. Keep the cut list here until the bezel work is done. Take a card down when it is no longer true.',
      },
      {
        id: 'table-cuts',
        channel: 'work',
        kind: 'table',
        title: 'Cut list',
        headers: ['Cut', 'Room', 'State'],
        rows: [
          ['Channel rail', 'left', 'in'],
          ['Pin box', 'rail', 'in'],
          ['Skill cards', 'later', 'held'],
        ],
      },
    ],
  }
}

function isChannel(value: unknown): value is ChannelId {
  return value === 'today' || value === 'work'
}

function isArtifact(value: unknown): value is Artifact {
  if (!value || typeof value !== 'object') return false
  const card = value as Record<string, unknown>
  if (typeof card.id !== 'string' || !isChannel(card.channel)) return false
  if (typeof card.kind !== 'string' || !KINDS.has(card.kind)) return false
  if (typeof card.title !== 'string') return false
  return true
}

export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<BoardState>
    if (!isChannel(parsed.channel) || !Array.isArray(parsed.cards)) return seedState()
    const cards = parsed.cards.filter(isArtifact)
    return { channel: parsed.channel, cards }
  } catch {
    return seedState()
  }
}

export function saveState(state: BoardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
