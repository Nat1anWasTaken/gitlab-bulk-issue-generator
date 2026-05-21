import * as React from "react";
import {
  AlertTriangle,
  Copy,
  Download,
  Link2,
  MonitorUp,
  PanelsTopLeft,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedIssue } from "@/lib/types";

type GeneratedPreviewProps = {
  generatedIssues: GeneratedIssue[];
  tableSelected: boolean;
  tableIsEmpty: boolean;
  activeUrlIsValid: boolean;
  onOpenSelected: (mode: "tabs" | "windows", urls: string[]) => void;
};

const BULK_OPEN_CONFIRMATION_COUNT = 8;

export function GeneratedPreview({
  generatedIssues,
  tableSelected,
  tableIsEmpty,
  activeUrlIsValid,
  onOpenSelected,
}: GeneratedPreviewProps) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState("");
  const [pendingOpenMode, setPendingOpenMode] = React.useState<
    "tabs" | "windows"
  >("tabs");

  const validIssues = generatedIssues.filter((issue) => issue.canOpen);
  const invalidIssues = generatedIssues.filter((issue) => !issue.canOpen);
  const validIssueUrls = validIssues.map((issue) => issue.url);
  const urlList = validIssueUrls.join("\n");

  const blockingMessages: string[] = [];

  if (!tableSelected) {
    blockingMessages.push("請先選擇資料來源。");
  }

  if (tableIsEmpty) {
    blockingMessages.push("請先選擇資料來源");
  }

  if (generatedIssues.length === 0) {
    blockingMessages.push("你沒有選擇任何的 Row");
  }

  if (!activeUrlIsValid) {
    blockingMessages.push("GitLab Project URL 無效");
  }

  if (invalidIssues.length > 0) {
    blockingMessages.push(`${invalidIssues.length} 筆資料有問題`);
  }

  async function copyUrls() {
    if (!urlList) {
      return;
    }

    await navigator.clipboard.writeText(urlList);
    setCopyStatus("已複製 URL");
    window.setTimeout(() => setCopyStatus(""), 2000);
  }

  function downloadUrls() {
    if (!urlList) {
      return;
    }

    const blob = new Blob([urlList], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = "gitlab-issue-urls.txt";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function handleOpenClick(mode: "tabs" | "windows") {
    if (validIssues.length >= BULK_OPEN_CONFIRMATION_COUNT) {
      setPendingOpenMode(mode);
      setShowDialog(true);
      return;
    }

    onOpenSelected(mode, validIssueUrls);
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>卡片預覽</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{generatedIssues.length} 筆已選</Badge>
              <Badge variant="secondary">{validIssues.length} 筆可開啟</Badge>
              {invalidIssues.length > 0 ? (
                <Badge variant="destructive">
                  {invalidIssues.length} 筆需要修正
                </Badge>
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
              在新分頁中開啟
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenClick("windows")}
              disabled={blockingMessages.length > 0}
            >
              <MonitorUp data-icon="inline-start" />
              在新視窗中開啟
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyUrls()}
              disabled={!urlList}
            >
              <Copy data-icon="inline-start" />
              複製所有的 URL
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadUrls}
              disabled={!urlList}
            >
              <Download data-icon="inline-start" />
              下載 URL
            </Button>
            {copyStatus ? (
              <span className="self-center text-sm text-muted-foreground">
                {copyStatus}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">
            如果按鈕沒有工作，請檢查瀏覽器是否封鎖了快顯視窗。
          </div>
          <Separator />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {blockingMessages.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>操作被封鎖</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 list-disc">
                  {blockingMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                卡片列表
              </h3>
            </div>
            {generatedIssues.length > 0 ? (
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                {generatedIssues.map((issue) => (
                  <div
                    key={issue.rowId}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            第 {issue.rowIndex} 列
                          </Badge>
                          <Badge
                            variant={
                              issue.canOpen ? "secondary" : "destructive"
                            }
                          >
                            {issue.canOpen ? "就緒" : "需要修正"}
                          </Badge>
                          {issue.confidential ? (
                            <Badge variant="outline">機密</Badge>
                          ) : null}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {issue.title || "缺少標題"}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground break-all">
                            {issue.url}
                          </p>
                        </div>
                      </div>

                      <Button type="button" variant="outline" size="sm" asChild>
                        <a href={issue.url} target="_blank" rel="noreferrer">
                          <Link2 data-icon="inline-start" />
                          逐一開啟
                        </a>
                      </Button>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="font-medium text-foreground">
                          Related issue ID
                        </dt>
                        <dd className="text-muted-foreground">
                          {issue.relatedIssueId || "空白"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        Description
                      </div>
                      <pre className="overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap text-foreground">
                        {issue.description || "空白"}
                      </pre>
                    </div>

                    {issue.warnings.length > 0 ? (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-4" />
                          警告
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
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                在 CSV 資料表中选择列以產生卡片預覽。
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                開啟卡片
              </h3>
              <p className="text-sm text-muted-foreground">
                若瀏覽器封鎖了批量開啟操作，可使用此清單手動開啟卡片。
              </p>
            </div>
            <Textarea
              readOnly
              value={urlList}
              className="min-h-64 font-mono text-xs"
            />
          </section>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingOpenMode === "tabs"
                ? "要開啟多個分頁嗎？"
                : "要開啟多個視窗嗎？"}
            </DialogTitle>
            <DialogDescription>
              This will attempt to open {validIssues.length} 個 GitLab
              卡片建立頁面到不同的{" "}
              {pendingOpenMode === "tabs" ? "分頁" : "視窗"}。
              你的瀏覽器可能仍會封鎖部分快顯視窗。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowDialog(false);
                onOpenSelected(pendingOpenMode, validIssueUrls);
              }}
            >
              繼續
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
