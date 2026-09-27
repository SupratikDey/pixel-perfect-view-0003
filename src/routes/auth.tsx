import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { homeForRole, useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "register" ? ("register" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CivicPulse" },
      {
        name: "description",
        content: "Sign in or create a CivicPulse account to report and follow neighbourhood civic issues.",
      },
      { property: "og:title", content: "Sign in — CivicPulse" },
      {
        property: "og:description",
        content: "Sign in or create a CivicPulse account to report neighbourhood civic issues.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, role, refresh, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: homeForRole(role), replace: true });
    }
  }, [loading, session, role, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (tab === "register" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (tab === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        const userId = data.user?.id;
        if (!userId) throw new Error("Account created, but no session was returned. Please sign in.");

        const profile = await supabase
          .from("profiles")
          .upsert({ id: userId, name: name.trim(), email: email.trim() });
        if (profile.error) throw profile.error;

        const roleRow = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "CITIZEN" });
        if (roleRow.error && !roleRow.error.message.includes("duplicate")) throw roleRow.error;

        await refresh();
        toast.success("Welcome to CivicPulse");
        navigate({ to: "/report" });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      await refresh();
      const { data } = await supabase.auth.getUser();
      const roleRows = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user?.id ?? "");
      const roles = (roleRows.data ?? []).map((r) => r.role);
      const nextRole = roles.includes("ADMIN")
        ? "ADMIN"
        : roles.includes("FIELD_WORKER")
          ? "FIELD_WORKER"
          : "CITIZEN";
      toast.success("Signed in");
      navigate({ to: homeForRole(nextRole) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(
        message.includes("Invalid login credentials")
          ? "That email and password combination doesn't match an account."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <div className="civic-card p-6">
          <h1 className="text-2xl font-semibold">
            {tab === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            New accounts join as citizens. Field worker and admin access is granted by the municipal
            authority.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="mt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {tab === "register" ? (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === "register" ? "new-password" : "current-password"}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {tab === "register" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Demo accounts (password CivicPulse#2026)</p>
            <p>citizen@civicpulse.demo — citizen</p>
            <p>worker.rahul@civicpulse.demo — field worker</p>
            <p>admin@civicpulse.demo — admin</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
