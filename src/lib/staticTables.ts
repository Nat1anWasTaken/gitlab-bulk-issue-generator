import { parseCsvTable } from "@/lib/csv"
import type { TableData } from "@/lib/types"

const csvModules = import.meta.glob("../data/tables/*.csv", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>

export const staticTables: TableData[] = Object.entries(csvModules)
  .map(([path, csvText]) => {
    const fileName = path.split("/").pop()?.replace(/\.csv$/i, "") ?? "table"

    return parseCsvTable({
      id: `static:${fileName}`,
      name: fileName,
      source: "static",
      csvText,
    })
  })
  .sort((left, right) => left.name.localeCompare(right.name))
