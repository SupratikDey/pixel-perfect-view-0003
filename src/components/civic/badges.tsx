import { cn } from "@/lib/utils";
import { STATUS_LABEL, type IssuePriority, type IssueStatus } from "@/lib/civic";

const priorityClasses: Record<IssuePriority, string> = {
  LOW: "bg-low/15 text-low border-low/30",
  MEDIUM: "bg-medium/20 text-warning-foreground border-medium/40",
  HIGH: "bg-high/15 text-high border-high/30",
  CRITICAL: "bg-critical/15 text-critical border-critical/30",
};

const statusClasses: Record<IssueStatus, string> = {
  REPORTED: "bg-muted text-muted-foreground border-border",
  VERIFIED: "bg-primary/10 text-primary border-primary/25",
  ASSIGNED: "bg-low/15 text-low border-low/30",
  IN_PROGRESS: "bg-accent/25 text-accent-foreground border-accent/40",
  COMPLETION_SUBMITTED: "bg-warning/25 text-warning-foreground border-warning/40",
  RESOLVED: "bg-success/15 text-success border-success/30",
  REJECTED: "bg-destructive/12 text-destructive border-destructive/30",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide";

export function PriorityBadge({
  priority,
  className,
}: {
  priority: IssuePriority;
  className?: string;
}) {
  return <span className={cn(base, priorityClasses[priority], className)}>{priority}</span>;
}

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  return <span className={cn(base, statusClasses[status], className)}>{STATUS_LABEL[status]}</span>;
}

export function MetaPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
