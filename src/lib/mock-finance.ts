export type AccountKind = "checking" | "savings" | "credit" | "debit" | "investment";

export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  mask: string;
  balance: number; // USD; for credit cards this is current balance owed (negative if credit)
  available?: number;
  limit?: number;
};

export type Transaction = {
  id: string;
  date: string; // ISO
  merchant: string;
  category: string;
  accountId: string;
  amount: number; // negative = expense, positive = income
};

export type CashFlowPoint = { period: string; income: number; expense: number };

export const accounts: Account[] = [
  { id: "a1", name: "Everyday Checking", institution: "Chase", kind: "checking", mask: "4421", balance: 8240.55, available: 8240.55 },
  { id: "a2", name: "High-Yield Savings", institution: "Marcus", kind: "savings", mask: "9087", balance: 42180.12 },
  { id: "a3", name: "Sapphire Reserve", institution: "Chase", kind: "credit", mask: "1108", balance: -2143.78, limit: 20000 },
  { id: "a4", name: "Amex Gold", institution: "American Express", kind: "credit", mask: "2002", balance: -987.4, limit: 15000 },
  { id: "a5", name: "Debit · Checking", institution: "Chase", kind: "debit", mask: "4421", balance: 8240.55 },
  { id: "a6", name: "Brokerage", institution: "Fidelity", kind: "investment", mask: "5530", balance: 184320.0 },
  { id: "a7", name: "Roth IRA", institution: "Vanguard", kind: "investment", mask: "7711", balance: 64210.45 },
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-06-01", merchant: "Whole Foods", category: "Groceries", accountId: "a3", amount: -142.18 },
  { id: "t2", date: "2026-06-01", merchant: "Payroll — Acme Co", category: "Income", accountId: "a1", amount: 5420.0 },
  { id: "t3", date: "2026-05-31", merchant: "Uber", category: "Transport", accountId: "a4", amount: -28.4 },
  { id: "t4", date: "2026-05-30", merchant: "Netflix", category: "Subscriptions", accountId: "a3", amount: -15.99 },
  { id: "t5", date: "2026-05-30", merchant: "Shell", category: "Fuel", accountId: "a5", amount: -62.1 },
  { id: "t6", date: "2026-05-29", merchant: "Delta Airlines", category: "Travel", accountId: "a3", amount: -612.5 },
  { id: "t7", date: "2026-05-28", merchant: "Apple", category: "Shopping", accountId: "a4", amount: -1299.0 },
  { id: "t8", date: "2026-05-27", merchant: "Trader Joe's", category: "Groceries", accountId: "a5", amount: -88.32 },
  { id: "t9", date: "2026-05-26", merchant: "Spotify", category: "Subscriptions", accountId: "a3", amount: -10.99 },
  { id: "t10", date: "2026-05-25", merchant: "Equinox", category: "Health", accountId: "a3", amount: -245.0 },
  { id: "t11", date: "2026-05-24", merchant: "Dividend — VOO", category: "Investment", accountId: "a6", amount: 312.4 },
  { id: "t12", date: "2026-05-22", merchant: "Con Edison", category: "Utilities", accountId: "a1", amount: -178.22 },
];

export const weekly: CashFlowPoint[] = [
  { period: "W-5", income: 1280, expense: 980 },
  { period: "W-4", income: 1420, expense: 1180 },
  { period: "W-3", income: 1380, expense: 1340 },
  { period: "W-2", income: 1510, expense: 1090 },
  { period: "W-1", income: 1620, expense: 1410 },
  { period: "This wk", income: 5420, expense: 2483 },
];

export const monthly: CashFlowPoint[] = [
  { period: "Jan", income: 7820, expense: 5210 },
  { period: "Feb", income: 7820, expense: 4880 },
  { period: "Mar", income: 8240, expense: 6120 },
  { period: "Apr", income: 7820, expense: 5430 },
  { period: "May", income: 8120, expense: 5980 },
  { period: "Jun", income: 5420, expense: 2483 },
];

export const quarterly: CashFlowPoint[] = [
  { period: "Q3 '25", income: 22800, expense: 16420 },
  { period: "Q4 '25", income: 24100, expense: 17880 },
  { period: "Q1 '26", income: 23880, expense: 16210 },
  { period: "Q2 '26", income: 21360, expense: 13893 },
];

export const annual: CashFlowPoint[] = [
  { period: "2022", income: 78200, expense: 54300 },
  { period: "2023", income: 84100, expense: 59600 },
  { period: "2024", income: 91200, expense: 63400 },
  { period: "2025", income: 96400, expense: 68100 },
  { period: "2026 YTD", income: 45240, expense: 30103 },
];

export const categoryBreakdown = [
  { category: "Groceries", value: 612 },
  { category: "Travel", value: 1240 },
  { category: "Subscriptions", value: 86 },
  { category: "Transport", value: 218 },
  { category: "Utilities", value: 312 },
  { category: "Health", value: 245 },
  { category: "Shopping", value: 1480 },
];

export function fmtUSD(n: number, opts: Intl.NumberFormatOptions = {}) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, ...opts });
}

export function fmtUSDCompact(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: "compact" });
}