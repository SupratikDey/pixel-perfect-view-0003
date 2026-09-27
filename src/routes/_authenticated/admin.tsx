import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, ClipboardList, Clock, Loader2, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/civic/AppShell";
import { MapView } from "@/components/civic/MapView";
import { RoleGate } from "@/components/civic/RoleGate";
import { PriorityBadge, StatusBadge } from "@/components/civic/badges";
import { StorageImage } from "@/components/civic/StorageImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  useAssignIssue,
  useFieldWorkers,
  useIssue,
  useIssues,
  useReviewCompletion,
  useUpdateIssue,
  type IssueRow,
} from "@/lib/queries";
import {
  ACTIVE_STATUSES,
  CATEGORIES,
  PRIORITY_HEX,
  STATUSES,
  STATUS_LABEL,
  TEAMS,
  activeDuration,
  formatDate,
  formatMinutes,
  scoreBreakdown,
} from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Municipal command center — CivicPulse" },
      {
        name: "description",
        content:
          "Live civic issue metrics, priority map, work queue, team assignment and completion verification for municipal administrators.",
      },
      { property: "og:title", content: "Municipal command center — CivicPulse" },
      {
        property: "og:description",
        content: "Live metrics, priority queue, assignment and completion verification.",
      },
    ],
  }),
  component: () => (
    <RoleGate allow="ADMIN">
      <AdminPage />
    </RoleGate>
  ),
});

