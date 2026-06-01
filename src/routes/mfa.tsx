import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/mfa")({
  head: () => ({
    meta: [
      { title: "Two-factor authentication — magellanX" },
      { name: "description", content: "Verify your authenticator app to continue." },
    ],
  }),
  component: MfaPage,
});

type Mode = "loading" | "enroll" | "challenge";

function MfaPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session]);

  async function init() {
    try {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data?.currentLevel === "aal2") {
        navigate({ to: "/portal", replace: true });
        return;
      }
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setMode("challenge");
        return;
      }
      // Clean up any unverified factors before enrolling a new one
      for (const f of factors?.totp ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" });
      if (enrolled.error) throw enrolled.error;
      setFactorId(enrolled.data.id);
      setQrCode(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
      setMode("enroll");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not initialise 2FA");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    const trimmed = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      toast.error("Enter the 6-digit code from your authenticator");
      return;
    }
    setBusy(true);
    try {
      const ch = await supabase.auth.mfa.challenge({ factorId });
      if (ch.error) throw ch.error;
      const v = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: trimmed });
      if (v.error) throw v.error;
      toast.success("Verified.");
      navigate({ to: "/portal", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          magellan<span className="font-medium text-muted-foreground">X</span>
        </Link>
        <button onClick={handleSignOut} className="text-xs text-muted-foreground underline">
          Sign out
        </button>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        {mode === "loading" && <p className="text-sm text-muted-foreground">Preparing 2FA…</p>}

        {mode === "enroll" && (
          <>
            <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Set up 2FA.</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>, then enter the 6-digit code.
            </p>
            {qrCode && (
              <div className="mb-4 flex justify-center rounded-sm border border-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="2FA QR code" className="h-48 w-48" />
              </div>
            )}
            {secret && (
              <p className="mb-6 break-all text-center text-[11px] text-muted-foreground">
                Can&rsquo;t scan? Enter this key manually:
                <br />
                <code className="text-ink">{secret}</code>
              </p>
            )}
            <VerifyForm code={code} setCode={setCode} busy={busy} onSubmit={handleVerify} label="Verify and enable" />
          </>
        )}

        {mode === "challenge" && (
          <>
            <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Two-factor code.</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter the 6-digit code from your Google or Microsoft Authenticator app.
            </p>
            <VerifyForm code={code} setCode={setCode} busy={busy} onSubmit={handleVerify} label="Verify" />
          </>
        )}
      </main>
    </div>
  );
}

function VerifyForm({
  code,
  setCode,
  busy,
  onSubmit,
  label,
}: {
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
  label: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-ink"
        maxLength={7}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Verifying…" : label}
      </button>
    </form>
  );
}