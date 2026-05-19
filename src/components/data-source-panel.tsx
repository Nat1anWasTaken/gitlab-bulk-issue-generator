import * as React from "react"
import { FileUp, Table2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TableData } from "@/lib/types"

type DataSourcePanelProps = {
  tables: TableData[]
  selectedTableId: string
  selectedTable: TableData | undefined
  selectedRowIds: Set<string>
  uploadError: string
  onTableChange: (tableId: string) => void
  onCsvUpload: (file: File | null) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onToggleRow: (rowId: string) => void
}

export function DataSourcePanel({
  tables,
  selectedTableId,
  selectedTable,
  selectedRowIds,
  uploadError,
  onTableChange,
  onCsvUpload,
  onSelectAll,
  onDeselectAll,
  onToggleRow,
}: DataSourcePanelProps) {
  const fileInputId = React.useId()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Mail merge data source</CardTitle>
        <CardDescription>
          Each CSV row becomes one issue. Static tables are bundled from <span className="font-mono">src/data/tables/</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Table</span>
            <Select value={selectedTableId} onValueChange={onTableChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a CSV table" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                      {table.source === "uploaded" ? " (temporary)" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Upload CSV</span>
            <Button asChild variant="outline">
              <label
                htmlFor={fileInputId}
                className="cursor-pointer"
              >
                <FileUp data-icon="inline-start" />
                Add temporary table
              </label>
            </Button>
            <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                onCsvUpload(event.target.files?.[0] ?? null)
                event.currentTarget.value = ""
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
              <span className="text-sm font-medium text-foreground">Available variables</span>
              {selectedTable.headers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTable.headers.map((header) => (
                    <Badge key={header} variant="outline">{`{{${header}}}`}</Badge>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  This table is empty.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
                Select all
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onDeselectAll}>
                Deselect all
              </Button>
            </div>

            <div className="max-h-[25rem] overflow-auto rounded-lg border border-border">
              <Table className="min-w-[38rem]">
                <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">Select row</span>
                    </TableHead>
                    <TableHead className="w-16 text-muted-foreground">Row</TableHead>
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
                        data-state={selectedRowIds.has(row.id) ? "selected" : undefined}
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
                        <TableCell className="align-top text-muted-foreground">{row.index}</TableCell>
                        {selectedTable.headers.map((header) => (
                          <TableCell
                            key={`${row.id}-${header}`}
                            className="align-top whitespace-normal break-words text-foreground"
                          >
                            {row.values[header] || <span className="text-muted-foreground">Empty</span>}
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
                          No rows are available in this table.
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
            Add or select a CSV table to start the mail merge preview.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
