import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GitLabProject, ValidationResult } from "@/lib/types";

type ProjectSelectorProps = {
  projects: GitLabProject[];
  value: string;
  selectedProjectName: string;
  validation: ValidationResult;
  onProjectChange: (projectName: string) => void;
  onValueChange: (url: string) => void;
};

export function ProjectSelector({
  projects,
  value,
  selectedProjectName,
  validation,
  onProjectChange,
  onValueChange,
}: ProjectSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>要把卡片開到哪裡</CardTitle>
        <CardDescription>
          選擇預設的 GitLab 專案，或使用自訂的 URL 覆蓋
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            GitLab 專案
          </span>
          <Select value={selectedProjectName} onValueChange={onProjectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="選擇 GitLab 專案" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {projects.map((project) => (
                  <SelectItem key={project.name} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
                <SelectItem value="其他">其他</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {selectedProjectName === "其他" ? "使用自訂的 URL" : value}
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">自訂 URL</span>
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="https://gitlab.com/group/project/-/issues/new"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={
                validation.isValid ? "text-emerald-700" : "text-destructive"
              }
            >
              {validation.isValid ? "看起來很棒" : validation.message}
            </span>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
