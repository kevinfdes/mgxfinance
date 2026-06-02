import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-canvas font-sans text-ink">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-canvas/80 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden text-xs text-muted-foreground md:inline">
                Personal · view-only
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="hidden text-xs text-muted-foreground md:inline">
                {session.user.email}
              </span>
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
