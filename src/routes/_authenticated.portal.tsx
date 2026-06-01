import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Investor portal — magellanX" },
      { name: "description", content: "Track your magellanX inquiries and investment status." },
    ],
  }),
  component: PortalPage,
});

const statusLabel: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved — awaiting funding",
  rejected: "Rejected",
  funded: "Funded",
};

const statusTone: Record<string, string> = {
  submitted: "text-muted-foreground",
  under_review: "text-ink",
  approved: "text-gain",
  rejected: "text-loss",
  funded: "text-gain",
};

type Inquiry = {
  id: string;
  opportunity_name: string;
  amount_cents: number;
  status: string;
  payment_status: string;
  contact_phone: string | null;
  message: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
};

const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted", hint: "Inquiry received" },
  { key: "payment_pending", label: "Payment pending", hint: "Awaiting transfer" },
  { key: "confirmed", label: "Confirmed", hint: "Funds received" },
  { key: "invested", label: "Invested", hint: "Capital deployed" },
] as const;

function currentStepIndex(i: Inquiry): number {
  if (i.status === "rejected") return -1;
  if (i.status === "funded" || i.payment_status === "paid") {
    return i.status === "funded" ? 3 : 2;
  }
  if (i.status === "approved") return 1;
  if (i.status === "under_review") return 1;
  return 0;
}

function PortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const inquiries: Inquiry[] = data ?? [];

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inquiries:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investment_inquiries", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inquiries", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const selected = inquiries.find((i) => i.id === selectedId) ?? null;

  const totalCommitted = inquiries
    .filter((i) => i.payment_status === "paid" || i.status === "funded")
    .reduce((sum, i) => sum + Number(i.amount_cents), 0);
  const totalPending = inquiries
    .filter((i) => i.payment_status === "pending" && i.status !== "rejected")
    .reduce((sum, i) => sum + Number(i.amount_cents), 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Investor Portal
            </p>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gain opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gain"></span>
              </span>
              Live
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your positions.</h1>
        </div>
        <Link
          to="/raise"
          className="self-start rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 md:self-auto"
        >
          New inquiry
        </Link>
      </header>

      <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-sm border border-border p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Committed</p>
          <p className="font-display text-3xl font-bold">${(totalCommitted / 100).toLocaleString()}</p>
        </div>
        <div className="rounded-sm border border-border p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="font-display text-3xl font-bold">${(totalPending / 100).toLocaleString()}</p>
        </div>
        <div className="rounded-sm border border-border p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Inquiries</p>
          <p className="font-display text-3xl font-bold">{inquiries.length}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest">Inquiry history</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : inquiries.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <p className="mb-4 text-sm text-muted-foreground">No inquiries yet.</p>
            <Link
              to="/raise"
              className="inline-block rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90"
            >
              Submit your first inquiry
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="border-b border-border pb-3 font-medium">Opportunity</th>
                  <th className="border-b border-border pb-3 font-medium">Amount</th>
                  <th className="border-b border-border pb-3 font-medium">Status</th>
                  <th className="border-b border-border pb-3 font-medium">Payment</th>
                  <th className="border-b border-border pb-3 text-right font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-surface"
                  >
                    <td className="py-4 font-medium">{i.opportunity_name}</td>
                    <td className="py-4 font-display">${(Number(i.amount_cents) / 100).toLocaleString()}</td>
                    <td className={`py-4 ${statusTone[i.status] ?? ""}`}>{statusLabel[i.status] ?? i.status}</td>
                    <td className="py-4 text-muted-foreground">{i.payment_status}</td>
                    <td className="py-4 text-right text-xs text-muted-foreground">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? <DetailDrawer inquiry={selected} onClose={() => setSelectedId(null)} /> : null}
    </main>
  );
}

function DetailDrawer({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const activeIndex = currentStepIndex(inquiry);
  const rejected = inquiry.status === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative ml-auto h-full w-full max-w-lg overflow-y-auto border-l border-border bg-canvas p-8 shadow-2xl"
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Inquiry · {inquiry.id.slice(0, 8)}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight">{inquiry.opportunity_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-border p-4">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Amount</p>
            <p className="font-display text-xl font-bold">
              ${(Number(inquiry.amount_cents) / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-sm border border-border p-4">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Payment</p>
            <p className="font-display text-xl font-bold capitalize">{inquiry.payment_status}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status timeline</p>

          {rejected ? (
            <div className="rounded-sm border border-loss/40 bg-loss/5 p-4">
              <p className="text-sm font-medium text-loss">Inquiry rejected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Our team has reviewed and declined this inquiry. Contact us for details.
              </p>
            </div>
          ) : (
            <ol className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx < activeIndex;
                const active = idx === activeIndex;
                return (
                  <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                    {idx < TIMELINE_STEPS.length - 1 ? (
                      <span
                        className={`absolute left-[7px] top-4 h-full w-px ${
                          done ? "bg-ink" : "bg-border"
                        }`}
                      />
                    ) : null}
                    <span
                      className={`relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-ink bg-ink"
                          : active
                            ? "border-gain bg-canvas"
                            : "border-border bg-canvas"
                      }`}
                    >
                      {active ? (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
                      ) : null}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          done || active ? "text-ink" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.hint}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <dl className="space-y-4 border-t border-border pt-6 text-sm">
          {inquiry.contact_phone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium">{inquiry.contact_phone}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="font-medium">{new Date(inquiry.created_at).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last update</dt>
            <dd className="font-medium">{new Date(inquiry.updated_at).toLocaleString()}</dd>
          </div>
          {inquiry.stripe_session_id ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono text-xs">{inquiry.stripe_session_id.slice(0, 18)}…</dd>
            </div>
          ) : null}
          {inquiry.message ? (
            <div>
              <dt className="mb-2 text-muted-foreground">Message</dt>
              <dd className="rounded-sm border border-border bg-surface p-3 text-xs leading-relaxed">
                {inquiry.message}
              </dd>
            </div>
          ) : null}
        </dl>
      </aside>
    </div>
  );
}
