import { Link } from "@tanstack/react-router";
import { Bell, HelpCircle, LogOut, Menu, Search, Settings, Shield, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Invest", to: "/" as const, hash: "invest" },
  { label: "Raise", to: "/raise" as const },
  { label: "Portfolio", to: "/portal" as const },
];

export function SiteHeader() {
  const { user } = useAuth();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          magellan<span className="font-medium text-muted-foreground">X</span>
        </Link>
        <div className="hidden gap-6 text-sm font-medium md:flex">
          {navLinks.map((l) =>
            l.hash ? (
              <a key={l.label} href={`#${l.hash}`} className="transition-colors hover:text-muted-foreground">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.to} className="transition-colors hover:text-muted-foreground">
                {l.label}
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Desktop: discrete icon cluster */}
      <div className="hidden items-center gap-1 md:flex">
        <Button variant="ghost" size="icon" aria-label="Search" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gain" />
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {user?.email ?? "Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/portal" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/mfa" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Security & 2FA
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="#" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Help & Support
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-loss focus:text-loss">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/auth" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Sign in
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: hamburger sheet */}
      <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-display text-left">
                magellan<span className="font-medium text-muted-foreground">X</span>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Navigate</p>
                {navLinks.map((l) =>
                  l.hash ? (
                    <a
                      key={l.label}
                      href={`#${l.hash}`}
                      className="block rounded-sm px-2 py-2 text-sm font-medium hover:bg-surface"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      to={l.to}
                      className="block rounded-sm px-2 py-2 text-sm font-medium hover:bg-surface"
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>

              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settings</p>
                <button className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <Search className="h-4 w-4" /> Search
                </button>
                <button className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <Bell className="h-4 w-4" /> Notifications
                </button>
                <Link to="/portal" className="flex items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <UserIcon className="h-4 w-4" /> Profile
                </Link>
                <Link to="/mfa" className="flex items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <Shield className="h-4 w-4" /> Security & 2FA
                </Link>
                <a href="#" className="flex items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <HelpCircle className="h-4 w-4" /> Help & Support
                </a>
              </div>

              <div className="border-t border-border pt-4">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm text-loss hover:bg-surface"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="block w-full rounded-sm bg-ink px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-canvas"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}