import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  extractVariableNames,
  getVariableAutocompleteContext,
  tokenizeTemplate,
} from "@/lib/variables"

type VariableInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  availableColumns: string[]
  placeholder?: string
  description?: string
  singleLine?: boolean
}

export function VariableInput({
  label,
  value,
  onChange,
  availableColumns,
  placeholder,
  description,
  singleLine = false,
}: VariableInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const backdropRef = React.useRef<HTMLDivElement | null>(null)
  const isComposingRef = React.useRef(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isComposing, setIsComposing] = React.useState(false)
  const [draftValue, setDraftValue] = React.useState(value)
  const [selection, setSelection] = React.useState({ start: 0, end: 0 })
  const [suggestionNavigation, setSuggestionNavigation] = React.useState({
    query: "",
    index: 0,
  })
  const currentValue = isComposing ? draftValue : value
  const tokens = tokenizeTemplate(currentValue, availableColumns)

  React.useEffect(() => {
    if (!isComposing) {
      setDraftValue(value)
    }
  }, [isComposing, value])

  const autocompleteContext = React.useMemo(() => {
    if (!isFocused || isComposing || selection.start !== selection.end) {
      return null
    }

    return getVariableAutocompleteContext(currentValue, selection.start)
  }, [currentValue, isComposing, isFocused, selection.end, selection.start])

  const suggestions = React.useMemo(() => {
    if (!autocompleteContext) {
      return []
    }

    const query = autocompleteContext.query.toLocaleLowerCase()
    const matchingColumns = availableColumns.filter((column) =>
      column.toLocaleLowerCase().includes(query)
    )

    return matchingColumns.length > 0 ? matchingColumns : availableColumns
  }, [autocompleteContext, availableColumns])

  const activeSuggestionIndex =
    autocompleteContext && suggestionNavigation.query === autocompleteContext.query
      ? Math.min(suggestionNavigation.index, Math.max(suggestions.length - 1, 0))
      : 0

  React.useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${Math.max(textarea.scrollHeight, singleLine ? 40 : 96)}px`
  }, [currentValue, singleLine])

  const detectedVariables = extractVariableNames(currentValue)

  function updateSelectionFromTextarea(textarea: HTMLTextAreaElement) {
    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  function applySuggestion(variableName: string) {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const selectionStart = textarea.selectionStart
    const context = getVariableAutocompleteContext(currentValue, selectionStart)

    if (!context) {
      return
    }

    const nextValue =
      currentValue.slice(0, context.start) +
      `{{${variableName}}}` +
      currentValue.slice(context.end)
    const nextCaretPosition = context.start + variableName.length + 4

    setDraftValue(nextValue)
    onChange(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition)
      updateSelectionFromTextarea(textarea)
    })
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description ? (
        <span className="text-xs text-muted-foreground">{description}</span>
      ) : null}

      <div className="relative">
        <div
          ref={backdropRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-background px-3 py-2 text-sm whitespace-pre-wrap break-words text-foreground",
            isComposing && "opacity-0",
            singleLine ? "min-h-10" : "min-h-24"
          )}
        >
          {currentValue ? (
            tokens.map((token, index) => {
              if (token.type === "text") {
                return <span key={`${token.value}-${index}`}>{token.value}</span>
              }

              return (
                <span
                  key={`${token.value}-${index}`}
                  className={cn(
                    "rounded-[0.2rem]",
                    token.type === "variable-known"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-destructive/12 text-destructive"
                  )}
                >
                  {token.value}
                </span>
              )
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={currentValue}
          rows={singleLine ? 1 : 4}
          placeholder={placeholder}
          className={cn(
            "relative z-10 w-full resize-none overflow-hidden rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
            singleLine ? "min-h-10" : "min-h-24"
          )}
          style={{
            color: isComposing ? "var(--color-foreground)" : "transparent",
            caretColor: "var(--color-foreground)",
            WebkitTextFillColor: isComposing ? "var(--color-foreground)" : "transparent",
          }}
          spellCheck={false}
          onScroll={(event) => {
            if (!backdropRef.current) {
              return
            }

            backdropRef.current.scrollTop = event.currentTarget.scrollTop
            backdropRef.current.scrollLeft = event.currentTarget.scrollLeft
          }}
          onFocus={(event) => {
            setIsFocused(true)
            updateSelectionFromTextarea(event.currentTarget)
          }}
          onBlur={() => {
            setIsFocused(false)
          }}
          onClick={(event) => {
            updateSelectionFromTextarea(event.currentTarget)
          }}
          onKeyDown={(event) => {
            if (isComposing) {
              return
            }

            if (suggestions.length === 0) {
              if (singleLine && event.key === "Enter") {
                event.preventDefault()
              }

              return
            }

            if (event.key === "ArrowDown") {
              event.preventDefault()
              setSuggestionNavigation({
                query: autocompleteContext?.query ?? "",
                index: (activeSuggestionIndex + 1) % suggestions.length,
              })
              return
            }

            if (event.key === "ArrowUp") {
              event.preventDefault()
              setSuggestionNavigation({
                query: autocompleteContext?.query ?? "",
                index: activeSuggestionIndex === 0 ? suggestions.length - 1 : activeSuggestionIndex - 1,
              })
              return
            }

            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault()
              applySuggestion(suggestions[activeSuggestionIndex] ?? suggestions[0])
              return
            }

            if (event.key === "Escape") {
              event.preventDefault()
              setIsFocused(false)
            }
          }}
          onKeyUp={(event) => {
            updateSelectionFromTextarea(event.currentTarget)
          }}
          onSelect={(event) => {
            updateSelectionFromTextarea(event.currentTarget)
          }}
          onCompositionStart={(event) => {
            isComposingRef.current = true
            setIsComposing(true)
            setDraftValue(event.currentTarget.value)
            updateSelectionFromTextarea(event.currentTarget)
          }}
          onCompositionEnd={(event) => {
            isComposingRef.current = false
            setDraftValue(event.currentTarget.value)
            setIsComposing(false)
            updateSelectionFromTextarea(event.currentTarget)
            onChange(event.currentTarget.value)
          }}
          onChange={(event) => {
            setDraftValue(event.target.value)
            updateSelectionFromTextarea(event.currentTarget)

            if (!isComposingRef.current) {
              onChange(event.target.value)
            }
          }}
        />

        {isFocused && suggestions.length > 0 ? (
          <div
            className="absolute top-full right-0 left-0 z-20 mt-2 rounded-lg border border-border bg-popover p-1 shadow-lg"
            role="listbox"
            aria-label={`${label} variable suggestions`}
          >
            <div className="px-2 py-1 text-xs text-muted-foreground">
              插入變數
            </div>
            <div className="flex max-h-48 flex-col overflow-y-auto">
              {suggestions.map((variableName, index) => (
                <div
                  key={variableName}
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors",
                    index === activeSuggestionIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/70"
                  )}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    applySuggestion(variableName)
                  }}
                  onMouseEnter={() =>
                    setSuggestionNavigation({
                      query: autocompleteContext?.query ?? "",
                      index,
                    })
                  }
                >
                  <span className="font-mono text-xs">{`{{${variableName}}}`}</span>
                  <span className="text-xs text-muted-foreground">↵</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {detectedVariables.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(detectedVariables)).map((variableName) => (
            <Badge
              key={variableName}
              variant={availableColumns.includes(variableName) ? "secondary" : "destructive"}
            >
              {`{{${variableName}}}`}
            </Badge>
          ))}
        </div>
      ) : null}
    </label>
  )
}
