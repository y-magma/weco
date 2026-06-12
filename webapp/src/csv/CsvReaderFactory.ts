import Papa from 'papaparse'
import { fetchText } from '@src/http/fetchJson'

export interface CsvParseResult {
  columns: string[]
  rows: Record<string, string>[]
  rawRowCount: number
}

export interface CsvReader {
  parse(): Promise<CsvParseResult>
}

export interface CsvReaderOptions {
  delimiter?: string
  skipEmptyLines?: boolean
}

function normalizeParseResult(
  parsed: Papa.ParseResult<Record<string, string>>,
): CsvParseResult {
  const rows = parsed.data.filter((row) =>
    Object.values(row).some((value) => value?.trim?.() !== ''),
  )
  const columns = parsed.meta.fields ?? Object.keys(rows[0] ?? {})

  return {
    columns,
    rows,
    rawRowCount: rows.length,
  }
}

class StringCsvReader implements CsvReader {
  constructor(
    private readonly content: string,
    private readonly options: CsvReaderOptions = {},
  ) {}

  parse(): Promise<CsvParseResult> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(this.content, {
        header: true,
        delimiter: this.options.delimiter,
        skipEmptyLines: this.options.skipEmptyLines ?? true,
        complete: (result) => resolve(normalizeParseResult(result)),
        error: (error) => reject(error),
      })
    })
  }
}

class FileCsvReader implements CsvReader {
  constructor(
    private readonly file: File,
    private readonly options: CsvReaderOptions = {},
  ) {}

  async parse(): Promise<CsvParseResult> {
    const content = await this.file.text()
    return new StringCsvReader(content, this.options).parse()
  }
}

class UrlCsvReader implements CsvReader {
  constructor(
    private readonly url: string,
    private readonly options: CsvReaderOptions = {},
  ) {}

  async parse(): Promise<CsvParseResult> {
    const content = await fetchText(this.url)
    return new StringCsvReader(content, this.options).parse()
  }
}

export type CsvReaderInput =
  | { type: 'file'; file: File }
  | { type: 'string'; content: string }
  | { type: 'url'; url: string }

export function createCsvReader(input: CsvReaderInput, options?: CsvReaderOptions): CsvReader {
  switch (input.type) {
    case 'file':
      return new FileCsvReader(input.file, options)
    case 'string':
      return new StringCsvReader(input.content, options)
    case 'url':
      return new UrlCsvReader(input.url, options)
    default:
      throw new Error('Unsupported CSV reader input')
  }
}

export function mapCsvToSeries(
  rows: Record<string, string>[],
  yearColumn: string,
  valueColumn: string,
  label: string,
) {
  const points = rows
    .map((row) => ({
      year: Number(row[yearColumn]),
      value: Number(row[valueColumn]),
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .sort((a, b) => a.year - b.year)

  return {
    id: `csv-${label}`,
    label,
    points,
    metadata: { source: 'csv' },
  }
}
