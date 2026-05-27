import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

export function StatusBadge({ status }: { status: "draft" | "queued" | "generating" | "completed" | "failed" }) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-50 text-success hover:bg-emerald-100 dark:bg-emerald-500/10 border-transparent">
        Completed
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="border-transparent">Failed</Badge>
    )
  }
  return (
    <Badge className="bg-orange-50 text-ember hover:bg-orange-100 dark:bg-orange-500/10 border-transparent">
      {status === "queued" ? "Queued" : status === "draft" ? "Draft" : "Generating"}
    </Badge>
  )
}

export function DifficultyBadge({ level }: { level: "easy" | "medium" | "hard" }) {
  const styles = {
    easy: "bg-emerald-50 text-success hover:bg-emerald-100 dark:bg-emerald-500/10",
    medium: "bg-orange-50 text-warning hover:bg-orange-100 dark:bg-orange-500/10",
    hard: "bg-red-50 text-danger hover:bg-red-100 dark:bg-red-500/10"
  }
  const labels = { easy: "Easy", medium: "Medium", hard: "Hard" }
  return (
    <Badge className={cn("border-transparent", styles[level])}>
      {labels[level]}
    </Badge>
  )
}
