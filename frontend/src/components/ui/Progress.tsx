import * as React from "react"

import { cn } from "../../utils/cn"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
  }
>(({ className, value, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-slate-900 transition-all dark:bg-slate-400"
      style={{
        transform: `translateX(-${100 - ((value || 0) / max) * 100}%)`,
      }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }