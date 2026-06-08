import { Marked } from 'marked'

const marked = new Marked({
  gfm: true,
  breaks: false,
})

/** Render trusted (in-repo) Markdown to HTML. */
export function renderMarkdown(raw: string): string {
  return marked.parse(raw, { async: false }) as string
}
