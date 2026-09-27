import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Loader2, MapPin, PlayCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/civic/AppShell";
import { PhotoUpload } from "@/components/civic/PhotoUpload";
import { RoleGate } from "@/components/civic/RoleGate";
import { PriorityBadge, StatusBadge } from "@/components/civic/badges";
import { StorageImage } from "@/components/civic/StorageImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useIssue,
  useIssues,
  useStartTask,
  useSubmitCompletion,
  type IssueRow,
} from "@/lib/queries";
import { activeDuration, formatDate, formatMinutes, scoreBreakdown } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({
    meta: [
      { title: "My field tasks — CivicPulse" },
      {
        name: "description",
        content:
          "Field worker dashboard: start assigned civic repairs, submit before and after photos, time spent and work notes for verification.",
      },
      { property: "og:title", content: "My field tasks — CivicPulse" },
      {
        property: "og:description",
        content: "Start assigned repairs and submit verified completion evidence.",
      },
    ],
  }),
  component: () => (
    <RoleGate allow="FIELD_WORKER">
      <WorkerPage />
    </RoleGate>
  ),
});

function WorkerPage() {
  const { user, profile } = useAuth();
  const { data: issues, isPending, isError } = useIssues({ workerId: user?.id });
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const all = issues ?? [];
    return {
      assigned: all.filter((i) => i.status === "ASSIGNED"),
      inProgress: all.filter((i) => i.status === "IN_PROGRESS"),
      awaiting: all.filter((i) => i.status === "COMPLETION_SUBMITTED"),
      resolved: all.filter((i) => i.status === "RESOLVED"),
    };
  }, [issues]);

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-semibold">My tasks</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.name ?? "Field worker"}
          {profile?.team ? ` · ${profile.team}` : ""} — assignments come from the municipal
          administrator.
        </p>
      </div>

      {isError ? (
        <p className="mt-6 text-sm text-destructive">
          Your tasks could not be loaded. Please refresh the page.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Assigned" value={groups.assigned.length} pending={isPending} />
        <Stat label="In progress" value={groups.inProgress.length} pending={isPending} />
        <Stat label="Awaiting verification" value={groups.awaiting.length} pending={isPending} />
        <Stat label="Resolved" value={groups.resolved.length} pending={isPending} />
      </div>

      <Tabs defaultValue="assigned" className="mt-6">
        <TabsList>
          <TabsTrigger value="assigned">Assigned ({groups.assigned.length})</TabsTrigger>
          <TabsTrigger value="inProgress">In progress ({groups.inProgress.length})</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting verification ({groups.awaiting.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({groups.resolved.length})</TabsTrigger>
        </TabsList>
        {(["assigned", "inProgress", "awaiting", "resolved"] as const).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {isPending ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : groups[key].length === 0 ? (
              <p className="civic-card p-6 text-sm text-muted-foreground">
                Nothing in this list right now.
              </p>
            ) : (
              groups[key].map((issue) => (
                <TaskCard key={issue.id} issue={issue} onOpen={() => setOpenIssueId(issue.id)} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={Boolean(openIssueId)} onOpenChange={(o) => (o ? null : setOpenIssueId(null))}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {openIssueId ? (
            <TaskBody issueId={openIssueId} onClose={() => setOpenIssueId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Stat({ label, value, pending }: { label: string; value: number; pending: boolean }) {
  return (
    <div className="civic-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">
        {pending ? <Skeleton className="h-7 w-10" /> : value}
      </p>
    </div>
  );
}

function TaskCard({ issue, onOpen }: { issue: IssueRow; onOpen: () => void }) {
  const score = scoreBreakdown(issue);
  return (
    <div className="civic-card flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={score.priority} />
          <StatusBadge status={issue.status} />
          <span className="text-xs text-muted-foreground">{issue.category}</span>
        </div>
        <p className="mt-1.5 truncate font-semibold">{issue.title}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {issue.address ?? `${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)}`}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {issue.confirmation_count} confirmations
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            Active for {activeDuration(issue.created_at)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onOpen}>
          Open task
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/issues/$issueId" params={{ issueId: issue.id }}>
            Details
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TaskBody({ issueId, onClose }: { issueId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data, isPending } = useIssue(issueId);
  const startTask = useStartTask();
  const submit = useSubmitCompletion();

  const [workDescription, setWorkDescription] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [notes, setNotes] = useState("");
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isPending || !data || !user) return <Skeleton className="h-64 w-full" />;

  const issue = data.issue;
  const open = data.completions.find((c) => c.status !== "VERIFIED") ?? null;
  const mine = issue.assigned_worker_id === user.id;

  async function handleStart() {
    try {
      await startTask.mutateAsync({ issueId: issue.id, workerId: user!.id });
      toast.success("Task started. The citizen can now see work in progress.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The task could not be started.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const minutes = Number(timeSpent);
    if (workDescription.trim().length < 15)
      next.work = "Describe the work performed in at least 15 characters.";
    if (!Number.isFinite(minutes) || minutes <= 0)
      next.time = "Enter the time spent in minutes (a number above 0).";
    if (!before) next.before = "A before photo is required.";
    if (!after) next.after = "An after photo is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await submit.mutateAsync({
        issueId: issue.id,
        workerId: user!.id,
        completionId: open?.id ?? null,
        startedAt: open?.started_at ?? null,
        timeSpentMinutes: Math.round(minutes),
        workDescription: workDescription.trim(),
        completionNotes: notes.trim() || null,
        beforeImageUrl: before,
        afterImageUrl: after,
      });
      toast.success("Completion submitted for admin verification.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your completion could not be submitted.");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{issue.title}</DialogTitle>
        <DialogDescription>
          {issue.category} · reported {formatDate(issue.created_at)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={scoreBreakdown(issue).priority} />
        <StatusBadge status={issue.status} />
      </div>
      <p className="text-sm text-muted-foreground">{issue.description}</p>
      <StorageImage path={issue.image_url} alt={issue.title} className="h-40 w-full" />
      {issue.remarks ? (
        <p className="rounded-lg bg-muted/60 p-3 text-sm">
          <span className="font-medium">Admin remarks: </span>
          {issue.remarks}
        </p>
      ) : null}

      {!mine ? (
        <p className="text-sm text-destructive">This task is not assigned to you.</p>
      ) : issue.status === "ASSIGNED" ? (
        <Button onClick={handleStart} disabled={startTask.isPending}>
          {startTask.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <PlayCircle className="size-4" aria-hidden />
          )}
          Start this task
        </Button>
      ) : issue.status === "IN_PROGRESS" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Started {formatDate(open?.started_at)} — submit evidence when the work is done.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <PhotoUpload
                label="Before photo"
                userId={user.id}
                kind="before"
                value={before}
                onChange={setBefore}
              />
              {errors.before ? <p className="text-sm text-destructive">{errors.before}</p> : null}
            </div>
            <div>
              <PhotoUpload
                label="After photo"
                userId={user.id}
                kind="after"
                value={after}
                onChange={setAfter}
              />
              {errors.after ? <p className="text-sm text-destructive">{errors.after}</p> : null}
            </div>
          </div>
          <div>
            <Label htmlFor="work">Work performed</Label>
            <Textarea
              id="work"
              className="mt-1"
              rows={3}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="Filled the pothole with hot mix asphalt and compacted the surface."
            />
            {errors.work ? <p className="text-sm text-destructive">{errors.work}</p> : null}
          </div>
          <div>
            <Label htmlFor="time">Time spent (minutes)</Label>
            <Input
              id="time"
              className="mt-1"
              inputMode="numeric"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="90"
            />
            {errors.time ? <p className="text-sm text-destructive">{errors.time}</p> : null}
          </div>
          <div>
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              className="mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Submit completion for verification
          </Button>
        </form>
      ) : issue.status === "COMPLETION_SUBMITTED" ? (
        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          Submitted {formatDate(open?.submitted_at)} · time spent{" "}
          {formatMinutes(open?.time_spent_minutes)}. Waiting for administrator verification.
        </div>
      ) : (
        <div className="rounded-lg bg-success/10 p-3 text-sm">
          This issue is {issue.status === "RESOLVED" ? "resolved and verified" : "closed"}.
        </div>
      )}
    </>
  );
}
