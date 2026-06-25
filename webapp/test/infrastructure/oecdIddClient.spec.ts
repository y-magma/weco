import { describe, expect, it } from 'vitest'
import { buildOecdDataPath, findOecdIndicator } from '@infrastructure/data-sources/oecd-idd/oecdIddCatalog'
import { parseOecdIddCsv } from '@infrastructure/data-sources/oecd-idd/oecdIddClient'
import {
  isOecdDecileBundleVariable,
  isOecdDecileRatioId,
  OECD_DECILE_BUNDLE_ID,
} from '@infrastructure/data-sources/oecd-idd/oecdDeciles'
import { listOecdCountries, toIso3 } from '@infrastructure/data-sources/oecd-idd/oecdIddCountries'
import { createOecdIddDataSource } from '@infrastructure/data-sources/oecd-idd/oecdIddSource'

const SAMPLE_CSV = `STRUCTURE,STRUCTURE_ID,STRUCTURE_NAME,ACTION,REF_AREA,Reference area,FREQ,Frequency of observation,MEASURE,Measure,STATISTICAL_OPERATION,Statistical operation,UNIT_MEASURE,Unit of measure,AGE,Age,METHODOLOGY,Methodology,DEFINITION,Definition,POVERTY_LINE,Poverty line,TIME_PERIOD,Time period,OBS_VALUE,Observation value,OBS_STATUS,Observation status
DATAFLOW,OECD.WISE.INE:DSD_WISE_IDD@DF_IDD(1.0),Income distribution database,I,FRA,France,A,Annual,INC_DISP_GINI,Gini (disposable income),_Z,Not applicable,0_TO_1,0-1 scale,_T,Total,METH2012,Income definition since 2012,D_CUR,Current definition,_Z,Not applicable,2022,,0.297,,A,Normal value
DATAFLOW,OECD.WISE.INE:DSD_WISE_IDD@DF_IDD(1.0),Income distribution database,I,FRA,France,A,Annual,INC_DISP_GINI,Gini (disposable income),_Z,Not applicable,0_TO_1,0-1 scale,_T,Total,METH2012,Income definition since 2012,D_CUR,Current definition,_Z,Not applicable,2021,,0.298,,A,Normal value
DATAFLOW,OECD.WISE.INE:DSD_WISE_IDD@DF_IDD(1.0),Income distribution database,I,FRA,France,A,Annual,INC_DISP_GINI,Gini (disposable income),_Z,Not applicable,0_TO_1,0-1 scale,_T,Total,METH2012,Income definition since 2012,D_CUR,Current definition,_Z,Not applicable,2020,,0.278,,A,Normal value`

describe('oecdIddCatalog', () => {
  it('builds SDMX path for disposable income Gini', () => {
    const indicator = findOecdIndicator('INC_DISP_GINI')
    expect(indicator).toBeDefined()
    expect(buildOecdDataPath(indicator!, 'FRA')).toBe(
      'FRA.A.INC_DISP_GINI._Z.0_TO_1._T.METH2012.D_CUR._Z.',
    )
  })

  it('builds SDMX path for poverty rate at 50% median', () => {
    const indicator = findOecdIndicator('PR_INC_DISP_50')
    expect(buildOecdDataPath(indicator!, 'FRA')).toBe(
      'FRA.A.PR_INC_DISP._Z.PT_POP._T.METH2012.D_CUR.PL_50.',
    )
  })
})

describe('oecdIddCountries', () => {
  it('maps ISO-2 to ISO-3 for OECD members', () => {
    expect(toIso3('FR')).toBe('FRA')
    expect(toIso3('us')).toBe('USA')
    expect(toIso3('XX')).toBeUndefined()
  })

  it('lists countries with ISO-2 codes', () => {
    const countries = listOecdCountries()
    expect(countries.length).toBeGreaterThanOrEqual(38)
    expect(countries.find((item) => item.code === 'FR')).toMatchObject({
      code: 'FR',
      label: expect.stringContaining('France'),
    })
  })
})

describe('parseOecdIddCsv', () => {
  it('extracts year/value pairs and sorts by year', () => {
    const points = parseOecdIddCsv(SAMPLE_CSV)
    expect(points).toEqual([
      { year: 2020, value: 0.278 },
      { year: 2021, value: 0.298 },
      { year: 2022, value: 0.297 },
    ])
  })

  it('returns empty array for invalid CSV', () => {
    expect(parseOecdIddCsv('')).toEqual([])
    expect(parseOecdIddCsv('foo,bar')).toEqual([])
  })
})

describe('oecd decile bundle', () => {
  it('identifies bundle and ratio ids', () => {
    expect(isOecdDecileBundleVariable(OECD_DECILE_BUNDLE_ID)).toBe(true)
    expect(isOecdDecileRatioId('D9_1_INC_DISP')).toBe(true)
    expect(isOecdDecileRatioId('INC_DISP_GINI')).toBe(false)
  })

  it('requires a ratio id when fetching the decile bundle', async () => {
    const oecd = createOecdIddDataSource()
    await expect(oecd.fetchVariableTimeSeries({
      countryCode: 'FR',
      variable: OECD_DECILE_BUNDLE_ID,
      age: '',
      pop: '',
    })).rejects.toThrow(/ratio décile/)
  })
})
