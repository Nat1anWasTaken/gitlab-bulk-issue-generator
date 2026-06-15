import * as React from "react";

import { DataSourcePanel } from "@/components/data-source-panel";
import { GeneratedPreview } from "@/components/generated-preview";
import { IssueTemplateEditor } from "@/components/issue-template-editor";
import { ProjectSelector } from "@/components/project-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { GitLabProject, IssueTemplate, TableData } from "@/lib/types";
import { generateIssues, normalizeGitLabIssueNewUrl } from "@/lib/gitlabUrl";
import { parseUploadedCsvFile } from "@/lib/csv";
import { fetchRemoteTables, spreadsheetUrl } from "@/lib/remoteTables";
import {
  fetchRemoteProjects,
  projectSpreadsheetUrl,
} from "@/lib/remoteProjects";
import { validateGitLabIssueNewUrl } from "@/lib/validation";

const STORAGE_KEYS = {
  issueUrl: "gitlab-bulk-issues:issue-url",
  projectName: "gitlab-bulk-issues:project-name",
  tableId: "gitlab-bulk-issues:table-id",
  template: "gitlab-bulk-issues:template",
  uploadedTables: "gitlab-bulk-issues:uploaded-tables",
  selectedRowsByTable: "gitlab-bulk-issues:selected-rows-by-table",
};

const DEFAULT_TEMPLATE: IssueTemplate = {
  title: "{{task_title}}",
  description: [
    "## 摘要",
    "",
    "{{task_title}}",
    "",
    "- 團隊：{{team_name}}",
    "- 組長：{{組長}}",
  ].join("\n"),
  assignees: "{{組長}}",
  labels: "Status::Inbox, 組別::{{team_name}}組",
  confidential: false,
  relatedIssueId: "{{related_issue_id}}",
  pangu: {
    title: false,
    description: false,
    assignees: false,
    labels: false,
    relatedIssueId: false,
  },
};

type RemoteProjectsState = {
  projects: GitLabProject[];
  loading: boolean;
  error: string;
};

type RemoteTablesState = {
  tables: TableData[];
  loading: boolean;
  error: string;
};

