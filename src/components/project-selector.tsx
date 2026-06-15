import { ExternalLink, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { normalizeGitLabIssueNewUrl } from "@/lib/gitlabUrl";
import type { GitLabProject, ValidationResult } from "@/lib/types";

type ProjectSelectorProps = {
  projects: GitLabProject[];
  value: string;
  validation: ValidationResult;
  projectsLoading: boolean;
  projectsError: string;
  spreadsheetUrl: string;
  onProjectChange: (projectName: string) => void;
  onValueChange: (url: string) => void;
  onRefreshProjects: () => void;
};

export function ProjectSelector({
  projects,
  value,
  validation,
  projectsLoading,
  projectsError,
  spreadsheetUrl,
  onProjectChange,
  onValueChange,
  onRefreshProjects,
}: ProjectSelectorProps) {
  const normalizedValue = normalizeGitLabIssueNewUrl(value) ?? value.trim();
  const selectedProjectName =
    projects.find(
      (project) =>
        normalizeGitLabIssueNewUrl(project.issueNewUrl) === normalizedValue,
    )?.name ?? "其他";

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>要把卡片開到哪裡</CardTitle>
          <CardDescription>
            選擇預設的 GitLab 專案，或使用自訂的 URL 覆蓋
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshProjects}
            disabled={projectsLoading}
          >
            <RefreshCw
              data-icon="inline-start"
              className={projectsLoading ? "animate-spin" : undefined}
            />
            重新整理
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={spreadsheetUrl} target="_blank" rel="noreferrer">
              <ExternalLink data-icon="inline-start" />
              專案表
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
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
        </div>

        {projectsLoading ? (
          <Alert>
            <AlertDescription>正在載入最新的專案表...</AlertDescription>
          </Alert>
        ) : null}

        {projectsError ? (
          <Alert variant="destructive">
            <AlertDescription>{projectsError}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
