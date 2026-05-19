import * as React from "react"

import projectsData from "@/data/projects.json"
import { DataSourcePanel } from "@/components/DataSourcePanel"
import { GeneratedPreview } from "@/components/GeneratedPreview"
import { IssueTemplateEditor } from "@/components/IssueTemplateEditor"
import { ProjectSelector } from "@/components/ProjectSelector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import type { GitLabProject, IssueTemplate, TableData } from "@/lib/types"
import { generateIssues } from "@/lib/gitlabUrl"
import { parseUploadedCsvFile } from "@/lib/csv"
import { staticTables } from "@/lib/staticTables"
import { validateGitLabIssueNewUrl } from "@/lib/validation"

const STORAGE_KEYS = {
  customUrl: "gitlab-bulk-issues:custom-url",
  projectName: "gitlab-bulk-issues:project-name",
  tableId: "gitlab-bulk-issues:table-id",
}

const DEFAULT_TEMPLATE: IssueTemplate = {
  title: "{{task_title}}",
  issueType: "issue",
  issuableTemplate: "",
  descriptionTemplate: "",
  description: [
    "## Summary",
    "",
    "{{task_title}}",
    "",
    "- Team: {{team_name}}",
    "- Assignee: {{assignee}}",
  ].join("\n"),
  confidential: false,
  relatedIssueId: "{{related_issue_id}}",
}

const projects = projectsData as GitLabProject[]

