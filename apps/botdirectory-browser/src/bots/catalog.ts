import changelogWriter from './changelog-writer.md?raw'
import firstMate from './first-mate.md?raw'
import homelabWatch from './homelab-watch.md?raw'
import inboxTriage from './inbox-triage.md?raw'
import meetingNotes from './meeting-notes.md?raw'
import prReviewer from './pr-reviewer.md?raw'
import researchDigester from './research-digester.md?raw'

export type Bot = {
  id: string
  name: string
  description: string
  tags: string[]
  prompt: string
}

export const bots: Bot[] = [
  {
    id: 'first-mate',
    name: 'First Mate',
    description: 'Calm day-to-day engineering co-pilot for the next useful step.',
    tags: ['devtools', 'planning', 'general'],
    prompt: firstMate,
  },
  {
    id: 'inbox-triage',
    name: 'Inbox Triage',
    description: 'Sort mail into Act / Defer / FYI / Archive with short drafts.',
    tags: ['productivity', 'email'],
    prompt: inboxTriage,
  },
  {
    id: 'pr-reviewer',
    name: 'PR Reviewer',
    description: 'Actionable code review focused on correctness and tests.',
    tags: ['devtools', 'code-review', 'git'],
    prompt: prReviewer,
  },
  {
    id: 'homelab-watch',
    name: 'Homelab Watch',
    description: 'Symptom → hypothesis → checks → safe fix for personal labs.',
    tags: ['ops', 'homelab', 'sre'],
    prompt: homelabWatch,
  },
  {
    id: 'research-digester',
    name: 'Research Digester',
    description: 'Skimmable digests of papers and long articles.',
    tags: ['research', 'notes'],
    prompt: researchDigester,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Transcripts → decisions, owners, and open questions.',
    tags: ['productivity', 'meetings'],
    prompt: meetingNotes,
  },
  {
    id: 'changelog-writer',
    name: 'Changelog Writer',
    description: 'Commits and PR titles → user-facing changelog sections.',
    tags: ['devtools', 'docs', 'git'],
    prompt: changelogWriter,
  },
]

export function filterBots(query: string): Bot[] {
  const q = query.trim().toLowerCase()
  if (!q) return bots
  return bots.filter((bot) => {
    const haystack = [bot.name, bot.description, ...bot.tags].join(' ').toLowerCase()
    return haystack.includes(q) || bot.tags.some((t) => t.includes(q))
  })
}
