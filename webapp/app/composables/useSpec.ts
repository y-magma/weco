import { computed, ref } from 'vue'
import {
  getSpecBlocks,
  resolveSpecLink,
  type SpecBlock,
  type SpecDoc,
} from '@application/bootstrap/specAdapter'
import { renderMarkdown } from '@application/bootstrap/specAdapter'

export function useSpec() {
  const blocks = ref<SpecBlock[]>(getSpecBlocks())

  const docs = computed<SpecDoc[]>(() => blocks.value.flatMap((block) => block.docs))

  const selectedId = ref<string>(
    docs.value.find((doc) => doc.id === 'version1.md')?.id
    ?? docs.value[0]?.id
    ?? '',
  )

  const selectedDoc = computed(() =>
    docs.value.find((doc) => doc.id === selectedId.value) ?? null,
  )

  const renderedHtml = computed(() => {
    const doc = selectedDoc.value
    if (!doc) return ''
    return renderMarkdown(doc.raw)
  })

  const selectDoc = (id: string) => {
    selectedId.value = id
  }

  const resolveLink = (href: string) => resolveSpecLink(href, selectedId.value)

  const handleContentClick = (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) return
    event.preventDefault()
    const resolved = resolveLink(href)
    if (resolved) selectDoc(resolved)
  }

  return {
    blocks,
    docs,
    selectedId,
    selectedDoc,
    current: selectedDoc,
    renderedHtml,
    selectDoc,
    select: selectDoc,
    resolveLink,
    handleContentClick,
  }
}
