import { computed, ref } from 'vue'
import {
  getSpecBlocks,
  resolveSpecLink,
  type SpecBlock,
  type SpecDoc,
} from '@src/spec/specDocs'
import { renderMarkdown } from '@src/spec/renderMarkdown'

/**
 * State for the `/spec` page: the block tree, the currently selected document,
 * its rendered HTML, and in-app navigation for relative `.md` links.
 */
export function useSpec() {
  const blocks = ref<SpecBlock[]>(getSpecBlocks())

  const docs = computed<SpecDoc[]>(() => blocks.value.flatMap((block) => block.docs))

  const selectedId = ref<string>(
    docs.value.find((doc) => doc.id === 'version1.md')?.id
    ?? docs.value[0]?.id
    ?? '',
  )

  const current = computed<SpecDoc | null>(
    () => docs.value.find((doc) => doc.id === selectedId.value) ?? null,
  )

  const renderedHtml = computed<string>(() =>
    current.value ? renderMarkdown(current.value.raw) : '',
  )

  const select = (id: string) => {
    if (docs.value.some((doc) => doc.id === id)) {
      selectedId.value = id
    }
  }

  /**
   * Handle a click inside the rendered content: if it targets a relative `.md`
   * link that maps to a known doc, navigate in-app instead of following it.
   * Returns true when the click was handled.
   */
  const handleContentClick = (event: MouseEvent): boolean => {
    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (!anchor) return false
    const href = anchor.getAttribute('href')
    if (!href || !current.value) return false

    const target = resolveSpecLink(current.value.id, href)
    if (target && docs.value.some((doc) => doc.id === target)) {
      event.preventDefault()
      select(target)
      return true
    }
    return false
  }

  return {
    blocks,
    docs,
    selectedId,
    current,
    renderedHtml,
    select,
    handleContentClick,
  }
}
