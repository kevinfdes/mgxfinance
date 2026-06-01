import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [aalChecked, setAalChecked] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (loading || !session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (error) {
        setAalChecked(true);
        return;
      }
      // Require aal2 (verified TOTP) for every authenticated route.
      if (data?.nextLevel === "aal2" && data?.currentLevel !== "aal2") {
        navigate({ to: "/mfa", replace: true });
        return;
      }
      // No factor enrolled yet → force enrollment.
      if (data?.nextLevel !== "aal2") {
        navigate({ to: "/mfa", replace: true });
        return;
      }
      setAalChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, session, navigate]);

  if (loading || !session || !aalChecked) {
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
