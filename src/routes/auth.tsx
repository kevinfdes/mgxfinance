import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — magellanX" },
      { name: "description", content: "Sign in to the magellanX investor portal. Accounts are by approval only." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/portal", replace: true });
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      toast.success("Signed in. Verify your authenticator next.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/portal`,
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="border-b border-border px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          magellan<span className="font-medium text-muted-foreground">X</span>
        </Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Sign in.</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Access is by approval only. Sign in with an approved account, or request access below.
        </p>

        <div className="mb-4 space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={busy}
            className="w-full rounded-sm border border-border bg-canvas px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={busy}
            className="w-full rounded-sm border border-border bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Continue with Apple
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
              required
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
              required
              minLength={8}
              maxLength={72}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground">
          Two-factor authentication is required. Use Google Authenticator or Microsoft Authenticator.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link to="/request-access" className="underline">
            Request access
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
