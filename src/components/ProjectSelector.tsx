import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { GitLabProject, ValidationResult } from "@/lib/types"

type ProjectSelectorProps = {
  projects: GitLabProject[]
  selectedProjectUrl: string
  selectedProjectName: string
  customUrl: string
  activeUrl: string
  activeUrlValidation: ValidationResult
  onProjectChange: (projectName: string) => void
  onCustomUrlChange: (url: string) => void
}

export function ProjectSelector({
  projects,
  selectedProjectUrl,
  selectedProjectName,
  customUrl,
  activeUrl,
  activeUrlValidation,
  onProjectChange,
  onCustomUrlChange,
}: ProjectSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to open the issues</CardTitle>
        <CardDescription>
          Choose a bundled GitLab project or override it with a custom new-issue URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">GitLab project</span>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            value={selectedProjectName}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.name} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{selectedProjectUrl}</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Custom GitLab issue URL</span>
          <Input
            value={customUrl}
            onChange={(event) => onCustomUrlChange(event.target.value)}
            placeholder="https://gitlab.com/group/project/-/issues/new"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={customUrl.trim() ? "secondary" : "outline"}>
              {customUrl.trim() ? "Using custom URL when valid" : "Using selected project URL"}
            </Badge>
            <span className={activeUrlValidation.isValid ? "text-emerald-700" : "text-destructive"}>
              {activeUrlValidation.isValid
                ? "Target URL looks valid."
                : activeUrlValidation.message}
            </span>
          </div>
          {activeUrl ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Active target: {activeUrl}
            </div>
          ) : null}
        </label>
      </CardContent>
    </Card>
  )
}
