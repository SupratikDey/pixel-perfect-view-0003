import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarClock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/civic/AppShell";
import { MapView } from "@/components/civic/MapView";
import { MetaPill, PriorityBadge, StatusBadge } from "@/components/civic/badges";
import { StorageImage } from "@/components/civic/StorageImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmIssue, useIssue, useMyConfirmations } from "@/lib/queries";
import { activeDuration, formatDate, formatMinutes, scoreBreakdown } from "@/lib/civic";

export const Route = createFileRoute("/issues/$issueId")({
  head: () => ({
    meta: [
      { title: "Issue details — CivicPulse" },
      {
        name: "description",
        content:
          "See a civic issue's photo, location, community confirmations, priority and the verified work done to resolve it.",
      },
      { property: "og:title", content: "Issue details — CivicPulse" },
      {
        property: "og:description",
        content: "Follow a neighbourhood civic issue from report to verified resolution.",
      },
    ],
  }),
  component: IssueDetailPage,
});

function IssueDetailPage() {
  const { issueId } = Route.useParams();
  const { data, isPending, isError } = useIssue(issueId);
  const { user, session } = useAuth();
  const { data: confirmed } = useMyConfirmations(user?.id);
  const confirmIssue = useConfirmIssue();

  if (isPending) {
    return (
      <AppShell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <div className="civic-card p-8 text-center">
          <p className="font-medium">This issue could not be found.</p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const { issue, completions } = data;
  const score = scoreBreakdown(issue);
  const verified = completions.find((c) => c.status === "VERIFIED");
  const latest = completions[0];
  const alreadyConfirmed = confirmed?.has(issue.id) || issue.reported_by === user?.id;

  async function handleConfirm() {
    if (!user) return;
    try {
      await confirmIssue.mutateAsync({ issueId: issue.id, userId: user.id });
      toast.success("Thanks — your confirmation was recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your confirmation could not be saved.");
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <div className="civic-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={score.priority} />
              <StatusBadge status={issue.status} />
              <MetaPill>{issue.category}</MetaPill>
            </div>
            <h1 className="mt-3 text-2xl font-semibold">{issue.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{issue.description}</p>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4" aria-hidden />
                First reported {formatDate(issue.created_at)}
              </p>
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <BadgeCheck className="size-4" aria-hidden />
                {issue.status === "RESOLVED"
                  ? `Resolved after ${activeDuration(issue.created_at, issue.updated_at)}`
                  : `Active for ${activeDuration(issue.created_at)}`}
              </p>
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" aria-hidden />
                {issue.confirmation_count} community confirmations
              </p>
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                {issue.address ?? `${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)}`}
              </p>
            </div>

            {issue.assigned_team ? (
              <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
                Assigned to <span className="font-medium">{issue.assigned_team}</span>
                {issue.worker ? (
                  <>
                    {" "}
                    · field worker <span className="font-medium">{issue.worker.name}</span>
                  </>
                ) : null}
              </p>
            ) : null}

            {session && !alreadyConfirmed && issue.status !== "RESOLVED" ? (
              <Button className="mt-4" onClick={handleConfirm} disabled={confirmIssue.isPending}>
                I have this problem too
              </Button>
            ) : null}
            {!session ? (
              <Button asChild className="mt-4" variant="secondary">
                <Link to="/auth">Sign in to confirm this issue</Link>
              </Button>
            ) : null}
          </div>

          <div className="civic-card p-3">
            <StorageImage
              path={issue.image_url}
              alt={issue.title}
              className="h-64 w-full"
              fallbackLabel="No photo was attached to this report"
            />
          </div>

          {latest && (issue.status === "COMPLETION_SUBMITTED" || issue.status === "RESOLVED") ? (
            <div className="civic-card p-5">
              <h2 className="text-lg font-semibold">
                {verified ? "Resolution" : "Work submitted, awaiting verification"}
              </h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label="Work performed" value={latest.work_description ?? "—"} />
                <Detail label="Time spent" value={formatMinutes(latest.time_spent_minutes)} />
                <Detail label="Completed" value={formatDate(latest.completed_at)} />
                <Detail
                  label="Verification"
                  value={
                    verified
                      ? `Verified by the municipal authority on ${formatDate(verified.verified_at)}`
                      : "Pending admin verification"
                  }
                />
                {latest.completion_notes ? (
                  <Detail label="Notes" value={latest.completion_notes} />
                ) : null}
              </dl>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Before
                  </p>
                  <StorageImage path={latest.before_image_url} alt="Before work" className="h-40 w-full" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    After
                  </p>
                  <StorageImage path={latest.after_image_url} alt="After work" className="h-40 w-full" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="civic-card p-3">
            <MapView
              className="h-64 w-full"
              center={[issue.latitude, issue.longitude]}
              zoom={16}
              issues={[
                {
                  id: issue.id,
                  title: issue.title,
                  category: issue.category,
                  priority: score.priority,
                  status: issue.status,
                  confirmation_count: issue.confirmation_count,
                  created_at: issue.created_at,
                  latitude: issue.latitude,
                  longitude: issue.longitude,
                },
              ]}
            />
          </div>

          <div className="civic-card p-5">
            <h2 className="text-lg font-semibold">Why this priority?</h2>
            <p className="text-xs text-muted-foreground">Explainable civic prioritisation</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Category severity</span>
                <span className="font-medium">+{score.severity}</span>
              </li>
              <li className="flex justify-between">
                <span>Community confirmations</span>
                <span className="font-medium">+{score.confirmations}</span>
              </li>
              <li className="flex justify-between">
                <span>How long it stayed active</span>
                <span className="font-medium">+{score.persistence}</span>
              </li>
              <li className="mt-2 flex justify-between border-t pt-2">
                <span className="font-semibold">Total score</span>
                <span className="font-semibold">{score.total}</span>
              </li>
            </ul>
          </div>

          {issue.remarks ? (
            <div className="civic-card p-5">
              <h2 className="text-lg font-semibold">Municipal remarks</h2>
              <p className="mt-2 text-sm text-muted-foreground">{issue.remarks}</p>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
