import type {
  ExplorationPanelSnapshot,
  GridPanelSnapshot,
  SharePageId,
  ShareSnapshotV1,
  ShareSourceMode,
  TimeSeriesComparePanelSnapshot,
  TimeSeriesPanelSnapshot,
} from '@application/share/shareSnapshot'

function setIfPresent(
  query: Record<string, string>,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value === undefined || value === '') return
  query[key] = String(value)
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false
  return undefined
}

function parseNumberList(value: string | undefined): number[] | undefined {
  if (!value) return undefined
  const items = value.split(',').map((item) => Number(item.trim())).filter(Number.isFinite)
  return items.length > 0 ? items : undefined
}

function parseStringList(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  const items = value.split(',').map((item) => item.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

function encodeExploration(prefix: string, snapshot: ExplorationPanelSnapshot): Record<string, string> {
  const query: Record<string, string> = {}
  setIfPresent(query, `${prefix}country`, snapshot.countryCode)
  setIfPresent(query, `${prefix}var`, snapshot.variable)
  setIfPresent(query, `${prefix}year`, snapshot.year)
  setIfPresent(query, `${prefix}age`, snapshot.age)
  setIfPresent(query, `${prefix}pop`, snapshot.pop)
  setIfPresent(query, `${prefix}method`, snapshot.method)
  setIfPresent(query, `${prefix}popView`, snapshot.populationViewMode)
  setIfPresent(query, `${prefix}approxMode`, snapshot.approxPartitionMode)
  if (snapshot.customBreakpoints?.length) {
    query[`${prefix}breakpoints`] = snapshot.customBreakpoints.join(',')
  }
  setIfPresent(query, `${prefix}drill`, snapshot.drillLevel)
  setIfPresent(query, `${prefix}hist`, snapshot.showHistogram ? 1 : undefined)
  setIfPresent(query, `${prefix}trap`, snapshot.showTrapezoids ? 1 : undefined)
  setIfPresent(query, `${prefix}logRichScale`, snapshot.logRichScale ? 1 : undefined)
  setIfPresent(query, `${prefix}logX`, snapshot.logScaleX ? 1 : undefined)
  setIfPresent(query, `${prefix}logY`, snapshot.logScaleY ? 1 : undefined)
  setIfPresent(query, `${prefix}view`, snapshot.originalViewMode)
  setIfPresent(query, `${prefix}lorenz`, snapshot.lorenzCurve ? 1 : undefined)
  setIfPresent(query, `${prefix}cdf`, snapshot.empiricalCdf ? 1 : undefined)
  setIfPresent(query, `${prefix}pdf`, snapshot.empiricalPdf ? 1 : undefined)
  setIfPresent(query, `${prefix}empDist`, snapshot.showEmpiricalDistribution === false ? 0 : undefined)
  setIfPresent(query, `${prefix}smooth`, snapshot.showSmoothDistribution ? 1 : undefined)
  if (snapshot.hiddenApproxIntervals?.length) {
    query[`${prefix}hidden`] = snapshot.hiddenApproxIntervals.join(',')
  }
  return query
}

function decodeExploration(prefix: string, query: Record<string, string | string[] | undefined>): ExplorationPanelSnapshot {
  const read = (key: string) => {
    const raw = query[`${prefix}${key}`]
    return Array.isArray(raw) ? raw[0] : raw
  }

  return {
    countryCode: read('country'),
    variable: read('var'),
    year: parseNumber(read('year')),
    age: read('age'),
    pop: read('pop'),
    method: read('method') as ExplorationPanelSnapshot['method'],
    populationViewMode: read('popView') as ExplorationPanelSnapshot['populationViewMode'],
    approxPartitionMode: read('approxMode') as ExplorationPanelSnapshot['approxPartitionMode'],
    customBreakpoints: parseNumberList(read('breakpoints')),
    drillLevel: parseNumber(read('drill')),
    showHistogram: parseBoolean(read('hist')),
    showTrapezoids: parseBoolean(read('trap')),
    logRichScale: parseBoolean(read('logRichScale')) ?? parseBoolean(read('logRich')),
    logScaleX: parseBoolean(read('logX')),
    logScaleY: parseBoolean(read('logY')),
    originalViewMode: read('view') as ExplorationPanelSnapshot['originalViewMode'],
    lorenzCurve: parseBoolean(read('lorenz')),
    empiricalCdf: parseBoolean(read('cdf')),
    empiricalPdf: parseBoolean(read('pdf')),
    showEmpiricalDistribution: parseBoolean(read('empDist')),
    showSmoothDistribution: parseBoolean(read('smooth')),
    hiddenApproxIntervals: parseNumberList(read('hidden')),
  }
}

function encodeTimeSeries(prefix: string, snapshot: TimeSeriesPanelSnapshot): Record<string, string> {
  const query: Record<string, string> = {}
  setIfPresent(query, `${prefix}country`, snapshot.countryCode)
  setIfPresent(query, `${prefix}var`, snapshot.variable)
  setIfPresent(query, `${prefix}age`, snapshot.age)
  setIfPresent(query, `${prefix}pop`, snapshot.pop)
  setIfPresent(query, `${prefix}partition`, snapshot.partitionMode)
  if (snapshot.customBreakpoints?.length) {
    query[`${prefix}breakpoints`] = snapshot.customBreakpoints.join(',')
  }
  return query
}

function decodeTimeSeries(prefix: string, query: Record<string, string | string[] | undefined>): TimeSeriesPanelSnapshot {
  const read = (key: string) => {
    const raw = query[`${prefix}${key}`]
    return Array.isArray(raw) ? raw[0] : raw
  }

  return {
    countryCode: read('country'),
    variable: read('var'),
    age: read('age'),
    pop: read('pop'),
    partitionMode: read('partition') as TimeSeriesPanelSnapshot['partitionMode'],
    customBreakpoints: parseNumberList(read('breakpoints')),
  }
}

function encodeCompare(prefix: string, snapshot: TimeSeriesComparePanelSnapshot): Record<string, string> {
  const query: Record<string, string> = {}
  if (snapshot.countryCodes?.length) {
    query[`${prefix}countries`] = snapshot.countryCodes.join(',')
  }
  setIfPresent(query, `${prefix}var`, snapshot.variable)
  setIfPresent(query, `${prefix}percentile`, snapshot.percentile)
  setIfPresent(query, `${prefix}customLo`, snapshot.customLo)
  setIfPresent(query, `${prefix}customHi`, snapshot.customHi)
  setIfPresent(query, `${prefix}decileSub`, snapshot.decileSubSelection)
  setIfPresent(query, `${prefix}age`, snapshot.age)
  setIfPresent(query, `${prefix}pop`, snapshot.pop)
  return query
}

function decodeCompare(prefix: string, query: Record<string, string | string[] | undefined>): TimeSeriesComparePanelSnapshot {
  const read = (key: string) => {
    const raw = query[`${prefix}${key}`]
    return Array.isArray(raw) ? raw[0] : raw
  }

  return {
    countryCodes: parseStringList(read('countries')),
    variable: read('var'),
    percentile: read('percentile'),
    customLo: parseNumber(read('customLo')),
    customHi: parseNumber(read('customHi')),
    decileSubSelection: read('decileSub'),
    age: read('age'),
    pop: read('pop'),
  }
}

function encodePanelState(
  prefix: string,
  type: GridPanelSnapshot['type'],
  state: GridPanelSnapshot['state'],
): Record<string, string> {
  if (type === 'exploration') {
    return encodeExploration(prefix, state as ExplorationPanelSnapshot)
  }
  if (type === 'temps-compare') {
    return encodeCompare(prefix, state as TimeSeriesComparePanelSnapshot)
  }
  return encodeTimeSeries(prefix, state as TimeSeriesPanelSnapshot)
}

function decodePanelState(
  prefix: string,
  type: GridPanelSnapshot['type'],
  query: Record<string, string | string[] | undefined>,
): GridPanelSnapshot['state'] {
  if (type === 'exploration') return decodeExploration(prefix, query)
  if (type === 'temps-compare') return decodeCompare(prefix, query)
  return decodeTimeSeries(prefix, query)
}

export function encodeFlatShareQuery(snapshot: ShareSnapshotV1): Record<string, string> {
  const query: Record<string, string> = { v: '1' }
  setIfPresent(query, 'source', snapshot.sourceId)

  if (snapshot.page === 'grille') {
    setIfPresent(query, 'sourceMode', snapshot.sourceMode)
    if (snapshot.panels?.length) {
      query.panels = snapshot.panels.map((panel) => panel.type).join(',')
      snapshot.panels.forEach((panel, index) => {
        const prefix = `p${index}.`
        if (panel.sourceId) setIfPresent(query, `${prefix}source`, panel.sourceId)
        Object.assign(query, encodePanelState(prefix, panel.type, panel.state))
      })
    }
    return query
  }

  if (snapshot.page === 'exploration' && snapshot.exploration) {
    Object.assign(query, encodeExploration('', snapshot.exploration))
    return query
  }

  if (snapshot.page === 'temps') {
    if (snapshot.timeSeries) Object.assign(query, encodeTimeSeries('ts.', snapshot.timeSeries))
    if (snapshot.compare) Object.assign(query, encodeCompare('cmp.', snapshot.compare))
    return query
  }

  return query
}

function readQueryValue(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const raw = query[key]
  return Array.isArray(raw) ? raw[0] : raw ?? undefined
}

export function decodeFlatShareQuery(
  query: Record<string, string | string[] | undefined>,
  page: SharePageId,
): ShareSnapshotV1 | null {
  const version = readQueryValue(query, 'v')
  if (version !== '1') return null

  const sourceId = readQueryValue(query, 'source')
  if (!sourceId) return null

  if (page === 'exploration') {
    return {
      v: 1,
      page,
      sourceId,
      exploration: decodeExploration('', query),
    }
  }

  if (page === 'temps') {
    return {
      v: 1,
      page,
      sourceId,
      timeSeries: decodeTimeSeries('ts.', query),
      compare: decodeCompare('cmp.', query),
    }
  }

  const panelsRaw = readQueryValue(query, 'panels')
  if (!panelsRaw) {
    return { v: 1, page, sourceId, sourceMode: readQueryValue(query, 'sourceMode') as ShareSourceMode | undefined, panels: [] }
  }

  const types = panelsRaw.split(',').map((item) => item.trim()).filter(Boolean) as GridPanelSnapshot['type'][]
  const panels: GridPanelSnapshot[] = types.map((type, index) => {
    const prefix = `p${index}.`
    return {
      type,
      sourceId: readQueryValue(query, `${prefix}source`),
      state: decodePanelState(prefix, type, query),
    }
  })

  return {
    v: 1,
    page,
    sourceId,
    sourceMode: readQueryValue(query, 'sourceMode') as ShareSourceMode | undefined,
    panels,
  }
}
