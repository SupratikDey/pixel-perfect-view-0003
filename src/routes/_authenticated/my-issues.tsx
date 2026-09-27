import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Plus, Users } from "lucide-react";

import { AppShell } from "@/components/civic/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/civic/badges";
import { StorageImage } from "@/components/civic/StorageImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useIssues } from "@/lib/queries";
import { activeDuration, formatDate, scoreBreakdown } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/my-issues")({
  head: () => ({
    meta: [
      { title: "My reported issues — CivicPulse" },
      {
        name: "description",
        content: "Track every civic issue you reported, its community confirmations, priority and status.",
      },
      { property: "og:title", content: "My reported issues — CivicPulse" },
      {
        property: "og:description",
        content: "Track your reported civic issues from submission to verified resolution.",
      },
    ],
  }),
  component: MyIssuesPage,
});

function MyIssuesPage() {
  const { user } = useAuth();
  const { data: issues, isPending, isError } = useIssues({ reportedBy: user?.id });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My issues</h1>
          <p className="text-sm text-muted-foreground">
            Everything you reported, with live community confirmations and priority.
          </p>
        </div>
        <Button asChild>
          <Link to="/report">
            <Plus className="size-4" aria-hidden />
            Report a new issue
          </Link>
        </Button>
      </div>

      {isError ? (
        <p className="mt-6 text-sm text-destructive">
          We couldn't load your issues. Please check your connection and refresh.
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {isPending
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : (issues ?? []).length === 0
            ? (
                <div className="civic-card p-8 text-center">
                  <p className="font-medium">You haven't reported anything yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Spotted a pothole, overflowing bin or broken streetlight? Report it in under a minute.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/report">Report an issue</Link>
                  </Button>
                </div>
              )
            : (issues ?? []).map((issue) => {
                const score = scoreBreakdown(issue);
                return (
                  <Link
                    key={issue.id}
                    to="/issues/$issueId"
                    params={{ issueId: issue.id }}
                    className="civic-card flex flex-col gap-4 p-4 transition-shadow hover:shadow-lg sm:flex-row"
                  >
                    <StorageImage
                      path={issue.image_url}
                      alt={issue.title}
                      className="h-28 w-full shrink-0 sm:w-40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={score.priority} />
                        <StatusBadge status={issue.status} />
                        <span className="text-xs text-muted-foreground">{issue.category}</span>
                      </div>
                      <p className="mt-2 truncate font-semibold">{issue.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {issue.address ?? "Location pinned"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" aria-hidden />
                          {issue.confirmation_count} confirmations
                        </span>
                        <span>
                          {issue.status === "RESOLVED"
                            ? `Resolved after ${activeDuration(issue.created_at, issue.updated_at)}`
                            : `Active for ${activeDuration(issue.created_at)}`}
                        </span>
                        <span>Reported {formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
      </div>
    </AppShell>
  );
}
