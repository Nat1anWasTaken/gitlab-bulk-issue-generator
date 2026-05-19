import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { VariableInput } from "@/components/variable-input"
import type { IssueTemplate } from "@/lib/types"
import { extractVariableNames } from "@/lib/variables"

type IssueTemplateEditorProps = {
  value: IssueTemplate
  availableColumns: string[]
  onChange: (value: IssueTemplate) => void
}

export function IssueTemplateEditor({
  value,
  availableColumns,
  onChange,
}: IssueTemplateEditorProps) {
  const markdownVariables = extractVariableNames(value.description)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Issue template</CardTitle>
        <CardDescription>
          Every documented GitLab prefill field is exposed here. Variables use
          <span className="font-mono text-foreground"> {` {{column_name}} `}</span>
          syntax.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <VariableInput
          label="Title"
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
          availableColumns={availableColumns}
          placeholder="Follow up with {{assignee}} about {{task_title}}"
          singleLine
        />

        <VariableInput
          label="Description template"
          value={value.descriptionTemplate}
          onChange={(descriptionTemplate) => onChange({ ...value, descriptionTemplate })}
          availableColumns={availableColumns}
          placeholder="okr-template"
          singleLine
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Description</span>

          <Textarea
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder={"## Summary\n\n{{task_title}}\n\n- Team: {{team_name}}"}
            className="min-h-72 font-mono"
            spellCheck={false}
          />

          {markdownVariables.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(markdownVariables)).map((variableName) => (
                <Badge
                  key={variableName}
                  variant={availableColumns.includes(variableName) ? "secondary" : "destructive"}
                >
                  {`{{${variableName}}}`}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <Checkbox
            checked={value.confidential}
            onCheckedChange={(checked) => onChange({ ...value, confidential: checked === true })}
          />
          <span className="text-sm font-medium text-foreground">Confidential</span>
        </label>

        <VariableInput
          label="Related issue ID"
          value={value.relatedIssueId}
          onChange={(relatedIssueId) => onChange({ ...value, relatedIssueId })}
          availableColumns={availableColumns}
          placeholder="{{related_issue_id}}"
          singleLine
        />
      </CardContent>
    </Card>
  )
}
