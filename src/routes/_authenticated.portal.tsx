import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

function PortalPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const inquiries = data ?? [];
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
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Investor Portal
          </p>
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
                  <tr key={i.id} className="border-b border-border">
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
    </main>
  );
}
