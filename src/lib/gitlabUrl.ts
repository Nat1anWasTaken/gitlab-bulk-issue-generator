import type { GeneratedIssue, IssueTemplate, TableData } from "@/lib/types"
import { renderTemplate } from "@/lib/variables"
import { validateRelatedIssueId } from "@/lib/validation"

const URL_WARNING_LENGTH = 2000

export function buildGitLabIssueUrl(
  baseIssueNewUrl: string,
  issue: Omit<GeneratedIssue, "rowId" | "rowIndex" | "warnings" | "canOpen" | "url"> & {
    rowId: string
    rowIndex: number
  }
) {
  const url = new URL(baseIssueNewUrl)

  url.searchParams.set("issue[title]", issue.title)
  url.searchParams.set("issue[issue_type]", issue.issueType)

  if (issue.issuableTemplate) {
    url.searchParams.set("issuable_template", issue.issuableTemplate)
  }

  if (issue.descriptionTemplate) {
    url.searchParams.set("description_template", issue.descriptionTemplate)
  }

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
      const issuableTemplate = renderTemplate(
        template.issuableTemplate,
        row.values,
        table.headers
      )
      const descriptionTemplate = renderTemplate(
        template.descriptionTemplate,
        row.values,
        table.headers
      )
      const description = renderTemplate(
        template.description,
        row.values,
        table.headers
      )
      const relatedIssueId = renderTemplate(
        template.relatedIssueId,
        row.values,
        table.headers
      )

      const warnings: string[] = []

      if (!title.value.trim()) {
        warnings.push("Missing required title.")
      }

      const unknownVariables = [
        ...title.unknownVariables,
        ...issuableTemplate.unknownVariables,
        ...descriptionTemplate.unknownVariables,
        ...description.unknownVariables,
        ...relatedIssueId.unknownVariables,
      ]

      if (unknownVariables.length > 0) {
        warnings.push(`Unknown variables: ${Array.from(new Set(unknownVariables)).join(", ")}`)
      }

      const emptyVariables = [
        ...title.emptyVariables,
        ...issuableTemplate.emptyVariables,
        ...descriptionTemplate.emptyVariables,
        ...description.emptyVariables,
        ...relatedIssueId.emptyVariables,
      ]

      if (emptyVariables.length > 0) {
        warnings.push(`Empty values: ${Array.from(new Set(emptyVariables)).join(", ")}`)
      }

      if (!["issue", "incident"].includes(template.issueType)) {
        warnings.push("Invalid issue type after rendering.")
      }

      const relatedIssueValidation = validateRelatedIssueId(relatedIssueId.value)
      if (!relatedIssueValidation.isValid && relatedIssueValidation.message) {
        warnings.push(relatedIssueValidation.message)
      }

      const base = {
        rowId: row.id,
        rowIndex: row.index,
        title: title.value,
        issueType: template.issueType,
        issuableTemplate: issuableTemplate.value,
        descriptionTemplate: descriptionTemplate.value,
        description: description.value,
        confidential: template.confidential,
        relatedIssueId: relatedIssueId.value.trim(),
      }

      const url = buildGitLabIssueUrl(baseIssueNewUrl, base)

      if (url.length > URL_WARNING_LENGTH) {
        warnings.push(`URL is ${url.length} characters long and may exceed browser or GitLab limits.`)
      }

      return {
        ...base,
        url,
        warnings,
        canOpen: warnings.every((warning) => !warning.startsWith("Missing required title")) &&
          warnings.every((warning) => !warning.startsWith("Unknown variables")) &&
          warnings.every((warning) => !warning.startsWith("Related issue ID")) &&
          warnings.every((warning) => !warning.startsWith("Invalid issue type")),
      }
    })
}
