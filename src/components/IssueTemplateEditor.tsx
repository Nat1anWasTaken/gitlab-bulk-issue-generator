import "@mdxeditor/editor/style.css"

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VariableInput } from "@/components/VariableInput"
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

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Issue type</span>
          <select
            value={value.issueType}
            onChange={(event) =>
              onChange({
                ...value,
                issueType: event.target.value as IssueTemplate["issueType"],
              })
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <option value="issue">issue</option>
            <option value="incident">incident</option>
          </select>
        </label>

        <VariableInput
          label="Issuable template"
          value={value.issuableTemplate}
          onChange={(issuableTemplate) => onChange({ ...value, issuableTemplate })}
          availableColumns={availableColumns}
          placeholder="incident-template"
          singleLine
          description="GitLab issuable_template supports issues, incidents, and merge requests."
        />

        <VariableInput
          label="Description template"
          value={value.descriptionTemplate}
          onChange={(descriptionTemplate) => onChange({ ...value, descriptionTemplate })}
          availableColumns={availableColumns}
          placeholder="okr-template"
          singleLine
          description="GitLab description_template supports tasks, OKRs, issues, and epics."
        />

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Description</span>
            <span className="text-xs text-muted-foreground">
              Markdown content is passed to GitLab as <span className="font-mono">issue[description]</span>.
            </span>
          </div>

          <div className="rounded-lg border border-input bg-background">
            <MDXEditor
              markdown={value.description}
              onChange={(description) => onChange({ ...value, description })}
              className="mdx-editor"
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <UndoRedo />
                      <BoldItalicUnderlineToggles />
                      <CreateLink />
                      <BlockTypeSelect />
                    </>
                  ),
                }),
              ]}
            />
          </div>

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
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={value.confidential}
            onChange={(event) => onChange({ ...value, confidential: event.target.checked })}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Confidential</span>
            <span className="text-xs text-muted-foreground">
              Static only. The generated URL sets <span className="font-mono">issue[confidential]</span>.
            </span>
          </div>
        </label>

        <VariableInput
          label="Related issue ID"
          value={value.relatedIssueId}
          onChange={(relatedIssueId) => onChange({ ...value, relatedIssueId })}
          availableColumns={availableColumns}
          placeholder="{{related_issue_id}}"
          singleLine
          description="After variable replacement, this value must be numeric."
        />
      </CardContent>
    </Card>
  )
}
