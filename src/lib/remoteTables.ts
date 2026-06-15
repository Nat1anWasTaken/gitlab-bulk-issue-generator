import sheetsData from "@/data/sheets.json"
import { parseCsvTable } from "@/lib/csv"
import { buildCsvExportUrl, fetchSheetNames } from "@/lib/googleSheets"
import type { TableData } from "@/lib/types"

type SheetsConfig = {
  spreadsheetUrl: string
  spreadsheetId: string
}

type SheetsData = {
  tables: SheetsConfig
}

const sheetsConfig = (sheetsData as SheetsData).tables

export const spreadsheetUrl = sheetsConfig.spreadsheetUrl

export async function fetchRemoteTables(signal?: AbortSignal): Promise<TableData[]> {
  const sheetNames = await fetchSheetNames(sheetsConfig, signal)
  const tables = await Promise.all(
    sheetNames.map(async (sheetName) => {
      const response = await fetch(buildCsvExportUrl(sheetsConfig, sheetName), {
        cache: "no-store",
        signal,
      })

      if (!response.ok) {
        throw new Error(
          `無法載入 ${sheetName}：${response.status} ${response.statusText}`,
        )
      }

      const csvText = await response.text()

      return parseCsvTable({
        id: `remote:${sheetName}`,
        name: sheetName,
        source: "remote",
        csvText,
      })
    }),
  )

  return tables.sort((left, right) => left.name.localeCompare(right.name))
}
