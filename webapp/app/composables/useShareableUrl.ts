import {
  buildShareUrl,
  decodeShareQuery,
  encodeShareQuery,
  isShareUrlTooLong,
} from '@application/share/shareCodec'
import type { SharePageId, ShareSnapshotV1 } from '@application/share/shareSnapshot'
import type { WatchSource } from 'vue'
import type { LocationQuery } from 'vue-router'

const SHARE_REGISTRY_KEY = Symbol('shareRegistry')
const SHARE_SYNC_KEY = Symbol('shareSync')

const SHARE_STATE_KEY = 'share-url-state'

interface ShareUrlGlobalState {
  page: SharePageId | null
  buildSnapshot: (() => ShareSnapshotV1) | null
}

function useShareUrlGlobalState() {
  return useState<ShareUrlGlobalState>(SHARE_STATE_KEY, () => ({
    page: null,
    buildSnapshot: null,
  }))
}

const SHAREABLE_ROUTE_PATHS = new Set([
  '/panneau/exploration',
  '/panneau/temps',
  '/grille',
])

export interface ShareRegistry {
  register: (key: string, getter: () => unknown) => () => void
  getSnapshot: (key: string) => unknown | undefined
}

export interface ShareableUrlProviderOptions {
  page: SharePageId
  buildSnapshot: (registry: ShareRegistry) => ShareSnapshotV1
  watchSources?: WatchSource<unknown>[]
}

function createShareRegistry(): ShareRegistry {
  const registrations = new Map<string, () => unknown>()

  return {
    register(key, getter) {
      registrations.set(key, getter)
      return () => {
        registrations.delete(key)
      }
    },
    getSnapshot(key) {
      return registrations.get(key)?.()
    },
  }
}

function normalizeRouteQuery(
  query: LocationQuery,
): Record<string, string | string[] | undefined> {
  const normalized: Record<string, string | string[] | undefined> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      const filtered = value.filter((item): item is string => item != null)
      if (filtered.length > 0) normalized[key] = filtered
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

function routeQueryToSearchParams(query: LocationQuery): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, item)
      }
    } else {
      params.set(key, value)
    }
  }
  return params
}

function normalizeRoutePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

export function isShareableRoute(path: string): boolean {
  return SHAREABLE_ROUTE_PATHS.has(normalizeRoutePath(path))
}

export function useShareableUrlProvider(options: ShareableUrlProviderOptions) {
  const route = useRoute()
  const router = useRouter()
  const registry = createShareRegistry()
  const hydrating = ref(true)
  const shareState = useShareUrlGlobalState()

  provide(SHARE_REGISTRY_KEY, registry)

  shareState.value = {
    page: options.page,
    buildSnapshot: () => options.buildSnapshot(registry),
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  function syncToRoute() {
    if (hydrating.value) return

    const snapshot = options.buildSnapshot(registry)
    const query = encodeShareQuery(snapshot)
    const nextQuery = new URLSearchParams(query).toString()
    const currentQuery = routeQueryToSearchParams(route.query).toString()
    if (nextQuery === currentQuery) return

    router.replace({ path: route.path, query })
  }

  function scheduleSync() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      syncToRoute()
    }, 300)
  }

  provide(SHARE_SYNC_KEY, scheduleSync)

  if (options.watchSources) {
    for (const source of options.watchSources) {
      watch(source, scheduleSync, { deep: true })
    }
  }

  onMounted(() => {
    nextTick(() => {
      hydrating.value = false
      scheduleSync()
    })
  })

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    shareState.value = { page: null, buildSnapshot: null }
  })

  return {
    registry,
    scheduleSync,
    hydrating,
    decodeInitialSnapshot: () => {
      const decoded = decodeShareQuery(normalizeRouteQuery(route.query), options.page)
      if (!decoded || decoded.page !== options.page) return null
      return decoded
    },
  }
}

export function useShareablePanelRegistration(key: string, getSnapshot: () => unknown) {
  const registry = inject<ShareRegistry | null>(SHARE_REGISTRY_KEY, null)
  const scheduleSync = inject<(() => void) | null>(SHARE_SYNC_KEY, null)

  onMounted(() => {
    const unregister = registry?.register(key, getSnapshot)
    onUnmounted(() => unregister?.())
  })

  function triggerSync() {
    scheduleSync?.()
  }

  return { triggerSync }
}

export function useShareableUrlSync() {
  return inject<(() => void) | null>(SHARE_SYNC_KEY, null)
}

export function useShareableUrl() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const shareState = useShareUrlGlobalState()

  const canShare = computed(
    () => isShareableRoute(route.path) && shareState.value.buildSnapshot !== null,
  )

  function resolveSnapshot(): ShareSnapshotV1 | null {
    return shareState.value.buildSnapshot?.() ?? null
  }

  function getShareUrl(): string | null {
    const snapshot = resolveSnapshot()
    if (!snapshot) return null
    const origin = import.meta.client ? window.location.origin : undefined
    return buildShareUrl(route.path, snapshot, config.app.baseURL || '/', origin)
  }

  async function copyShareUrl(): Promise<{
    ok: boolean
    tooLong: boolean
  }> {
    const snapshot = resolveSnapshot()
    if (!snapshot) return { ok: false, tooLong: false }

    const queryString = new URLSearchParams(encodeShareQuery(snapshot)).toString()
    const tooLong = isShareUrlTooLong(queryString)
    const origin = import.meta.client ? window.location.origin : undefined
    const url = buildShareUrl(route.path, snapshot, config.app.baseURL || '/', origin)

    try {
      await navigator.clipboard.writeText(url)
      return { ok: true, tooLong }
    } catch {
      return { ok: false, tooLong }
    }
  }

  return {
    canShare,
    providerPage: computed(() => shareState.value.page),
    getShareUrl,
    copyShareUrl,
  }
}

export function decodeRouteShareSnapshot(
  query: LocationQuery,
  page: SharePageId,
): ShareSnapshotV1 | null {
  return decodeShareQuery(normalizeRouteQuery(query), page)
}
