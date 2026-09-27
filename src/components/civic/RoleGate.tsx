import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppShell } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, homeForRole } from "@/hooks/useAuth";
import type { AppRole } from "@/lib/civic";

/**
 * UI-level role gate. Row Level Security in the database is the real
 * enforcement; this only avoids showing a dashboard a user cannot use.
 */
export function RoleGate({ allow, children }: { allow: AppRole; children: ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (role !== allow) {
    return (
      <AppShell>
        <div className="civic-card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold">This area isn't available to your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {allow === "ADMIN"
              ? "Only municipal administrators can open the command center."
              : "Only field workers can open the task dashboard."}
          </p>
          <Button asChild className="mt-4">
            <Link to={homeForRole(role)}>Go to my dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
}
