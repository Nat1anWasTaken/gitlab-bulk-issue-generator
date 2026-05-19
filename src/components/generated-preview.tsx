import * as React from "react"
import { AlertTriangle, Copy, Download, Link2, MonitorUp, PanelsTopLeft } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { GeneratedIssue } from "@/lib/types"

type GeneratedPreviewProps = {
  generatedIssues: GeneratedIssue[]
  tableSelected: boolean
  tableIsEmpty: boolean
  activeUrlIsValid: boolean
  openStatus: string
  onOpenSelected: (mode: "tabs" | "windows") => void
}

const BULK_OPEN_CONFIRMATION_COUNT = 8

export function GeneratedPreview({
  generatedIssues,
  tableSelected,
  tableIsEmpty,
  activeUrlIsValid,
  openStatus,
  onOpenSelected,
}: GeneratedPreviewProps) {
  const [tab, setTab] = React.useState("issues")
  const [showDialog, setShowDialog] = React.useState(false)
  const [copyStatus, setCopyStatus] = React.useState("")
  const [pendingOpenMode, setPendingOpenMode] = React.useState<"tabs" | "windows">("tabs")

  const validIssues = generatedIssues.filter((issue) => issue.canOpen)
  const invalidIssues = generatedIssues.filter((issue) => !issue.canOpen)
  const urlList = validIssues.map((issue) => issue.url).join("\n")

  const blockingMessages: string[] = []

  if (!tableSelected) {
    blockingMessages.push("Select a table first.")
  }

  if (tableIsEmpty) {
    blockingMessages.push("The selected table is empty.")
  }

  if (generatedIssues.length === 0) {
    blockingMessages.push("No rows selected.")
  }

  if (!activeUrlIsValid) {
    blockingMessages.push("The GitLab issue URL is invalid.")
  }

  if (invalidIssues.length > 0) {
    blockingMessages.push(`${invalidIssues.length} selected row(s) still have blocking warnings.`)
  }

  async function copyUrls() {
    if (!urlList) {
      return
    }

    await navigator.clipboard.writeText(urlList)
    setCopyStatus("Copied generated URLs.")
    window.setTimeout(() => setCopyStatus(""), 2000)
  }

  function downloadUrls() {
    if (!urlList) {
      return
    }

    const blob = new Blob([urlList], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = objectUrl
    anchor.download = "gitlab-issue-urls.txt"
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }

  function handleOpenClick(mode: "tabs" | "windows") {
    if (validIssues.length >= BULK_OPEN_CONFIRMATION_COUNT) {
      setPendingOpenMode(mode)
      setShowDialog(true)
      return
    }

    onOpenSelected(mode)
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Generated preview</CardTitle>
              <CardDescription>
                Review the rendered GitLab URLs before opening tabs. The app never auto-submits issues.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{generatedIssues.length} selected</Badge>
              <Badge variant="secondary">{validIssues.length} ready to open</Badge>
              {invalidIssues.length > 0 ? (
                <Badge variant="destructive">{invalidIssues.length} need fixes</Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => handleOpenClick("tabs")}
              disabled={blockingMessages.length > 0}
            >
              <PanelsTopLeft data-icon="inline-start" />
              Open in new tabs
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenClick("windows")}
              disabled={blockingMessages.length > 0}
            >
              <MonitorUp data-icon="inline-start" />
              Open in new windows
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyUrls()} disabled={!urlList}>
              <Copy data-icon="inline-start" />
              Copy all generated URLs
            </Button>
            <Button type="button" variant="outline" onClick={downloadUrls} disabled={!urlList}>
              <Download data-icon="inline-start" />
              Download URLs
            </Button>
            {copyStatus ? <span className="self-center text-sm text-muted-foreground">{copyStatus}</span> : null}
          </div>
          <Separator />
          {openStatus ? <div className="text-sm text-muted-foreground">{openStatus}</div> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {blockingMessages.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>Action blocked</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 list-disc">
                  {blockingMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
            <TabsList>
              <TabsTrigger value="issues">Rendered issues</TabsTrigger>
              <TabsTrigger value="urls">Manual URLs</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="flex flex-col gap-4">
              {generatedIssues.length > 0 ? (
                generatedIssues.map((issue) => (
                  <div key={issue.rowId} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Row {issue.rowIndex}</Badge>
                          <Badge variant={issue.canOpen ? "secondary" : "destructive"}>
                            {issue.canOpen ? "Ready" : "Needs fixes"}
                          </Badge>
                          {issue.confidential ? <Badge variant="outline">Confidential</Badge> : null}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {issue.title || "Missing title"}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground break-all">{issue.url}</p>
                        </div>
                      </div>

                      <Button type="button" variant="outline" size="sm" asChild>
                        <a href={issue.url} target="_blank" rel="noreferrer">
                          <Link2 data-icon="inline-start" />
                          Open one by one
                        </a>
                      </Button>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="font-medium text-foreground">Description template</dt>
                        <dd className="text-muted-foreground">{issue.descriptionTemplate || "Empty"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground">Related issue ID</dt>
                        <dd className="text-muted-foreground">{issue.relatedIssueId || "Empty"}</dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <div className="mb-1 text-sm font-medium text-foreground">Description</div>
                      <pre className="overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap text-foreground">
                        {issue.description || "Empty"}
                      </pre>
                    </div>

                    {issue.warnings.length > 0 ? (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-4" />
                          Warnings
                        </AlertTitle>
                        <AlertDescription>
                          <ul className="ml-4 list-disc">
                            {issue.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  Select rows in a CSV table to generate issue previews.
                </div>
              )}
            </TabsContent>

            <TabsContent value="urls" className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  These are the ready-to-open URLs. Use them if your browser blocks the bulk open action.
                </p>
              </div>
              <Textarea
                readOnly
                value={urlList}
                className="min-h-64 font-mono text-xs"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingOpenMode === "tabs" ? "Open many tabs?" : "Open many windows?"}
            </DialogTitle>
            <DialogDescription>
              This will attempt to open {validIssues.length} GitLab issue creation pages in separate{" "}
              {pendingOpenMode === "tabs" ? "tabs" : "windows"}.
              Your browser may still block some popups.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowDialog(false)
                onOpenSelected(pendingOpenMode)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
