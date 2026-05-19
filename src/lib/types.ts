export type GitLabProject = {
  name: string
  issueNewUrl: string
}

export type IssueTemplate = {
  title: string
  description: string
  assignees: string
  labels: string
  confidential: boolean
  relatedIssueId: string
}

export type TableRow = {
  id: string
  index: number
  values: Record<string, string>
}

export type TableData = {
  id: string
  name: string
  source: "static" | "uploaded"
  headers: string[]
  rows: TableRow[]
}

export type VariableToken = {
  type: "text" | "variable-known" | "variable-unknown"
  value: string
  name?: string
}

export type RenderedTemplate = {
  value: string
  usedVariables: string[]
  unknownVariables: string[]
  emptyVariables: string[]
}

export type ValidationResult = {
  isValid: boolean
  message?: string
}

export type GeneratedIssue = {
  rowId: string
  rowIndex: number
  title: string
  description: string
  confidential: boolean
  relatedIssueId: string
  url: string
  warnings: string[]
  canOpen: boolean
}
