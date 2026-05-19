import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VariableInput } from "@/components/variable-input";
import type { IssueTemplate } from "@/lib/types";

type IssueTemplateEditorProps = {
  value: IssueTemplate;
  availableColumns: string[];
  onChange: (value: IssueTemplate) => void;
};

export function IssueTemplateEditor({
  value,
  availableColumns,
  onChange,
}: IssueTemplateEditorProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>卡片內容</CardTitle>
        <CardDescription>
          所有已記錄的 GitLab 預填欄位皆在此顯示。變數使用
          <span className="font-mono text-foreground">
            {" "}
            {` {{column_name}} `}
          </span>
          語法。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <VariableInput
          label="Title"
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
          availableColumns={availableColumns}
          placeholder="跟進 {{assignee}} 關於 {{task_title}}"
          singleLine
        />

        <div className="flex flex-col gap-2">
          <VariableInput
            label="Description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
            availableColumns={availableColumns}
            placeholder={
              "## Summary\n\n{{task_title}}\n\n- Team: {{team_name}}"
            }
          />
        </div>

        <VariableInput
          label="Assignees"
          value={value.assignees}
          onChange={(assignees) => onChange({ ...value, assignees })}
          availableColumns={availableColumns}
          placeholder="@alice, @bob"
          singleLine
          description="用 , 分隔"
        />

        <VariableInput
          label="Labels"
          value={value.labels}
          onChange={(labels) => onChange({ ...value, labels })}
          availableColumns={availableColumns}
          placeholder="bug, high priority"
          singleLine
          description="用 , 分隔"
        />

        <label className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <Checkbox
            checked={value.confidential}
            onCheckedChange={(checked) =>
              onChange({ ...value, confidential: checked === true })
            }
          />
          <span className="text-sm font-medium text-foreground">
            Confidential
          </span>
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
  );
}
