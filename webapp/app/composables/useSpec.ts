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

  return {
    blocks,
    docs,
    selectedId,
    selectedDoc,
    renderedHtml,
    selectDoc,
    resolveLink,
  }
}
