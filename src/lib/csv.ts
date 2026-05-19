import Papa, { type ParseError } from "papaparse"

import type { TableData, TableRow } from "@/lib/types"

type CsvTableOptions = {
  id: string
  name: string
  source: TableData["source"]
  csvText: string
}

export function parseCsvTable({
  id,
  name,
  source,
  csvText,
}: CsvTableOptions): TableData {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: false,
  })

  if (result.errors.length > 0) {
    throw new Error(result.errors.map((error: ParseError) => error.message).join("; "))
  }

  const records = result.data.map((row: string[]) =>
    row.map((cell: string) => String(cell ?? ""))
  )

  if (records.length === 0) {
    return {
      id,
      name,
      source,
      headers: [],
      rows: [],
    }
  }

  const rawHeaders = records[0]
  const headers = rawHeaders.map((header: string, index: number) => {
    const trimmed = header.trim()
    return trimmed || `column_${index + 1}`
  })

  const rows: TableRow[] = records
    .slice(1)
    .filter((cells: string[]) => cells.some((cell: string) => cell !== ""))
    .map((cells: string[], index: number) => ({
      id: `${id}-${index + 1}`,
      index: index + 1,
      values: headers.reduce<Record<string, string>>(
        (
          accumulator: Record<string, string>,
          header: string,
          cellIndex: number
        ) => {
          accumulator[header] = cells[cellIndex] ?? ""
          return accumulator
        },
        {}
      ),
    }))

  return {
    id,
    name,
    source,
    headers,
    rows,
  }
}

export async function parseUploadedCsvFile(file: File) {
  const fileName = file.name.replace(/\.csv$/i, "")
  const csvText = await file.text()

  return parseCsvTable({
    id: `upload:${fileName}:${file.lastModified}`,
    name: fileName,
    source: "uploaded",
    csvText,
  })
}
