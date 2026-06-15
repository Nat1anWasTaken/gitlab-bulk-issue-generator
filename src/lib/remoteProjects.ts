import sheetsData from "@/data/sheets.json"
import { parseCsvTable } from "@/lib/csv"
import { buildCsvExportUrl, fetchSheetNames } from "@/lib/googleSheets"
import type { GitLabProject } from "@/lib/types"

type SheetsConfig = {
  spreadsheetUrl: string
  spreadsheetId: string
}

type SheetsData = {
  projects: SheetsConfig
}

const projectSheetsConfig = (sheetsData as SheetsData).projects

export const projectSpreadsheetUrl = projectSheetsConfig.spreadsheetUrl

function getProjectValue(
  values: Record<string, string>,
  candidates: string[],
): string {
  for (const candidate of candidates) {
    const value = values[candidate]?.trim()

    if (value) {
      return value
    }
  }

  return ""
}

export async function fetchRemoteProjects(
  signal?: AbortSignal,
): Promise<GitLabProject[]> {
  const sheetNames = await fetchSheetNames(projectSheetsConfig, signal)
  const projectsByUrl = new Map<string, GitLabProject>()

  for (const sheetName of sheetNames) {
    const response = await fetch(
      buildCsvExportUrl(projectSheetsConfig, sheetName),
      {
        cache: "no-store",
        signal,
      },
    )

    if (!response.ok) {
      throw new Error(
        `無法載入 ${sheetName}：${response.status} ${response.statusText}`,
      )
    }

    const csvText = await response.text()
    const table = parseCsvTable({
      id: `remote-projects:${sheetName}`,
      name: sheetName,
      source: "remote",
      csvText,
    })

    for (const row of table.rows) {
      const name = getProjectValue(row.values, ["name", "Name", "專案名稱"])
      const issueNewUrl = getProjectValue(row.values, [
        "issueNewUrl",
        "issue_new_url",
        "url",
        "URL",
        "GitLab URL",
        "開卡 URL",
      ])

      if (name && issueNewUrl) {
        projectsByUrl.set(issueNewUrl, { name, issueNewUrl })
      }
    }
  }

  return Array.from(projectsByUrl.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}
