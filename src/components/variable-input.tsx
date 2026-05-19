import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { extractVariableNames, tokenizeTemplate } from "@/lib/variables"

type VariableInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  availableColumns: string[]
  placeholder?: string
  singleLine?: boolean
  description?: string
}

export function VariableInput({
  label,
  value,
  onChange,
  availableColumns,
  placeholder,
  singleLine = false,
  description,
}: VariableInputProps) {
  const tokens = tokenizeTemplate(value, availableColumns)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const backdropRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${Math.max(textarea.scrollHeight, singleLine ? 40 : 96)}px`
  }, [singleLine, value])

  const detectedVariables = extractVariableNames(value)

  return (
    <label className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={backdropRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-background px-3 py-2 text-sm whitespace-pre-wrap break-words text-foreground",
            singleLine ? "min-h-10" : "min-h-24"
          )}
        >
          {value ? (
            tokens.map((token, index) => {
              if (token.type === "text") {
                return <span key={`${token.value}-${index}`}>{token.value}</span>
              }

              return (
                <span
                  key={`${token.value}-${index}`}
                  className={cn(
                    "rounded-sm px-1 py-0.5",
                    token.type === "variable-known"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
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
          value={value}
          rows={singleLine ? 1 : 4}
          placeholder={placeholder}
          className={cn(
            "relative z-10 w-full resize-none overflow-hidden rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
            singleLine ? "min-h-10" : "min-h-24"
          )}
          style={{
            color: "transparent",
            caretColor: "var(--color-foreground)",
            WebkitTextFillColor: "transparent",
          }}
          onScroll={(event) => {
            if (!backdropRef.current) {
              return
            }

            backdropRef.current.scrollTop = event.currentTarget.scrollTop
            backdropRef.current.scrollLeft = event.currentTarget.scrollLeft
          }}
          onChange={(event) => onChange(event.target.value)}
        />
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
