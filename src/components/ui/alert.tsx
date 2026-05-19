import type * as React from "react"

import { cn } from "@/lib/utils"

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "destructive"
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/20 bg-destructive/8 text-destructive"
          : "border-border bg-muted/50 text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-medium", className)} {...props} />
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mt-1 text-sm", className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