function App() {
  const [template, setTemplate] = React.useState<IssueTemplate>(DEFAULT_TEMPLATE)
  const [customUrl, setCustomUrl] = React.useState(() =>
    window.localStorage.getItem(STORAGE_KEYS.customUrl) ?? ""
  )
  const [selectedProjectName, setSelectedProjectName] = React.useState(
    () => window.localStorage.getItem(STORAGE_KEYS.projectName) ?? projects[0]?.name ?? ""
  )
  const [uploadedTables, setUploadedTables] = React.useState<TableData[]>([])
  const [selectedTableId, setSelectedTableId] = React.useState(
    () => window.localStorage.getItem(STORAGE_KEYS.tableId) ?? staticTables[0]?.id ?? ""
  )
  const [selectedRowsByTable, setSelectedRowsByTable] = React.useState<Record<string, string[]>>({})
  const [uploadError, setUploadError] = React.useState("")
  const [openStatus, setOpenStatus] = React.useState("")

  const tables = React.useMemo(
    () => [...staticTables, ...uploadedTables].sort((left, right) => left.name.localeCompare(right.name)),
    [uploadedTables]
  )

  const selectedProject = React.useMemo(
    () => projects.find((project) => project.name === selectedProjectName) ?? projects[0],
    [selectedProjectName]
  )

  const selectedTable = React.useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? tables[0],
    [selectedTableId, tables]
  )

  React.useEffect(() => {
    if (!selectedProject) {
      return
    }

    window.localStorage.setItem(STORAGE_KEYS.projectName, selectedProject.name)
  }, [selectedProject])

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.customUrl, customUrl)
  }, [customUrl])

  React.useEffect(() => {
    if (!selectedTable?.id) {
      return
    }

    window.localStorage.setItem(STORAGE_KEYS.tableId, selectedTable.id)
  }, [selectedTable])

  const activeUrl = customUrl.trim() || selectedProject?.issueNewUrl || ""
  const activeUrlValidation = validateGitLabIssueNewUrl(activeUrl)
  const selectedRowIds = React.useMemo(() => {
    if (!selectedTable) {
      return new Set<string>()
    }

    return new Set(selectedRowsByTable[selectedTable.id] ?? selectedTable.rows.map((row) => row.id))
  }, [selectedRowsByTable, selectedTable])

  const generatedIssues = React.useMemo(() => {
    if (!selectedTable || !activeUrlValidation.isValid) {
      return []
    }

    return generateIssues(activeUrl, template, selectedTable, selectedRowIds)
  }, [activeUrl, activeUrlValidation.isValid, selectedRowIds, selectedTable, template])

  async function handleCsvUpload(file: File | null) {
    if (!file) {
      return
    }

    setUploadError("")

    try {
      const parsedTable = await parseUploadedCsvFile(file)

      setUploadedTables((current) => {
        const next = current.filter((table) => table.id !== parsedTable.id)
        return [...next, parsedTable]
      })
      setSelectedTableId(parsedTable.id)
      setSelectedRowsByTable((current) => ({
        ...current,
        [parsedTable.id]: parsedTable.rows.map((row) => row.id),
      }))
    } catch (error) {
      setUploadError(
        error instanceof Error ? `Could not parse CSV: ${error.message}` : "Could not parse CSV."
      )
    }
  }

  function updateTableSelection(tableId: string, rowIds: string[]) {
    setSelectedRowsByTable((current) => ({
      ...current,
      [tableId]: rowIds,
    }))
  }

  function handleOpenSelected(mode: "tabs" | "windows") {
    const readyIssues = generatedIssues.filter((issue) => issue.canOpen)

    let blockedCount = 0

    for (const issue of readyIssues) {
      const features =
        mode === "windows"
          ? "noopener,noreferrer,popup=yes,width=1280,height=900"
          : "noopener,noreferrer"
      const popup = window.open(issue.url, "_blank", features)

      if (!popup) {
        blockedCount += 1
      }
    }

    const targetLabel = mode === "tabs" ? "tab(s)" : "window(s)"

    if (blockedCount > 0) {
      setOpenStatus(
        `${readyIssues.length - blockedCount} ${targetLabel} opened. ${blockedCount} popup(s) were blocked. Use copy, download, or manual open as fallback.`
      )
      return
    }

    setOpenStatus(`${readyIssues.length} GitLab issue page(s) opened in new ${mode}.`)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <header className="flex flex-col gap-3">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              GitLab bulk issue opener
            </h1>
            <p className="mt-2 text-sm text-muted-foreground lg:text-base">
              Generate documented GitLab prefilled issue URLs from CSV rows, review them, then open one issue page per row for manual submission.
            </p>
          </div>
        </header>

        <Separator />

        <ProjectSelector
          projects={projects}
          selectedProjectUrl={selectedProject?.issueNewUrl ?? ""}
          selectedProjectName={selectedProject?.name ?? ""}
          customUrl={customUrl}
          activeUrl={activeUrl}
          activeUrlValidation={activeUrlValidation}
          onProjectChange={setSelectedProjectName}
          onCustomUrlChange={setCustomUrl}
        />

        {!activeUrlValidation.isValid ? (
          <Alert variant="destructive">
            <AlertTitle>Fix the target URL before opening issues</AlertTitle>
            <AlertDescription>{activeUrlValidation.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <IssueTemplateEditor
            value={template}
            availableColumns={selectedTable?.headers ?? []}
            onChange={setTemplate}
          />

          <DataSourcePanel
            tables={tables}
            selectedTableId={selectedTable?.id ?? ""}
            selectedTable={selectedTable}
            selectedRowIds={selectedRowIds}
            uploadError={uploadError}
            onTableChange={setSelectedTableId}
            onCsvUpload={(file) => void handleCsvUpload(file)}
            onSelectAll={() => {
              if (!selectedTable) {
                return
              }

              updateTableSelection(
                selectedTable.id,
                selectedTable.rows.map((row) => row.id)
              )
            }}
            onDeselectAll={() => {
              if (!selectedTable) {
                return
              }

              updateTableSelection(selectedTable.id, [])
            }}
            onToggleRow={(rowId) => {
              if (!selectedTable) {
                return
              }

              const next = new Set(
                selectedRowsByTable[selectedTable.id] ?? selectedTable.rows.map((row) => row.id)
              )

              if (next.has(rowId)) {
                next.delete(rowId)
              } else {
                next.add(rowId)
              }

              updateTableSelection(selectedTable.id, Array.from(next))
            }}
          />
        </section>

        <GeneratedPreview
          generatedIssues={generatedIssues}
          tableSelected={Boolean(selectedTable)}
          tableIsEmpty={Boolean(selectedTable && selectedTable.rows.length === 0)}
          activeUrlIsValid={activeUrlValidation.isValid}
          openStatus={openStatus}
          onOpenSelected={handleOpenSelected}
        />
      </div>
    </main>
  )
}

export default App
