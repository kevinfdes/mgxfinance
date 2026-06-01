import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/raise")({
  head: () => ({
    meta: [
      { title: "Submit an inquiry — magellanX" },
      { name: "description", content: "Submit a fundraising inquiry to the magellanX desk." },
    ],
  }),
  component: RaisePage,
});

const OPPORTUNITIES = [
  "Aether Bio Labs",
  "Vertical Timber II",
  "Solara Energy",
  "MGX Alpha Fund",
  "Other / Custom",
];

const schema = z.object({
  opportunity_name: z.string().trim().min(1).max(120),
  amount: z.number().positive().min(1000, "Minimum $1,000").max(50_000_000),
  contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function RaisePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [opportunity, setOpportunity] = useState(OPPORTUNITIES[0]);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      opportunity_name: opportunity,
      amount: Number(amount),
      contact_phone: phone,
      message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("investment_inquiries").insert({
      user_id: user.id,
      opportunity_name: parsed.data.opportunity_name,
      amount_cents: Math.round(parsed.data.amount * 100),
      contact_phone: parsed.data.contact_phone || null,
      message: parsed.data.message || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Inquiry submitted. Our desk will be in touch.");
    queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    navigate({ to: "/portal" });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Fundraising / Inquiry
        </p>
        <h1 className="mb-3 font-display text-3xl font-bold tracking-tight">
          Submit an investment inquiry.
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us the opportunity, the amount you'd like to allocate, and how to reach you. We confirm allocation
          before any capital is collected.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Opportunity
          </label>
          <select
            value={opportunity}
            onChange={(e) => setOpportunity(e.target.value)}
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          >
            {OPPORTUNITIES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Amount (USD)
          </label>
          <input
            type="number"
            min={1000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25000"
            required
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 font-display text-lg outline-none focus:border-ink"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Minimum $1,000. Whole dollars.</p>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Contact phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Notes (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Structure preferences, timeline, vehicle, etc."
            className="w-full resize-none rounded-sm border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit inquiry"}
          </button>
          <p className="text-xs text-muted-foreground">
            You'll be invited to fund after review.
          </p>
        </div>
      </form>
    </main>
  );
}
