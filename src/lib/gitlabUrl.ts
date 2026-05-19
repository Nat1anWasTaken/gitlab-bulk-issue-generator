import type { GeneratedIssue, IssueTemplate, TableData } from "@/lib/types"
import { renderTemplate } from "@/lib/variables"
import { validateRelatedIssueId } from "@/lib/validation"

const URL_WARNING_LENGTH = 2000

function splitCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatAssigneeToken(value: string) {
  return value.startsWith("@") ? value : `@${value}`
}

function formatLabelToken(value: string) {
  const escaped = value.replace(/"/g, '\\"')

  if (/^[A-Za-z0-9_.\-?&@]+$/.test(value)) {
    return `~${value}`
  }

  return `~"${escaped}"`
}

function buildQuickActionsDescription(
  description: string,
  assignees: string,
  labels: string
) {
  const quickActions: string[] = []
  const assigneeValues = splitCommaSeparatedValues(assignees)
  const labelValues = splitCommaSeparatedValues(labels)

  if (assigneeValues.length > 0) {
    quickActions.push(`/assign ${assigneeValues.map(formatAssigneeToken).join(" ")}`)
  }

  if (labelValues.length > 0) {
    quickActions.push(`/label ${labelValues.map(formatLabelToken).join(" ")}`)
  }

  if (quickActions.length === 0) {
    return description
  }

  const trimmedDescription = description.trim()

  return trimmedDescription
    ? `${trimmedDescription}\n\n${quickActions.join("\n")}`
    : quickActions.join("\n")
}

export function buildGitLabIssueUrl(
  baseIssueNewUrl: string,
  issue: Omit<GeneratedIssue, "rowId" | "rowIndex" | "warnings" | "canOpen" | "url"> & {
    rowId: string
    rowIndex: number
  }
) {
  const url = new URL(baseIssueNewUrl)

  url.searchParams.set("issue[title]", issue.title)
  url.searchParams.set("issue[issue_type]", "issue")

  if (issue.description) {
    url.searchParams.set("issue[description]", issue.description)
  }

  url.searchParams.set("issue[confidential]", String(issue.confidential))

  if (issue.relatedIssueId) {
    url.searchParams.set("add_related_issue", issue.relatedIssueId)
  }

  return url.toString()
}

export function generateIssues(
  baseIssueNewUrl: string,
  template: IssueTemplate,
  table: TableData | undefined,
  selectedRowIds: Set<string>
): GeneratedIssue[] {
  if (!table) {
    return []
  }

  return table.rows
    .filter((row) => selectedRowIds.has(row.id))
    .map((row) => {
      const title = renderTemplate(template.title, row.values, table.headers)
      const description = renderTemplate(
        template.description,
        row.values,
        table.headers
      )
      const assignees = renderTemplate(template.assignees, row.values, table.headers)
      const labels = renderTemplate(template.labels, row.values, table.headers)
      const relatedIssueId = renderTemplate(
        template.relatedIssueId,
        row.values,
        table.headers
      )

      const warnings: string[] = []

      if (!title.value.trim()) {
        warnings.push("缺少必要的標題。")
      }

      const unknownVariables = [
        ...title.unknownVariables,
        ...description.unknownVariables,
        ...assignees.unknownVariables,
        ...labels.unknownVariables,
        ...relatedIssueId.unknownVariables,
      ]

      if (unknownVariables.length > 0) {
        warnings.push(`未知變數：${Array.from(new Set(unknownVariables)).join(", ")}`)
      }

      const emptyVariables = [
        ...title.emptyVariables,
        ...description.emptyVariables,
        ...assignees.emptyVariables,
        ...labels.emptyVariables,
        ...relatedIssueId.emptyVariables,
      ]

      if (emptyVariables.length > 0) {
        warnings.push(`空值：${Array.from(new Set(emptyVariables)).join(", ")}`)
      }

      const relatedIssueValidation = validateRelatedIssueId(relatedIssueId.value)
      if (!relatedIssueValidation.isValid && relatedIssueValidation.message) {
        warnings.push(relatedIssueValidation.message)
      }

      const base = {
        rowId: row.id,
        rowIndex: row.index,
        title: title.value,
        description: buildQuickActionsDescription(
          description.value,
          assignees.value,
          labels.value
        ),
        confidential: template.confidential,
        relatedIssueId: relatedIssueId.value.trim(),
      }

      const url = buildGitLabIssueUrl(baseIssueNewUrl, base)

      if (url.length > URL_WARNING_LENGTH) {
        warnings.push(`URL 長度為 ${url.length} 個字元，可能超過瀏覽器或 GitLab 的限制。`)
      }

      return {
        ...base,
        url,
        warnings,
        canOpen: warnings.every((warning) => !warning.startsWith("缺少必要的標題")) &&
          warnings.every((warning) => !warning.startsWith("未知變數")) &&
          warnings.every((warning) => !warning.startsWith("關聯卡片 ID")),
      }
    })
}
