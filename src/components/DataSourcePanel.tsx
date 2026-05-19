import * as React from "react"
import { FileUp, Table2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
            <select
              value={selectedTableId}
              onChange={(event) => onTableChange(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                  {table.source === "uploaded" ? " (temporary)" : ""}
                </option>
              ))}
            </select>
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
          <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            {uploadError}
          </div>
        ) : null}

        {selectedTable ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selectedTable.source === "static" ? "outline" : "secondary"}>
                {selectedTable.source === "static" ? "Bundled CSV" : "Temporary upload"}
              </Badge>
              <Badge variant="outline">{selectedTable.rows.length} rows</Badge>
              <Badge variant="outline">{selectedTable.headers.length} columns</Badge>
              <Badge variant="secondary">{selectedRowIds.size} selected</Badge>
            </div>

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

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="max-h-[25rem] overflow-auto">
                <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                    <tr>
                      <th className="w-12 border-b border-border px-3 py-2">
                        <span className="sr-only">Select row</span>
                      </th>
                      <th className="w-16 border-b border-border px-3 py-2 text-muted-foreground">
                        Row
                      </th>
                      {selectedTable.headers.map((header) => (
                        <th
                          key={header}
                          className="border-b border-border px-3 py-2 font-medium text-foreground"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.rows.length > 0 ? (
                      selectedTable.rows.map((row) => (
                        <tr key={row.id} className="odd:bg-muted/20">
                          <td className="border-b border-border px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              className="mt-1 size-4"
                              checked={selectedRowIds.has(row.id)}
                              onChange={() => onToggleRow(row.id)}
                            />
                          </td>
                          <td className="border-b border-border px-3 py-2 align-top text-muted-foreground">
                            {row.index}
                          </td>
                          {selectedTable.headers.map((header) => (
                            <td
                              key={`${row.id}-${header}`}
                              className="border-b border-border px-3 py-2 align-top text-foreground"
                            >
                              {row.values[header] || <span className="text-muted-foreground">Empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={selectedTable.headers.length + 2}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Table2 />
                            No rows are available in this table.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
