import type { RenderedTemplate, VariableToken } from "@/lib/types"

export const VARIABLE_PATTERN = /{{\s*([^{}]+?)\s*}}/g

export type VariableAutocompleteContext = {
  start: number
  end: number
  query: string
}

function normalizeVariableName(value: string) {
  return value.trim().replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
}

export function extractVariableNames(value: string): string[] {
  return Array.from(value.matchAll(VARIABLE_PATTERN), (match) =>
    normalizeVariableName(match[1])
  )
}

export function getVariableAutocompleteContext(
  value: string,
  caretPosition: number
): VariableAutocompleteContext | null {
  const lastOpenIndex = value.lastIndexOf("{{", caretPosition - 1)
  const lastCloseIndex = value.lastIndexOf("}}", caretPosition - 1)

  if (lastOpenIndex === -1 || lastOpenIndex < lastCloseIndex) {
    return null
  }

  const rawQuery = value.slice(lastOpenIndex + 2, caretPosition)

  if (rawQuery.includes("}")) {
    return null
  }

  const nextCloseIndex = value.indexOf("}}", caretPosition)
  const nextOpenIndex = value.indexOf("{{", lastOpenIndex + 2)
  const end =
    nextCloseIndex !== -1 && (nextOpenIndex === -1 || nextCloseIndex < nextOpenIndex)
      ? nextCloseIndex + 2
      : caretPosition

  return {
    start: lastOpenIndex,
    end,
    query: normalizeVariableName(rawQuery),
  }
}

export function tokenizeTemplate(
  value: string,
  availableColumns: string[]
): VariableToken[] {
  const tokens: VariableToken[] = []
  const columnSet = new Set(availableColumns)
  let cursor = 0

  for (const match of value.matchAll(VARIABLE_PATTERN)) {
    const index = match.index ?? 0

    if (index > cursor) {
      tokens.push({ type: "text", value: value.slice(cursor, index) })
    }

    const variableName = normalizeVariableName(match[1])
    tokens.push({
      type: columnSet.has(variableName) ? "variable-known" : "variable-unknown",
      value: match[0],
      name: variableName,
    })

    cursor = index + match[0].length
  }

  if (cursor < value.length) {
    tokens.push({ type: "text", value: value.slice(cursor) })
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value }]
}

export function renderTemplate(
  value: string,
  row: Record<string, string>,
  availableColumns: string[]
): RenderedTemplate {
  const unknownVariables: string[] = []
  const emptyVariables: string[] = []
  const usedVariables: string[] = []
  const columnSet = new Set(availableColumns)

  const rendered = value.replace(VARIABLE_PATTERN, (_, rawName: string) => {
    const variableName = normalizeVariableName(rawName)
    usedVariables.push(variableName)

    if (!columnSet.has(variableName)) {
      unknownVariables.push(variableName)
      return ""
    }

    const cellValue = row[variableName] ?? ""

    if (cellValue === "") {
      emptyVariables.push(variableName)
    }

    return cellValue
  })

  return {
    value: rendered,
    usedVariables: dedupe(usedVariables),
    unknownVariables: dedupe(unknownVariables),
    emptyVariables: dedupe(emptyVariables),
  }
}

function dedupe(values: string[]) {
  return Array.from(new Set(values))
}
