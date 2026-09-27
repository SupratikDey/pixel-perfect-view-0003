import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, Users } from "lucide-react";

import { AppShell } from "@/components/civic/AppShell";
import { MapView } from "@/components/civic/MapView";
import { PriorityBadge, StatusBadge } from "@/components/civic/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, homeForRole } from "@/hooks/useAuth";
import { useIssues } from "@/lib/queries";
import { ACTIVE_STATUSES, activeDuration, scoreBreakdown } from "@/lib/civic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicPulse — neighbourhood issues, resolved and verified" },
      {
        name: "description",
        content:
          "Report potholes, garbage, streetlights and water leaks, confirm issues your neighbours already raised, and follow each one to verified resolution.",
      },
      { property: "og:title", content: "CivicPulse — neighbourhood issues, resolved and verified" },
      {
        property: "og:description",
        content:
          "Report civic issues, confirm shared problems and follow municipal work through to verified resolution.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { session, role } = useAuth();
  const { data: issues, isPending } = useIssues();

  const active = (issues ?? []).filter((i) => ACTIVE_STATUSES.includes(i.status));
  const resolved = (issues ?? []).filter((i) => i.status === "RESOLVED");
  const confirmations = (issues ?? []).reduce((sum, i) => sum + i.confirmation_count, 0);
  const topIssues = [...active]
    .sort((a, b) => scoreBreakdown(b).total - scoreBreakdown(a).total)
    .slice(0, 4);

  return (
    <AppShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="size-4" aria-hidden />
            From citizen report to verified resolution
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Your neighbourhood problems, tracked until they are actually fixed.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Report an issue with a photo and a location. If a neighbour already reported the same
            thing, add your confirmation instead of a duplicate. Priority rises with severity,
            community confirmations and how long the problem has been left unresolved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session ? (
              <Button asChild size="lg">
                <Link to={homeForRole(role)}>
                  Go to my dashboard
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Report an issue
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth" search={{ mode: "login" }}>
                    Sign in
                  </Link>
                </Button>
              </>
            )}
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Active issues" value={isPending ? null : active.length} />
            <Stat label="Resolved" value={isPending ? null : resolved.length} />
            <Stat label="Confirmations" value={isPending ? null : confirmations} />
          </dl>
        </div>

        <div className="civic-card overflow-hidden p-2">
          <MapView
            className="h-[22rem] w-full"
            issues={active.map((i) => ({
              id: i.id,
              title: i.title,
              category: i.category,
              priority: scoreBreakdown(i).priority,
              status: i.status,
              confirmation_count: i.confirmation_count,
              created_at: i.created_at,
              latitude: i.latitude,
              longitude: i.longitude,
            }))}
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Needs attention now</h2>
            <p className="text-sm text-muted-foreground">
              Ranked by explainable civic prioritisation: category severity, confirmations and how
              long the issue has stayed active.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            : topIssues.map((issue) => {
                const score = scoreBreakdown(issue);
                return (
                  <Link
                    key={issue.id}
                    to="/issues/$issueId"
                    params={{ issueId: issue.id }}
                    className="civic-card flex flex-col gap-3 p-4 transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge priority={score.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="font-semibold leading-snug">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.category}</p>
                    <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {issue.address ?? "Location pinned"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        {issue.confirmation_count} confirmations
                      </span>
                      <span>Active for {activeDuration(issue.created_at)}</span>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="civic-card p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold">
        {value === null ? <Skeleton className="h-7 w-12" /> : value}
      </dd>
    </div>
  );
}
