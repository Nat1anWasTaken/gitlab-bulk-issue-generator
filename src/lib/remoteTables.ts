import sheetsData from "@/data/sheets.json"
import { parseCsvTable } from "@/lib/csv"
import type { TableData } from "@/lib/types"

type SheetsConfig = {
  spreadsheetUrl: string
  spreadsheetId: string
}

const sheetsConfig = sheetsData as SheetsConfig

const sheetSnapshotPattern =
  /\[21350203,"(\[[\s\S]*?\])"\](?=,\[|\]\])/g

function buildCsvExportUrl(sheetName: string) {
  const params = new URLSearchParams({
    tqx: "out:csv",
    sheet: sheetName,
  })

  return `https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}/gviz/tq?${params.toString()}`
}

export const spreadsheetUrl = sheetsConfig.spreadsheetUrl

function parseSheetNamesFromHtml(html: string) {
  const names = new Set<string>()

  for (const match of html.matchAll(sheetSnapshotPattern)) {
    try {
      const snapshot = JSON.parse(JSON.parse(`"${match[1]}"`)) as unknown
      const name = getSheetNameFromSnapshot(snapshot)

      if (name) {
        names.add(name)
      }
    } catch {
      continue
    }
  }

  return Array.from(names)
}

function getSheetNameFromSnapshot(snapshot: unknown): string | null {
  if (!Array.isArray(snapshot)) {
    return null
  }

  const metadata = snapshot[3]

  if (!Array.isArray(metadata)) {
    return null
  }

  const firstEntry = metadata[0]

  if (!isRecord(firstEntry) || !Array.isArray(firstEntry["1"])) {
    return null
  }

  const titleRow = firstEntry["1"][0]

  if (!Array.isArray(titleRow) || typeof titleRow[2] !== "string") {
    return null
  }

  return titleRow[2]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

async function fetchSheetNames(signal?: AbortSignal) {
  const response = await fetch(sheetsConfig.spreadsheetUrl, {
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `無法載入資料表清單：${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()
  const sheetNames = parseSheetNamesFromHtml(html)

  if (sheetNames.length === 0) {
    throw new Error("無法從 Google Sheets 頁面讀取工作表清單。")
  }

  return sheetNames
}

export async function fetchRemoteTables(signal?: AbortSignal): Promise<TableData[]> {
  const sheetNames = await fetchSheetNames(signal)
  const tables = await Promise.all(
    sheetNames.map(async (sheetName) => {
      const response = await fetch(buildCsvExportUrl(sheetName), {
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
