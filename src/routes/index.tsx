import { createFileRoute } from "@tanstack/react-router";
import opportunityBio from "@/assets/opportunity-bio.jpg";
import opportunityTimber from "@/assets/opportunity-timber.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "magellanX — Precision Capital Management" },
      { name: "description", content: "magellanX (mgx) is a pragmatic interface for raising funds, investing, and tracking your personal portfolio." },
      { property: "og:title", content: "magellanX — Precision Capital Management" },
      { property: "og:description", content: "Raise, invest, and track your portfolio with quiet precision." },
    ],
  }),
  component: Index,
});

type Opportunity = {
  title: string;
  category: string;
  description: string;
  raised: string;
  goal: string;
  progress: number;
  image: string;
};

const opportunities: Opportunity[] = [
  {
    title: "Aether Bio Labs",
    category: "Venture Series A • Biotech",
    description: "Developing next-gen enzyme inhibitors for rare pulmonary conditions.",
    raised: "$450k",
    goal: "$2M",
    progress: 22.5,
    image: opportunityBio,
  },
  {
    title: "Vertical Timber II",
    category: "Private Debt • Real Estate",
    description: "Carbon-negative residential development in northern Stockholm.",
    raised: "$1.1M",
    goal: "$5M",
    progress: 22,
    image: opportunityTimber,
  },
];

const holdings = [
  { name: "Solara Energy", kind: "Equity • Series B", change: "+18.4%", value: "$142,000", positive: true, highlight: true },
  { name: "MGX Alpha Fund", kind: "Internal Treasury", change: "+2.1%", value: "$880,500", positive: true, highlight: false },
  { name: "Lunar Logistics", kind: "Debt • Convertible", change: "-4.2%", value: "$45,000", positive: false, highlight: false },
];

function Index() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink selection:bg-ink selection:text-canvas">
      <nav className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-display text-xl font-bold tracking-tight">
            magellan<span className="font-medium text-muted-foreground">X</span>
          </span>
          <div className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#invest" className="transition-colors hover:text-muted-foreground">Invest</a>
            <a href="#raise" className="transition-colors hover:text-muted-foreground">Raise</a>
            <a href="#portfolio" className="transition-colors hover:text-muted-foreground">Portfolio</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-bold">
            JD
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">
              Precision Capital Management.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              The pragmatic interface for private equity, personal treasury, and strategic fundraising.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:opacity-90">
              New Opportunity
            </button>
            <button className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface">
              Export Data
            </button>
          </div>
        </header>

        <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { label: "Net Liquidity", value: "$1,248,400.00", note: "+12.4% vs last quarter", tone: "gain" as const },
            { label: "Active Investments", value: "14", note: "3 pending clearance", tone: "muted" as const },
            { label: "Unrealized P/L", value: "$214,090", note: "+4.2% yield", tone: "gain" as const },
          ].map((m) => (
            <div key={m.label} className="rounded-sm border border-border p-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="font-display text-3xl font-bold">{m.value}</p>
              <p className={`mt-4 text-xs font-medium ${m.tone === "gain" ? "text-gain" : "text-muted-foreground"}`}>
                {m.note}
              </p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <section id="invest" className="space-y-8 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest">Active Opportunities</h2>
              <a href="#" className="text-xs text-muted-foreground underline">View all</a>
            </div>

            {opportunities.map((o) => (
              <article key={o.title} className="group cursor-pointer">
                <div className="mb-6 aspect-[21/9] w-full overflow-hidden rounded-sm bg-surface outline outline-1 -outline-offset-1 outline-black/5">
                  <img
                    src={o.image}
                    alt={o.title}
                    loading="lazy"
                    width={1280}
                    height={640}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      {o.category}
                    </p>
                    <h3 className="mb-1 font-display text-xl font-bold">{o.title}</h3>
                    <p className="max-w-md text-sm text-muted-foreground">{o.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold">{o.raised}</p>
                    <p className="text-[10px] uppercase tracking-tight text-muted-foreground">
                      Raised of {o.goal}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface">
                  <div className="h-full bg-ink" style={{ width: `${o.progress}%` }} />
                </div>
              </article>
            ))}
          </section>

          <aside id="portfolio" className="space-y-8">
            <div>
              <h2 className="mb-6 text-sm font-bold uppercase tracking-widest">Top Assets</h2>
              <div className="space-y-1">
                {holdings.map((h) => (
                  <div
                    key={h.name}
                    className={`flex items-center justify-between rounded-sm p-3 transition-colors ${
                      h.highlight ? "bg-surface" : "hover:bg-surface"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground">{h.kind}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-sm font-bold ${h.positive ? "text-gain" : "text-loss"}`}>
                        {h.change}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-6 text-sm font-bold uppercase tracking-widest">Allocation</h2>
              <div className="flex aspect-square w-full items-center justify-center border border-border p-8">
                <div className="relative h-full w-full rounded-full border-[16px] border-surface">
                  <div className="absolute inset-0 rotate-45 rounded-full border-[16px] border-ink border-r-transparent border-t-transparent border-l-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground">Equity</span>
                    <span className="font-display text-lg font-bold">62%</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="raise" className="rounded-sm bg-ink p-6 text-canvas">
              <h3 className="mb-2 text-sm font-bold">Ready to raise?</h3>
              <p className="mb-4 text-xs leading-relaxed text-canvas/60">
                Start your own fund or raise capital for your venture using mgx infrastructure.
              </p>
              <button className="w-full bg-canvas py-2 text-xs font-bold uppercase tracking-wider text-ink">
                Initialize Portal
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-24 border-t border-border px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 opacity-60 md:flex-row">
          <div className="font-display text-lg font-bold tracking-tighter">mgx</div>
          <div className="grid grid-cols-2 gap-12 text-[10px] font-bold uppercase tracking-widest md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground">Network</span>
              <a href="#">Partners</a>
              <a href="#">Nodes</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground">Legal</span>
              <a href="#">Privacy</a>
              <a href="#">Compliance</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground">Connect</span>
              <a href="#">Terminal</a>
              <a href="#">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
