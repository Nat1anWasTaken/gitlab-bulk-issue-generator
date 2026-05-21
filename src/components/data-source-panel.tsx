import * as React from "react";
import { FileUp, Table2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TableData } from "@/lib/types";

type DataSourcePanelProps = {
  tables: TableData[];
  selectedTableId: string;
  selectedRowIds: Set<string>;
  uploadError: string;
  onTableChange: (tableId: string) => void;
  onCsvUpload: (file: File | null) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleRow: (rowId: string) => void;
};

export function DataSourcePanel({
  tables,
  selectedTableId,
  selectedRowIds,
  uploadError,
  onTableChange,
  onCsvUpload,
  onSelectAll,
  onDeselectAll,
  onToggleRow,
}: DataSourcePanelProps) {
  const fileInputId = React.useId();
  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? tables[0];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>資料來源</CardTitle>
        <CardDescription>每一個 Row 都會會變成一張卡片</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Table</span>
            <Select value={selectedTableId} onValueChange={onTableChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選擇資料來源" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                      {table.source === "uploaded" ? "（上傳）" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              上傳 CSV
            </span>
            <Button asChild variant="outline">
              <label htmlFor={fileInputId} className="cursor-pointer">
                <FileUp data-icon="inline-start" />
                上傳 CSV
              </label>
            </Button>
            <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                onCsvUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {uploadError ? (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        ) : null}

        {selectedTable ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                可用的變數
              </span>
              {selectedTable.headers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTable.headers.map((header) => (
                    <Badge
                      key={header}
                      variant="outline"
                    >{`{{${header}}}`}</Badge>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  這個 CSV 看起來是空的
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectAll}
              >
                全選
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDeselectAll}
              >
                重置
              </Button>
            </div>

            <div className="max-h-[25rem] overflow-auto rounded-lg border border-border">
              <Table className="min-w-[38rem]">
                <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">選擇 Row</span>
                    </TableHead>
                    <TableHead className="w-16 text-muted-foreground">
                      Row
                    </TableHead>
                    {selectedTable.headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTable.rows.length > 0 ? (
                    selectedTable.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer odd:bg-muted/20"
                        data-state={
                          selectedRowIds.has(row.id) ? "selected" : undefined
                        }
                        onClick={() => onToggleRow(row.id)}
                      >
                        <TableCell className="align-top">
                          <Checkbox
                            className="mt-1 cursor-pointer"
                            checked={selectedRowIds.has(row.id)}
                            onCheckedChange={() => onToggleRow(row.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Select row ${row.index}`}
                          />
                        </TableCell>
                        <TableCell className="align-top text-muted-foreground">
                          {row.index}
                        </TableCell>
                        {selectedTable.headers.map((header) => (
                          <TableCell
                            key={`${row.id}-${header}`}
                            className="align-top whitespace-normal break-words text-foreground"
                          >
                            {row.values[header] || (
                              <span className="text-muted-foreground">
                                空白
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={selectedTable.headers.length + 2}
                        className="py-8 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Table2 />
                          這個 CSV 中沒有可用的 Row
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            新增或選擇 CSV 資料表以開始預覽
          </div>
        )}
      </CardContent>
    </Card>
  );
}
