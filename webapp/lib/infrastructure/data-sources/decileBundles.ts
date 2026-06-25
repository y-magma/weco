import {
  isOecdDecileBundleVariable,
  OECD_DECILE_BUNDLE_ID,
  OECD_DECILE_RATIO_IDS,
  OECD_DECILE_RATIO_OPTIONS,
} from '@infrastructure/data-sources/oecd-idd/oecdDeciles'
import {
  isPipDecileBundleVariable,
  PIP_DECILE_BUNDLE_ID,
  PIP_DECILE_IDS,
  PIP_DECILE_OPTIONS,
} from '@infrastructure/data-sources/worldbank/worldBankDeciles'
import {
  isWdiQuintileBundleVariable,
  WDI_QUINTILE_BUNDLE_ID,
  WDI_QUINTILE_IDS,
  WDI_QUINTILE_OPTIONS,
} from '@infrastructure/data-sources/worldbank/worldBankQuintiles'

export interface DecileBundleOption {
  id: string
  label: string
  shortLabel?: string
}

export interface DecileBundleConfig {
  bundleId: string
  options: readonly DecileBundleOption[]
  /** Label for compare-panel sub-selector. */
  subSelectorLabel: string
  /** Time-series subtitle fragment. */
  seriesSubtitle: string
}

export function isDecileBundleVariable(id: string): boolean {
  return isOecdDecileBundleVariable(id)
    || isPipDecileBundleVariable(id)
    || isWdiQuintileBundleVariable(id)
}

export function getDecileBundleConfig(variableId: string): DecileBundleConfig | undefined {
  if (isOecdDecileBundleVariable(variableId)) {
    return {
      bundleId: OECD_DECILE_BUNDLE_ID,
      options: OECD_DECILE_RATIO_OPTIONS,
      subSelectorLabel: 'Ratio décile',
      seriesSubtitle: 'ratios inter-déciles',
    }
  }
  if (isPipDecileBundleVariable(variableId)) {
    return {
      bundleId: PIP_DECILE_BUNDLE_ID,
      options: PIP_DECILE_OPTIONS,
      subSelectorLabel: 'Décile',
      seriesSubtitle: 'parts par décile',
    }
  }
  if (isWdiQuintileBundleVariable(variableId)) {
    return {
      bundleId: WDI_QUINTILE_BUNDLE_ID,
      options: WDI_QUINTILE_OPTIONS,
      subSelectorLabel: 'Quintile',
      seriesSubtitle: 'parts par quintile',
    }
  }
  return undefined
}

export function decileBundleSubIds(variableId: string): readonly string[] {
  const config = getDecileBundleConfig(variableId)
  return config?.options.map((item) => item.id) ?? []
}

export function decileBundleSubIdsForLoad(variableId: string): readonly string[] {
  if (isOecdDecileBundleVariable(variableId)) return OECD_DECILE_RATIO_IDS
  if (isPipDecileBundleVariable(variableId)) return PIP_DECILE_IDS
  if (isWdiQuintileBundleVariable(variableId)) return WDI_QUINTILE_IDS
  return []
}

export function labelForDecileBundleSub(
  variableId: string,
  subId: string,
): string | undefined {
  return getDecileBundleConfig(variableId)?.options.find((item) => item.id === subId)?.label
}
