import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/request-access")({
  head: () => ({
    meta: [
      { title: "Request access — magellanX" },
      { name: "description", content: "Apply for an investor account. All accounts are reviewed and approved manually." },
    ],
  }),
  component: RequestAccessPage,
});

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  reason: z.string().trim().min(10, "Tell us a little more").max(2000),
});

function RequestAccessPage() {
  const [form, setForm] = useState({ full_name: "", email: "", company: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("access_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        reason: parsed.data.reason,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit request");
    } finally {
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
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Request access.</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Accounts are created manually after review. We&rsquo;ll contact you at the email you provide.
        </p>

        {submitted ? (
          <div className="rounded-sm border border-border bg-surface p-6 text-sm">
            <p className="font-medium">Request submitted.</p>
            <p className="mt-2 text-muted-foreground">
              Thank you. Our team will review your request and reach out shortly.
            </p>
            <Link to="/" className="mt-4 inline-block text-xs underline">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required maxLength={100} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required maxLength={255} />
            <Field label="Company (optional)" value={form.company} onChange={(v) => setForm({ ...form, company: v })} maxLength={200} />
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Why are you requesting access?
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="min-h-[120px] w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
                required
                minLength={10}
                maxLength={2000}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </form>
        )}

        <Link to="/auth" className="mt-6 text-xs text-muted-foreground underline">
          Already approved? Sign in
        </Link>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        required={required}
        maxLength={maxLength}
      />
    </div>
  );
}