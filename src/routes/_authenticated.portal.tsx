import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  accounts,
  transactions,
  weekly,
  monthly,
  quarterly,
  annual,
  categoryBreakdown,
  fmtUSD,
  fmtUSDCompact,
  type CashFlowPoint,
} from "@/lib/mock-finance";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Dashboard — Personal Finance" },
      {
        name: "description",
        content: "View-only dashboard of your bank, card, and investment accounts.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const cash = useMemo(
    () =>
      accounts
        .filter((a) => a.kind === "checking" || a.kind === "savings")
        .reduce((s, a) => s + a.balance, 0),
    [],
  );
  const credit = useMemo(
    () => accounts.filter((a) => a.kind === "credit").reduce((s, a) => s + a.balance, 0),
    [],
  );
  const investments = useMemo(
    () => accounts.filter((a) => a.kind === "investment").reduce((s, a) => s + a.balance, 0),
    [],
  );
  const netWorth = cash + credit + investments;

  const monthIncome = monthly[monthly.length - 1].income;
  const monthExpense = monthly[monthly.length - 1].expense;
  const monthNet = monthIncome - monthExpense;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      {/* Hero */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> View-only access
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Good morning.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Snapshot across your bank, card and investment accounts.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Net worth</p>
            <p className="font-display text-2xl font-bold tracking-tight">{fmtUSD(netWorth)}</p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Cash on hand"
          value={fmtUSD(cash)}
          delta="+2.1%"
          positive
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Credit owed"
          value={fmtUSD(Math.abs(credit))}
          delta="-4.6%"
          positive
          icon={<CreditCard className="h-4 w-4" />}
        />
        <KpiCard
          label="Investments"
          value={fmtUSD(investments)}
          delta="+5.8%"
          positive
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <KpiCard
          label="Net this month"
          value={fmtUSD(monthNet)}
          delta={`${((monthNet / monthIncome) * 100).toFixed(0)}% saved`}
          positive={monthNet >= 0}
          icon={monthNet >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        />
      </section>

      {/* Cash flow */}
      <section id="cashflow" className="scroll-mt-20">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-display text-xl">Cash flow</CardTitle>
              <CardDescription>Income vs. expenses across timeframes</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="annual">Annual</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly"><CashFlowChart data={weekly} /></TabsContent>
              <TabsContent value="monthly"><CashFlowChart data={monthly} /></TabsContent>
              <TabsContent value="quarterly"><CashFlowChart data={quarterly} /></TabsContent>
              <TabsContent value="annual"><CashFlowChart data={annual} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Accounts */}
        <div id="accounts" className="scroll-mt-20 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Bank accounts</CardTitle>
              <CardDescription>Checking, savings & debit · read-only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts
                .filter((a) => a.kind === "checking" || a.kind === "savings" || a.kind === "debit")
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.institution} · ••{a.mask}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-semibold">{fmtUSD(a.balance)}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase">
                        {a.kind}
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Spending breakdown */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Spending mix</CardTitle>
              <CardDescription>This month, by category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cards */}
      <section id="cards" className="scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Credit & debit cards</CardTitle>
            <CardDescription>Balances and utilization</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {accounts
              .filter((a) => a.kind === "credit")
              .map((a) => {
                const util = a.limit ? (Math.abs(a.balance) / a.limit) * 100 : 0;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider opacity-80">
                          {a.institution}
                        </p>
                        <p className="font-display text-lg font-semibold">{a.name}</p>
                      </div>
                      <CreditCard className="h-5 w-5 opacity-90" />
                    </div>
                    <p className="mt-6 font-mono text-sm tracking-widest opacity-90">
                      •••• •••• •••• {a.mask}
                    </p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Owed</p>
                        <p className="font-display text-xl font-bold">
                          {fmtUSD(Math.abs(a.balance))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Limit</p>
                        <p className="text-sm font-medium">{fmtUSDCompact(a.limit ?? 0)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                        <div
                          className="h-full bg-primary-foreground"
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] uppercase tracking-wider opacity-70">
                        {util.toFixed(0)}% utilization
                      </p>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </section>

      {/* Investments */}
      <section id="investments" className="scroll-mt-20">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-display text-xl">Investment accounts</CardTitle>
              <CardDescription>Brokerage & retirement balances</CardDescription>
            </div>
            <p className="font-display text-xl font-bold">{fmtUSD(investments)}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts
              .filter((a) => a.kind === "investment")
              .map((a) => {
                const share = (a.balance / investments) * 100;
                return (
                  <div key={a.id} className="rounded-lg border border-border bg-surface/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.institution} · ••{a.mask}
                        </p>
                      </div>
                      <p className="font-display text-base font-semibold">{fmtUSD(a.balance)}</p>
                    </div>
                    <Progress value={share} className="mt-3 h-1.5" />
                    <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {share.toFixed(0)}% of portfolio
                    </p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </section>

      {/* Transactions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent transactions</CardTitle>
            <CardDescription>Across all linked accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const acct = accounts.find((a) => a.id === t.accountId);
                  const isIncome = t.amount > 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{t.merchant}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {acct?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-display font-semibold ${
                            isIncome ? "text-gain" : "text-ink"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {fmtUSD(Math.abs(t.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
        </div>
        <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
        <p className={`mt-1 text-xs ${positive ? "text-gain" : "text-loss"}`}>{delta}</p>
      </CardContent>
    </Card>
  );
}

function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  const [hover, setHover] = useState<CashFlowPoint | null>(null);
  const point = hover ?? data[data.length - 1];
  const net = point.income - point.expense;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-6">
        <Stat label="Income" value={fmtUSD(point.income)} color="text-gain" />
        <Stat label="Expense" value={fmtUSD(point.expense)} color="text-loss" />
        <Stat label="Net" value={fmtUSD(net)} color={net >= 0 ? "text-gain" : "text-loss"} />
        <Stat label="Period" value={point.period} color="text-ink" />
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            onMouseMove={(s) => {
              const p = s?.activePayload?.[0]?.payload as CashFlowPoint | undefined;
              if (p) setHover(p);
            }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gain)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--gain)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--loss)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--loss)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtUSDCompact(Number(v))} />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(v: number) => fmtUSD(Number(v))}
            />
            <Area type="monotone" dataKey="income" stroke="var(--gain)" strokeWidth={2} fill="url(#inc)" />
            <Area type="monotone" dataKey="expense" stroke="var(--loss)" strokeWidth={2} fill="url(#exp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtUSDCompact(Number(v))} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(v: number, name) => [fmtUSD(Number(v)), name === "net" ? "Net" : String(name)]}
            />
            <Bar dataKey={(d: CashFlowPoint) => d.income - d.expense} name="net" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.income - d.expense >= 0 ? "var(--gain)" : "var(--loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--muted-foreground)",
];

function CategoryChart() {
  const total = categoryBreakdown.reduce((s, c) => s + c.value, 0);
  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryBreakdown}
              dataKey="value"
              nameKey="category"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="var(--card)"
            >
              {categoryBreakdown.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(v: number) => fmtUSD(Number(v))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1.5">
        {categoryBreakdown.map((c, i) => (
          <li key={c.category} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-muted-foreground">{c.category}</span>
            </span>
            <span className="font-medium">
              {fmtUSD(c.value)}
              <span className="ml-2 text-muted-foreground">
                {((c.value / total) * 100).toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
