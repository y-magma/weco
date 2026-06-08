/**
 * Loads every Markdown file from the repository `spec/` folder (blocks A–E plus
 * the root documents) at build time via Vite's `import.meta.glob`, and exposes
 * them as a structured, ordered tree for the `/spec` page.
 *
 * The raw content is inlined into the bundle, so the page works in `nuxt dev`,
 * static `nuxt generate`, and the prerendered build alike.
 */

const modules = import.meta.glob('../../../spec/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type SpecBlockId = 'A' | 'B' | 'C' | 'D' | 'E' | 'root'

export interface SpecDoc {
  /** Path relative to `spec/`, e.g. `A-raw-data/A1-ce-qu-on-veut-observer.md`. */
  id: string
  /** Display title (first H1, else the file name). */
  title: string
  block: SpecBlockId
  /** Sort key within a block, e.g. `A1`, `B3`, `C2`. */
  code: string
  raw: string
}

export interface SpecBlock {
  id: SpecBlockId
  label: string
  docs: SpecDoc[]
}

const BLOCK_LABELS: Record<SpecBlockId, string> = {
  A: 'A — Données brutes',
  B: 'B — Données nettoyées',
  C: 'C — Visualisations',
  D: 'D — Statistiques',
  E: 'E — Modèles économiques',
  root: 'Vue d’ensemble',
}

const BLOCK_ORDER: SpecBlockId[] = ['root', 'A', 'B', 'C', 'D', 'E']

/** Priority of root documents (lower = first). */
const ROOT_ORDER: Record<string, number> = {
  'README.md': 0,
  'plan.md': 1,
  'version1.md': 2,
  'perimetre-mvp.md': 3,
  'critique-plan-et-spec.md': 4,
}

function relativeId(globKey: string): string {
  const marker = '/spec/'
  const index = globKey.indexOf(marker)
  return index >= 0 ? globKey.slice(index + marker.length) : globKey
}

function blockOf(id: string): SpecBlockId {
  const head = id.charAt(0).toUpperCase()
  if (id.startsWith('A-')) return 'A'
  if (id.startsWith('B-')) return 'B'
  if (id.startsWith('C-')) return 'C'
  if (id.startsWith('D-')) return 'D'
  if (id.startsWith('E-')) return 'E'
  void head
  return 'root'
}

function titleOf(raw: string, id: string): string {
  const match = raw.match(/^#\s+(.+?)\s*$/m)
  if (match) return match[1]!.trim()
  const file = id.split('/').pop() ?? id
  return file.replace(/\.md$/i, '')
}

/** Extract a sort code like `A1`, `B3`, `C2` from a path, else the file name. */
function codeOf(id: string): string {
  const file = id.split('/').pop() ?? id
  const match = file.match(/^([A-E]\d+)/i)
  if (match) return match[1]!.toUpperCase()
  return file.toLowerCase()
}

function buildDocs(): SpecDoc[] {
  return Object.entries(modules).map(([key, raw]) => {
    const id = relativeId(key)
    return {
      id,
      title: titleOf(raw, id),
      block: blockOf(id),
      code: codeOf(id),
      raw,
    }
  })
}

export function getSpecBlocks(): SpecBlock[] {
  const docs = buildDocs()

  const blocks: SpecBlock[] = BLOCK_ORDER.map((id) => ({
    id,
    label: BLOCK_LABELS[id],
    docs: docs.filter((doc) => doc.block === id),
  }))

  for (const block of blocks) {
    block.docs.sort((a, b) => {
      if (block.id === 'root') {
        const oa = ROOT_ORDER[a.id] ?? 99
        const ob = ROOT_ORDER[b.id] ?? 99
        if (oa !== ob) return oa - ob
      }
      return a.id.localeCompare(b.id, 'fr')
    })
  }

  return blocks.filter((block) => block.docs.length > 0)
}

/** Resolve a relative Markdown link (e.g. `../plan.md`) against a doc id. */
export function resolveSpecLink(fromId: string, href: string): string | null {
  if (!href || /^https?:|^#|^mailto:/i.test(href)) return null
  const clean = href.split('#')[0]!.split('?')[0]!
  if (!clean.endsWith('.md')) return null

  const fromDir = fromId.includes('/') ? fromId.slice(0, fromId.lastIndexOf('/')) : ''
  const segments = (fromDir ? fromDir.split('/') : []).concat(clean.split('/'))
  const stack: string[] = []
  for (const segment of segments) {
    if (segment === '.' || segment === '') continue
    if (segment === '..') stack.pop()
    else stack.push(segment)
  }
  return stack.join('/')
}
