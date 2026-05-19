import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.")
  }

  return context
}

function Tabs({
  value,
  onValueChange,
  className,
  children,
}: React.PropsWithChildren<{
  value: string
  onValueChange: (value: string) => void
  className?: string
}>) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  children,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const { value: activeValue, setValue } = useTabsContext()

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
        activeValue === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({
  className,
  value,
  children,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const { value: activeValue } = useTabsContext()

  if (activeValue !== value) {
    return null
  }

  return <div className={className}>{children}</div>
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
