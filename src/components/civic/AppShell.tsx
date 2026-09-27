import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Megaphone, Radio } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };

function navItems(role: string | null): NavItem[] {
  if (role === "ADMIN") {
    return [
      { to: "/admin", label: "Command center" },
      { to: "/my-issues", label: "My reports" },
    ];
  }
  if (role === "FIELD_WORKER") {
    return [
      { to: "/worker", label: "My tasks" },
      { to: "/my-issues", label: "My reports" },
    ];
  }
  return [
    { to: "/report", label: "Report issue" },
    { to: "/my-issues", label: "My issues" },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, session } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold leading-none">
              CivicPulse
              <span className="ml-2 hidden align-middle text-xs font-normal text-muted-foreground sm:inline">
                report to verified resolution
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:ml-6 sm:w-auto">
            {session
              ? navItems(role).map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    )}
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {session ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight">{profile?.name ?? "Signed in"}</p>
                  <p className="text-xs text-muted-foreground">{role ?? "CITIZEN"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ mode: "register" }}>
                    <Megaphone className="size-4" aria-hidden />
                    Report an issue
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export { homeForRole };
