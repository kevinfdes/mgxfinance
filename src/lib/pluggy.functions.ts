import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLUGGY_API = "https://api.pluggy.ai";

async function getPluggyApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Pluggy credentials not configured");
  }
  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) throw new Error(`Pluggy auth failed: ${res.status}`);
  const json = (await res.json()) as { apiKey: string };
  return json.apiKey;
}

async function pluggyFetch<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${PLUGGY_API}${path}`, {
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Pluggy ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** Mints a short-lived connect token for the Pluggy Connect widget. */
export const createPluggyConnectToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ itemId: z.string().optional() }).optional())
  .handler(async ({ data, context }) => {
    const apiKey = await getPluggyApiKey();
    const body: Record<string, unknown> = {
      clientUserId: context.userId,
      options: { products: ["ACCOUNTS", "TRANSACTIONS", "INVESTMENTS", "CREDIT_CARDS"] },
    };
    if (data?.itemId) body.itemId = data.itemId;
    const res = await fetch(`${PLUGGY_API}/connect_token`, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`connect_token failed: ${res.status}`);
    const json = (await res.json()) as { accessToken: string };
    return { accessToken: json.accessToken };
  });

/** Saves an item after the user completes Pluggy Connect. */
export const savePluggyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ itemId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const apiKey = await getPluggyApiKey();
    const item = await pluggyFetch<{
      id: string;
      status: string;
      executionStatus: string;
      connector: { id: number; name: string; imageUrl?: string };
    }>(apiKey, `/items/${data.itemId}`);

    const { error } = await context.supabase.from("pluggy_items").upsert(
      {
        user_id: context.userId,
        item_id: item.id,
        connector_id: item.connector.id,
        connector_name: item.connector.name,
        connector_image_url: item.connector.imageUrl ?? null,
        status: item.status,
        execution_status: item.executionStatus,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PluggyAccount = {
  id: string;
  itemId: string;
  type: "BANK" | "CREDIT";
  subtype: string;
  name: string;
  marketingName?: string | null;
  number?: string | null;
  balance: number;
  currencyCode: string;
  creditData?: { availableCreditLimit?: number | null; balanceCloseDate?: string | null } | null;
};

export type PluggyTransaction = {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currencyCode: string;
  date: string;
  category?: string | null;
  type: "DEBIT" | "CREDIT";
};

export type PluggyInvestment = {
  id: string;
  itemId: string;
  name: string;
  type: string;
  balance: number;
  currencyCode: string;
};

/** Aggregated dashboard data across all connected items. */
export const getPluggyDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: items, error } = await context.supabase
      .from("pluggy_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!items || items.length === 0) {
      return { items: [], accounts: [], transactions: [], investments: [] };
    }

    const apiKey = await getPluggyApiKey();

    const results = await Promise.all(
      items.map(async (it) => {
        const [accounts, investments] = await Promise.all([
          pluggyFetch<{ results: PluggyAccount[] }>(apiKey, `/accounts?itemId=${it.item_id}`).catch(() => ({ results: [] })),
          pluggyFetch<{ results: PluggyInvestment[] }>(apiKey, `/investments?itemId=${it.item_id}`).catch(() => ({ results: [] })),
        ]);
        return { accounts: accounts.results, investments: investments.results };
      }),
    );

    const accounts = results.flatMap((r) => r.accounts);
    const investments = results.flatMap((r) => r.investments);

    const txResults = await Promise.all(
      accounts.slice(0, 10).map((a) =>
        pluggyFetch<{ results: PluggyTransaction[] }>(
          apiKey,
          `/transactions?accountId=${a.id}&pageSize=25`,
        ).catch(() => ({ results: [] })),
      ),
    );
    const transactions = txResults
      .flatMap((r) => r.results)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 50);

    return { items, accounts, transactions, investments };
  });

/** Removes a linked item both in Pluggy and in our DB. */
export const deletePluggyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ itemId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const apiKey = await getPluggyApiKey();
    await fetch(`${PLUGGY_API}/items/${data.itemId}`, {
      method: "DELETE",
      headers: { "X-API-KEY": apiKey },
    }).catch(() => undefined);
    const { error } = await context.supabase
      .from("pluggy_items")
      .delete()
      .eq("item_id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });