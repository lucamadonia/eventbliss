// Shared types for the Expenses v2 module. Mirrors the DB shapes from
// supabase/migrations/20260420000000_expenses_v2_schema.sql.

export type ExpenseCreatedVia = "manual" | "camera" | "voice" | "import" | "template";
export type DisputeStatus = "none" | "disputed" | "resolved";
export type SplitType = "equal" | "custom" | "percentage";
export type SettlementMethod =
  | "cash" | "bank" | "paypal" | "revolut" | "wise" | "apple_pay" | "google_pay" | "other";
export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface ExpensePayer {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
}

export interface ExpenseShare {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  paid_amount: number;
  is_paid: boolean; // legacy — derive from paid_amount >= amount
  paid_at: string | null;
  reminded_at: string | null;
  dispute_note: string | null;
  dispute_status: DisputeStatus;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string | null;
  category_id: string | null;
  emoji: string | null;
  split_type: SplitType;
  receipt_url: string | null;
  receipt_ocr_json: ReceiptOcrResult | null;
  original_currency: string | null;
  exchange_rate: number | null;
  recurring_template_id: string | null;
  is_settled_cached: boolean;
  settled_at: string | null;
  notes: string | null;
  tags: string[];
  created_via: ExpenseCreatedVia;
  created_by_user_id: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  // Joined
  payers?: ExpensePayer[];
  shares?: ExpenseShare[];
}

export interface ExpenseSettlement {
  id: string;
  event_id: string;
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
  currency: string;
  method: SettlementMethod;
  reference_url: string | null;
  note: string | null;
  confirmed_by_payer_at: string | null;
  confirmed_by_payee_at: string | null;
  created_at: string;
}

export interface ExpenseRecurringTemplate {
  id: string;
  event_id: string;
  title: string;
  amount: number;
  currency: string;
  category_id: string | null;
  emoji: string | null;
  split_config: SplitConfig;
  payer_config: PayerConfig[];
  frequency: RecurringFrequency;
  next_run_date: string;
  last_spawned_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by_user_id: string | null;
}

export type SplitConfig =
  | { type: "equal"; exclude?: string[] }
  | { type: "custom"; shares: Array<{ participant_id: string; amount: number }> }
  | { type: "percentage"; shares: Array<{ participant_id: string; percentage: number }> };

export interface PayerConfig {
  participant_id: string;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  event_id: string | null;
  name: string;
  icon: string | null;
  emoji: string | null;
  color: string | null;
  sort_order: number;
  is_system: boolean;
  created_at: string;
}

export interface ExpenseActivityEntry {
  id: number;
  event_id: string;
  expense_id: string | null;
  settlement_id: string | null;
  actor_participant_id: string | null;
  actor_user_id: string | null;
  action: string; // 'expense.created' | 'expense.amount_changed' | 'expense.deleted' | 'settlement.confirmed' | ...
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ReceiptOcrResult {
  merchant: string | null;
  total: number | null;
  currency: string | null;
  date: string | null;
  line_items: Array<{ label: string; amount: number; qty?: number }>;
  tax: number | null;
  confidence: number;
  raw_text: string;
}

export interface ParticipantBalance {
  event_id: string;
  participant_id: string;
  net_balance: number;
}

export interface SimplifiedDebt {
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
}

// --- Aggregates ---------------------------------------------------------

export interface ExpensesSummary {
  totalAmount: number;
  settledAmount: number;
  openAmount: number;
  byCategoryId: Record<string, number>;
  byPayerId: Record<string, number>;
  count: number;
}

// --- Mutation inputs ----------------------------------------------------

export interface AddExpenseInput {
  eventId: string;
  amount: number;
  currency?: string;
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  expenseDate?: string;
  categoryId?: string | null;
  emoji?: string | null;
  notes?: string | null;
  tags?: string[];
  createdVia?: ExpenseCreatedVia;
  payers: PayerConfig[];
  shares: Array<{ participant_id: string; amount: number }>;
  splitType?: SplitType;
  receiptFile?: File | Blob | null;
  dispatchOcr?: boolean;
}

export interface UpdateExpenseInput {
  id: string;
  patch: Partial<{
    amount: number;
    description: string;
    expense_date: string;
    category_id: string | null;
    emoji: string | null;
    notes: string | null;
    tags: string[];
    currency: string;
  }>;
  payers?: PayerConfig[];
  shares?: Array<{ participant_id: string; amount: number }>;
}

export interface SettleDebtInput {
  eventId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  method: SettlementMethod;
  currency?: string;
  referenceUrl?: string;
  note?: string;
}

export interface NewRecurringInput {
  eventId: string;
  title: string;
  amount: number;
  currency?: string;
  categoryId?: string | null;
  emoji?: string | null;
  splitConfig: SplitConfig;
  payerConfig: PayerConfig[];
  frequency: RecurringFrequency;
  nextRunDate: string;
}

// --- Split math helpers -------------------------------------------------

export function computeShares(
  amount: number,
  participantIds: string[],
  config: SplitConfig,
): Array<{ participant_id: string; amount: number }> {
  if (config.type === "equal") {
    const excluded = new Set(config.exclude ?? []);
    const included = participantIds.filter((p) => !excluded.has(p));
    if (included.length === 0) return [];
    const perHead = Math.floor((amount * 100) / included.length) / 100;
    const shares = included.map((pid) => ({ participant_id: pid, amount: perHead }));
    // Distribute rounding remainder to the first share
    const sum = shares.reduce((s, x) => s + x.amount, 0);
    const remainder = Math.round((amount - sum) * 100) / 100;
    if (shares.length > 0 && remainder !== 0) shares[0].amount += remainder;
    return shares;
  }
  if (config.type === "custom") {
    return config.shares.map((s) => ({ participant_id: s.participant_id, amount: s.amount }));
  }
  // percentage
  return config.shares.map((s) => ({
    participant_id: s.participant_id,
    amount: Math.round(((amount * s.percentage) / 100) * 100) / 100,
  }));
}

export function shareIsPaid(share: Pick<ExpenseShare, "amount" | "paid_amount">): boolean {
  return share.paid_amount >= share.amount - 0.005;
}

export function formatMoney(amount: number, currency = "EUR", locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
