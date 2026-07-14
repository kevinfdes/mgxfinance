import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PluggyConnect } from "react-pluggy-connect";
import { toast } from "sonner";
import { Landmark, Plus, RefreshCw, Trash2, Wallet, CreditCard, LineChart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createPluggyConnectToken,
  savePluggyItem,
  getPluggyDashboard,
  deletePluggyItem,
} from "@/lib/pluggy.functions";

export const Route = createFileRoute("/_authenticated/open-finance")({
  head: () => ({
    meta: [
      { title: "Open Finance — magellanX" },
      {
        name: "description",
        content:
          "Conecte suas contas bancárias, cartões e investimentos via Open Finance Brasil.",
      },
    ],
  }),
  component: OpenFinancePage,
});

type Lang = "pt" | "en";

const t = {
  pt: {
    title: "Open Finance Brasil",
    subtitle: "Visualize contas, cartões e investimentos em um único painel — somente leitura.",
    connect: "Conectar banco",
    refresh: "Atualizar",
    empty: "Nenhuma instituição conectada ainda.",
    emptyCta: "Conecte seu primeiro banco via Pluggy para ver seus dados aqui.",
    netWorth: "Patrimônio total",
    cash: "Contas correntes",
    credit: "Cartões de crédito",
    invest: "Investimentos",
    connections: "Conexões",
    accounts: "Contas",
    txs: "Transações recentes",
    date: "Data",
    desc: "Descrição",
    cat: "Categoria",
    amt: "Valor",
    remove: "Remover",
    loading: "Carregando dados...",
    connecting: "Preparando conexão segura...",
    saved: "Instituição conectada",
    removed: "Conexão removida",
    error: "Ocorreu um erro",
  },
  en: {
    title: "Open Finance Brasil",
    subtitle: "See accounts, cards and investments in a single view — read-only.",
    connect: "Connect bank",
    refresh: "Refresh",
    empty: "No institutions connected yet.",
    emptyCta: "Connect your first bank via Pluggy to see your data here.",
    netWorth: "Net worth",
    cash: "Bank accounts",
    credit: "Credit cards",
    invest: "Investments",
    connections: "Connections",
    accounts: "Accounts",
    txs: "Recent transactions",
    date: "Date",
    desc: "Description",
    cat: "Category",
    amt: "Amount",
    remove: "Remove",
    loading: "Loading data...",
    connecting: "Preparing secure connection...",
    saved: "Institution connected",
    removed: "Connection removed",
    error: "Something went wrong",
  },
} as const;

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function OpenFinancePage() {
  const [lang, setLang] = useState<Lang>("pt");
  const L = t[lang];
  const qc = useQueryClient();

  const createToken = useServerFn(createPluggyConnectToken);
  const saveItem = useServerFn(savePluggyItem);
  const dashFn = useServerFn(getPluggyDashboard);
  const deleteItem = useServerFn(deletePluggyItem);

  const [connectToken, setConnectToken] = useState<string | null>(null);

  const dash = useQuery({
    queryKey: ["pluggy-dashboard"],
    queryFn: () => dashFn({ data: undefined }),
  });

  const startConnect = useMutation({
    mutationFn: () => createToken({ data: undefined }),
    onSuccess: (res) => setConnectToken(res.accessToken),
    onError: (e: Error) => toast.error(L.error, { description: e.message }),
  });

  const onPluggySuccess = async (payload: { item: { id: string } }) => {
    try {
      await saveItem({ data: { itemId: payload.item.id } });
      toast.success(L.saved);
      setConnectToken(null);
      qc.invalidateQueries({ queryKey: ["pluggy-dashboard"] });
    } catch (e) {
      toast.error(L.error, { description: (e as Error).message });
    }
  };

  const removeItem = useMutation({
    mutationFn: (itemId: string) => deleteItem({ data: { itemId } }),
    onSuccess: () => {
      toast.success(L.removed);
      qc.invalidateQueries({ queryKey: ["pluggy-dashboard"] });
    },
    onError: (e: Error) => toast.error(L.error, { description: e.message }),
  });

  const data = dash.data;
  const bankAccounts = useMemo(() => data?.accounts.filter((a) => a.type === "BANK") ?? [], [data]);
  const creditCards = useMemo(() => data?.accounts.filter((a) => a.type === "CREDIT") ?? [], [data]);

  const totals = useMemo(() => {
    const cash = bankAccounts.reduce((s, a) => s + (a.balance ?? 0), 0);
    const credit = creditCards.reduce((s, a) => s + (a.balance ?? 0), 0);
    const invest = (data?.investments ?? []).reduce((s, i) => s + (i.balance ?? 0), 0);
    return { cash, credit, invest, net: cash - credit + invest };
  }, [bankAccounts, creditCards, data]);

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> Open Finance · Pluggy
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {L.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded px-2.5 py-1 uppercase tracking-wider ${
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["pluggy-dashboard"] })}
            disabled={dash.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${dash.isFetching ? "animate-spin" : ""}`} />
            {L.refresh}
          </Button>
          <Button size="sm" onClick={() => startConnect.mutate()} disabled={startConnect.isPending}>
            <Plus className="h-4 w-4" />
            {startConnect.isPending ? L.connecting : L.connect}
          </Button>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={L.netWorth} value={fmtBRL(totals.net)} icon={<Landmark className="h-4 w-4" />} />
        <Kpi label={L.cash} value={fmtBRL(totals.cash)} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label={L.credit} value={fmtBRL(totals.credit)} icon={<CreditCard className="h-4 w-4" />} />
        <Kpi label={L.invest} value={fmtBRL(totals.invest)} icon={<LineChart className="h-4 w-4" />} />
      </section>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">{L.connections}</CardTitle>
          <CardDescription>{L.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {dash.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{L.loading}</p>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium">{L.empty}</p>
              <p className="mt-1 text-xs text-muted-foreground">{L.emptyCta}</p>
              <Button
                className="mt-4"
                onClick={() => startConnect.mutate()}
                disabled={startConnect.isPending}
              >
                <Plus className="h-4 w-4" /> {L.connect}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {it.connector_image_url ? (
                      <img src={it.connector_image_url} alt="" className="h-9 w-9 rounded-md object-contain bg-white p-1" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Landmark className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{it.connector_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{it.status}</Badge>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem.mutate(it.item_id)}
                    aria-label={L.remove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts */}
      {(bankAccounts.length > 0 || creditCards.length > 0) && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">{L.cash}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bankAccounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{a.marketingName ?? a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.subtype}{a.number ? ` · ${a.number}` : ""}</p>
                  </div>
                  <p className="font-display text-base font-semibold">{fmtBRL(a.balance)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">{L.credit}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {creditCards.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{a.marketingName ?? a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.subtype}</p>
                  </div>
                  <p className="font-display text-base font-semibold text-loss">{fmtBRL(a.balance)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Investments */}
      {data && data.investments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">{L.invest}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.investments.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.type}</p>
                </div>
                <p className="font-display text-base font-semibold">{fmtBRL(i.balance)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      {data && data.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">{L.txs}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L.date}</TableHead>
                  <TableHead>{L.desc}</TableHead>
                  <TableHead>{L.cat}</TableHead>
                  <TableHead className="text-right">{L.amt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
                        month: "short", day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="outline" className="text-[10px]">{tx.category}</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className={`text-right font-display font-semibold ${tx.amount >= 0 ? "text-gain" : "text-loss"}`}>
                      {fmtBRL(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={onPluggySuccess}
          onError={(err) => {
            toast.error(L.error, { description: err?.message });
          }}
          onClose={() => setConnectToken(null)}
        />
      )}
    </main>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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
      </CardContent>
    </Card>
  );
}