function readStorage<T>(key: string, fallback: T): T {
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function readStoredTemplate(): IssueTemplate {
  const storedTemplate = readStorage<Partial<IssueTemplate> | null>(
    STORAGE_KEYS.template,
    null,
  );

  if (!storedTemplate) {
    return DEFAULT_TEMPLATE;
  }

  return {
    ...DEFAULT_TEMPLATE,
    ...storedTemplate,
  };
}

function getInitialIssueUrl() {
  const storedIssueUrl = window.localStorage.getItem(STORAGE_KEYS.issueUrl);
  return normalizeGitLabIssueNewUrl(storedIssueUrl ?? "") ?? storedIssueUrl ?? "";
}

function App() {
  const [template, setTemplate] = React.useState<IssueTemplate>(() =>
    readStoredTemplate(),
  );
  const [issueUrl, setIssueUrl] = React.useState(() => getInitialIssueUrl());
  const userEditedIssueUrlRef = React.useRef(false);
  const [uploadedTables, setUploadedTables] = React.useState<TableData[]>(() =>
    readStorage<TableData[]>(STORAGE_KEYS.uploadedTables, []),
  );
  const [selectedTableId, setSelectedTableId] = React.useState(
    () => window.localStorage.getItem(STORAGE_KEYS.tableId) ?? "",
  );
  const [remoteProjectsState, setRemoteProjectsState] =
    React.useState<RemoteProjectsState>({
      projects: [],
      loading: true,
      error: "",
    });
  const [projectsRefreshKey, setProjectsRefreshKey] = React.useState(0);
  const [remoteTablesState, setRemoteTablesState] =
    React.useState<RemoteTablesState>({
      tables: [],
      loading: true,
      error: "",
    });
  const [remoteTablesRefreshKey, setRemoteTablesRefreshKey] = React.useState(
    0,
  );
  const [selectedRowsByTable, setSelectedRowsByTable] = React.useState<
    Record<string, string[]>
  >(() =>
    readStorage<Record<string, string[]>>(STORAGE_KEYS.selectedRowsByTable, {}),
  );
  const [uploadError, setUploadError] = React.useState("");
  const projects = remoteProjectsState.projects;
  const tables = React.useMemo(
    () =>
      [...remoteTablesState.tables, ...uploadedTables].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [remoteTablesState.tables, uploadedTables],
  );

  const defaultIssueUrl = React.useMemo(() => {
    const storedProjectName = window.localStorage.getItem(
      STORAGE_KEYS.projectName,
    );
    const storedProject = projects.find(
      (project) => project.name === storedProjectName,
    );

    return storedProject?.issueNewUrl ?? projects[0]?.issueNewUrl ?? "";
  }, [projects]);

  React.useEffect(() => {
    if (issueUrl || userEditedIssueUrlRef.current || !defaultIssueUrl) {
      return;
    }

    setIssueUrl(defaultIssueUrl);
  }, [defaultIssueUrl, issueUrl]);

  const normalizedIssueUrl = React.useMemo(
    () => normalizeGitLabIssueNewUrl(issueUrl),
    [issueUrl],
  );

  const activeUrl = normalizedIssueUrl ?? issueUrl.trim();

  const selectedProjectName =
    projects.find(
      (project) =>
        normalizeGitLabIssueNewUrl(project.issueNewUrl) === activeUrl,
    )?.name ?? "其他";

  const selectedTable = React.useMemo(
    () => {
      const resolvedSelectedTableId =
        selectedTableId || window.localStorage.getItem(STORAGE_KEYS.tableId);

      return (
        tables.find((table) => table.id === resolvedSelectedTableId) ??
        tables[0]
      );
    },
    [selectedTableId, tables],
  );

  React.useEffect(() => {
    const abortController = new AbortController();

    void Promise.resolve().then(() => {
      if (!abortController.signal.aborted) {
        setRemoteProjectsState((current) => ({
          ...current,
          loading: true,
          error: "",
        }));
      }
    });

    fetchRemoteProjects(abortController.signal)
      .then((loadedProjects) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRemoteProjectsState({
          projects: loadedProjects,
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRemoteProjectsState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "無法載入最新的專案表。",
        }));
      });

    return () => {
      abortController.abort();
    };
  }, [projectsRefreshKey]);

  React.useEffect(() => {
    const abortController = new AbortController();

    void Promise.resolve().then(() => {
      if (!abortController.signal.aborted) {
        setRemoteTablesState((current) => ({
          ...current,
          loading: true,
          error: "",
        }));
      }
    });

    fetchRemoteTables(abortController.signal)
      .then((loadedTables) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRemoteTablesState({
          tables: loadedTables,
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRemoteTablesState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "無法載入最新的資料表。",
        }));
      });

    return () => {
      abortController.abort();
    };
  }, [remoteTablesRefreshKey]);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.issueUrl, activeUrl);
    window.localStorage.setItem(STORAGE_KEYS.projectName, selectedProjectName);
  }, [activeUrl, selectedProjectName]);

  React.useEffect(() => {
    if (!selectedTable?.id) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.tableId, selectedTable.id);
  }, [selectedTable]);

  React.useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.template,
      JSON.stringify(template),
    );
  }, [template]);

  React.useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.uploadedTables,
      JSON.stringify(uploadedTables),
    );
  }, [uploadedTables]);

  React.useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.selectedRowsByTable,
      JSON.stringify(selectedRowsByTable),
    );
  }, [selectedRowsByTable]);

  const activeUrlValidation = validateGitLabIssueNewUrl(activeUrl);
  const selectedRowIds = React.useMemo(() => {
    if (!selectedTable) {
      return new Set<string>();
    }

    return new Set(
      selectedRowsByTable[selectedTable.id] ??
        selectedTable.rows.map((row) => row.id),
    );
  }, [selectedRowsByTable, selectedTable]);

  const generatedIssues = React.useMemo(() => {
    if (!selectedTable || !activeUrlValidation.isValid) {
      return [];
    }

    return generateIssues(activeUrl, template, selectedTable, selectedRowIds);
  }, [
    activeUrl,
    activeUrlValidation.isValid,
    selectedRowIds,
    selectedTable,
    template,
  ]);

  async function handleCsvUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploadError("");

    try {
      const parsedTable = await parseUploadedCsvFile(file);

      setUploadedTables((current) => {
        const next = current.filter((table) => table.id !== parsedTable.id);
        return [...next, parsedTable];
      });
      setSelectedTableId(parsedTable.id);
      setSelectedRowsByTable((current) => ({
        ...current,
        [parsedTable.id]: parsedTable.rows.map((row) => row.id),
      }));
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? `無法解析 CSV：${error.message}`
          : "無法解析 CSV。",
      );
    }
  }

  function updateTableSelection(tableId: string, rowIds: string[]) {
    setSelectedRowsByTable((current) => ({
      ...current,
      [tableId]: rowIds,
    }));
  }

  function handleOpenSelected(mode: "tabs" | "windows", urls: string[]) {
    for (const url of urls) {
      const features =
        mode === "windows"
          ? "noopener,noreferrer,popup=yes,width=1280,height=900"
          : "noopener,noreferrer";
      window.open(url, "_blank", features);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <header className="flex flex-col gap-3">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              GitLab 批量開卡工具
            </h1>
            <p className="mt-2 text-sm text-muted-foreground lg:text-base">
              幫你開 Issue 的小精靈
            </p>
          </div>
        </header>

        <Separator />

        <ProjectSelector
          projects={projects}
          value={issueUrl}
          validation={activeUrlValidation}
          projectsLoading={remoteProjectsState.loading}
          projectsError={remoteProjectsState.error}
          spreadsheetUrl={projectSpreadsheetUrl}
          onProjectChange={(projectName) => {
            if (projectName === "其他") {
              return;
            }

            const project = projects.find(
              (entry) => entry.name === projectName,
            );
            if (project) {
              userEditedIssueUrlRef.current = true;
              setIssueUrl(project.issueNewUrl);
            }
          }}
          onValueChange={(url) => {
            userEditedIssueUrlRef.current = true;
            setIssueUrl(url);
          }}
          onRefreshProjects={() =>
            setProjectsRefreshKey((current) => current + 1)
          }
        />

        {!activeUrlValidation.isValid ? (
          <Alert variant="destructive">
            <AlertTitle>Project URL 似乎不正確</AlertTitle>
            <AlertDescription>{activeUrlValidation.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <IssueTemplateEditor
            value={template}
            availableColumns={selectedTable?.headers ?? []}
            onChange={setTemplate}
          />

          <DataSourcePanel
            tables={tables}
            selectedTableId={selectedTable?.id ?? ""}
            selectedRowIds={selectedRowIds}
            uploadError={uploadError}
            remoteTablesLoading={remoteTablesState.loading}
            remoteTablesError={remoteTablesState.error}
            spreadsheetUrl={spreadsheetUrl}
            onTableChange={setSelectedTableId}
            onCsvUpload={(file) => void handleCsvUpload(file)}
            onRefreshTables={() =>
              setRemoteTablesRefreshKey((current) => current + 1)
            }
            onSelectAll={() => {
              if (!selectedTable) {
                return;
              }

              updateTableSelection(
                selectedTable.id,
                selectedTable.rows.map((row) => row.id),
              );
            }}
            onDeselectAll={() => {
              if (!selectedTable) {
                return;
              }

              updateTableSelection(selectedTable.id, []);
            }}
            onToggleRow={(rowId) => {
              if (!selectedTable) {
                return;
              }

              const next = new Set(
                selectedRowsByTable[selectedTable.id] ??
                  selectedTable.rows.map((row) => row.id),
              );

              if (next.has(rowId)) {
                next.delete(rowId);
              } else {
                next.add(rowId);
              }

              updateTableSelection(selectedTable.id, Array.from(next));
            }}
          />
        </section>

        <GeneratedPreview
          generatedIssues={generatedIssues}
          tableSelected={Boolean(selectedTable)}
          tableIsEmpty={Boolean(
            selectedTable && selectedTable.rows.length === 0,
          )}
          activeUrlIsValid={activeUrlValidation.isValid}
          onOpenSelected={handleOpenSelected}
        />
      </div>
    </main>
  );
}

export default App;
