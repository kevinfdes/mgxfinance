import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted-foreground">
        Loading portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <nav className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl font-bold tracking-tight">
            magellan<span className="font-medium text-muted-foreground">X</span>
          </Link>
          <div className="hidden gap-6 text-sm font-medium md:flex">
            <Link to="/portal" className="transition-colors hover:text-muted-foreground" activeProps={{ className: "underline" }}>
              Portal
            </Link>
            <Link to="/raise" className="transition-colors hover:text-muted-foreground" activeProps={{ className: "underline" }}>
              Raise
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