function AdminPage() {
  const { data: issues, isPending, isError } = useIssues();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);

  const scored = useMemo(
    () => (issues ?? []).map((issue) => ({ issue, score: scoreBreakdown(issue) })),
    [issues],
  );

  const metrics = useMemo(() => {
    const all = scored.map((s) => s.issue);
    const active = all.filter((i) => ACTIVE_STATUSES.includes(i.status));
    return {
      total: all.length,
      active: active.length,
      awaiting: all.filter((i) => i.status === "COMPLETION_SUBMITTED").length,
      resolved: all.filter((i) => i.status === "RESOLVED").length,
      unassigned: all.filter((i) => !i.assigned_worker_id && ACTIVE_STATUSES.includes(i.status)).length,
      confirmations: all.reduce((sum, i) => sum + i.confirmation_count, 0),
      critical: scored.filter(
        (s) => s.score.priority === "CRITICAL" && ACTIVE_STATUSES.includes(s.issue.status),
      ).length,
    };
  }, [scored]);

  const byCategory = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        count: scored.filter((s) => s.issue.category === category).length,
      })).filter((row) => row.count > 0),
    [scored],
  );

  const byStatus = useMemo(
    () =>
      STATUSES.map((status) => ({
        status: STATUS_LABEL[status],
        count: scored.filter((s) => s.issue.status === status).length,
      })).filter((row) => row.count > 0),
    [scored],
  );

  const queue = useMemo(
    () =>
      scored
        .filter((s) => (statusFilter === "ALL" ? true : s.issue.status === statusFilter))
        .filter((s) => (categoryFilter === "ALL" ? true : s.issue.category === categoryFilter))
        .filter((s) => (priorityFilter === "ALL" ? true : s.score.priority === priorityFilter))
        .sort((a, b) => b.score.total - a.score.total),
    [scored, statusFilter, categoryFilter, priorityFilter],
  );

  const statusColors = ["#0f766e", "#0ea5e9", "#6366f1", "#f59e0b", "#eab308", "#16a34a", "#dc2626"];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Municipal command center</h1>
          <p className="text-sm text-muted-foreground">
            Every number below is read live from the civic database.
          </p>
        </div>
      </div>

      {isError ? (
        <p className="mt-6 text-sm text-destructive">
          The dashboard data could not be loaded. Please refresh the page.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total issues" value={metrics.total} pending={isPending} icon={ClipboardList} />
        <Metric label="Active issues" value={metrics.active} pending={isPending} icon={Clock} />
        <Metric
          label="Awaiting verification"
          value={metrics.awaiting}
          pending={isPending}
          icon={CheckCircle2}
        />
        <Metric label="Resolved" value={metrics.resolved} pending={isPending} icon={CheckCircle2} />
        <Metric label="Unassigned & active" value={metrics.unassigned} pending={isPending} icon={Users} />
        <Metric label="Critical & active" value={metrics.critical} pending={isPending} icon={Clock} />
        <Metric
          label="Community confirmations"
          value={metrics.confirmations}
          pending={isPending}
          icon={Users}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="civic-card p-4">
          <h2 className="text-lg font-semibold">Issues by category</h2>
          {isPending ? (
            <Skeleton className="mt-4 h-64 w-full" />
          ) : byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No issues recorded yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-18} dy={8} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="civic-card p-4">
          <h2 className="text-lg font-semibold">Issues by status</h2>
          {isPending ? (
            <Skeleton className="mt-4 h-64 w-full" />
          ) : byStatus.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No issues recorded yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="status" outerRadius={90} label>
                    {byStatus.map((row, index) => (
                      <Cell key={row.status} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="civic-card mt-6 p-3">
        <h2 className="px-2 pb-2 text-lg font-semibold">Issue map by priority</h2>
        <MapView
          className="h-[24rem] w-full"
          issues={scored
            .filter((s) => ACTIVE_STATUSES.includes(s.issue.status))
            .map((s) => ({
              id: s.issue.id,
              title: s.issue.title,
              category: s.issue.category,
              priority: s.score.priority,
              status: s.issue.status,
              confirmation_count: s.issue.confirmation_count,
              created_at: s.issue.created_at,
              latitude: s.issue.latitude,
              longitude: s.issue.longitude,
            }))}
        />
        <div className="flex flex-wrap gap-4 px-2 pt-3 text-xs text-muted-foreground">
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: PRIORITY_HEX[p] }}
                aria-hidden
              />
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Work queue</h2>
            <p className="text-sm text-muted-foreground">
              Sorted by priority score — highest first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => ({ value: p, label: p }))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isPending ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : queue.length === 0 ? (
            <p className="civic-card p-6 text-sm text-muted-foreground">
              No issues match these filters.
            </p>
          ) : (
            queue.map(({ issue, score }) => (
              <div key={issue.id} className="civic-card flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={score.priority} />
                    <StatusBadge status={issue.status} />
                    <span className="text-xs text-muted-foreground">{issue.category}</span>
                    <span className="text-xs font-semibold">Score {score.total}</span>
                  </div>
                  <p className="mt-1.5 truncate font-semibold">{issue.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {issue.confirmation_count} confirmations · active for{" "}
                    {activeDuration(issue.created_at)} · reported by {issue.reporter?.name ?? "citizen"}
                    {issue.worker ? ` · with ${issue.worker.name}` : " · unassigned"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setOpenIssueId(issue.id)}>
                    Manage
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/issues/$issueId" params={{ issueId: issue.id }}>
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ManageDialog issueId={openIssueId} onClose={() => setOpenIssueId(null)} />
    </AppShell>
  );
}

function Metric({
  label,
  value,
  pending,
  icon: Icon,
}: {
  label: string;
  value: number;
  pending: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="civic-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-1 font-display text-2xl font-semibold">
        {pending ? <Skeleton className="h-7 w-12" /> : value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="w-40">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ManageDialog({ issueId, onClose }: { issueId: string | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(issueId)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {issueId ? <ManageBody issueId={issueId} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ManageBody({ issueId, onClose }: { issueId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data, isPending } = useIssue(issueId);
  const { data: workers } = useFieldWorkers();
  const assign = useAssignIssue();
  const update = useUpdateIssue();
  const review = useReviewCompletion();

  const [team, setTeam] = useState<string>("");
  const [workerId, setWorkerId] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [initialised, setInitialised] = useState(false);

  if (isPending || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const issue: IssueRow = data.issue;
  const latest = data.completions[0];

  if (!initialised) {
    setTeam(issue.assigned_team ?? "");
    setWorkerId(issue.assigned_worker_id ?? "");
    setRemarks(issue.remarks ?? "");
    setInitialised(true);
  }

  const score = scoreBreakdown(issue);

  async function handleAssign() {
    if (!user) return;
    if (!team && !workerId) {
      toast.error("Choose a team or a field worker before assigning.");
      return;
    }
    try {
      await assign.mutateAsync({
        issueId: issue.id,
        workerId: workerId || null,
        team: team || null,
        adminId: user.id,
        remarks: remarks.trim() || null,
      });
      toast.success(workerId ? "Issue assigned to the field worker." : "Team assigned.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The assignment could not be saved.");
    }
  }

  async function setStatus(status: "VERIFIED" | "REJECTED") {
    try {
      await update.mutateAsync({
        id: issue.id,
        patch: { status, remarks: remarks.trim() || null },
      });
      toast.success(status === "VERIFIED" ? "Issue marked as verified." : "Issue rejected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The status could not be updated.");
    }
  }

  async function handleReview(approve: boolean) {
    if (!user || !latest) return;
    if (!approve && !remarks.trim()) {
      toast.error("Add remarks explaining what needs rework.");
      return;
    }
    try {
      await review.mutateAsync({
        issueId: issue.id,
        completionId: latest.id,
        adminId: user.id,
        approve,
        remarks: remarks.trim() || null,
      });
      toast.success(approve ? "Completion verified — issue resolved." : "Rework requested.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The review could not be saved.");
    }
  }

  const busy = assign.isPending || update.isPending || review.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{issue.title}</DialogTitle>
        <DialogDescription>
          {issue.category} · reported {formatDate(issue.created_at)} by{" "}
          {issue.reporter?.name ?? "citizen"}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={score.priority} />
        <StatusBadge status={issue.status} />
        <span className="text-xs text-muted-foreground">
          Score {score.total} = severity {score.severity} + confirmations {score.confirmations} +
          persistence {score.persistence}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{issue.description}</p>
      <StorageImage path={issue.image_url} alt={issue.title} className="h-44 w-full" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Team</Label>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent>
              {TEAMS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Field worker</Label>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a field worker" />
            </SelectTrigger>
            <SelectContent>
              {(workers ?? []).length === 0 ? (
                <SelectItem value="none" disabled>
                  No field worker accounts found
                </SelectItem>
              ) : (
                (workers ?? []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                    {w.team ? ` — ${w.team}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Remarks for the citizen and worker</Label>
        <Textarea
          className="mt-1"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add context, instructions or the reason for rejection."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAssign} disabled={busy}>
          {assign.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Assign
        </Button>
        {issue.status === "REPORTED" ? (
          <Button variant="secondary" onClick={() => setStatus("VERIFIED")} disabled={busy}>
            Verify issue
          </Button>
        ) : null}
        {issue.status !== "RESOLVED" && issue.status !== "REJECTED" ? (
          <Button variant="ghost" onClick={() => setStatus("REJECTED")} disabled={busy}>
            Reject issue
          </Button>
        ) : null}
      </div>

      {latest && issue.status === "COMPLETION_SUBMITTED" ? (
        <div className="rounded-xl border bg-muted/40 p-4">
          <h3 className="font-semibold">Completion submitted by {issue.worker?.name ?? "worker"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {latest.work_description ?? "No description provided."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Time spent {formatMinutes(latest.time_spent_minutes)} · submitted{" "}
            {formatDate(latest.submitted_at)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Before</p>
              <StorageImage path={latest.before_image_url} alt="Before work" className="h-36 w-full" />
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">After</p>
              <StorageImage path={latest.after_image_url} alt="After work" className="h-36 w-full" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => handleReview(true)} disabled={busy}>
              <CheckCircle2 className="size-4" aria-hidden />
              Verify & resolve
            </Button>
            <Button variant="secondary" onClick={() => handleReview(false)} disabled={busy}>
              <RotateCcw className="size-4" aria-hidden />
              Request rework
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
