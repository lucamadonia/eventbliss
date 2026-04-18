# EventBliss Expenses v2 — Masterplan

> **North Star:** Der einfachste Weg für Event-Gruppen, Geld zu tracken, zu splitten und zu begleichen — ohne dass es awkward wird.
>
> **Ambition:** Nicht Splitwise kopieren, sondern schlagen. Dark-only, mobile-first, iOS + Android-ready via Capacitor.

## TL;DR

Wir bauen `EventExpenses` von Grund auf neu. Ziel: **Ausgabe hinzufügen in 3 Taps** (Splitwise braucht 7–9). Basis-Schema erweitert um Multi-Payer, Settlements, Recurring, OCR, Activity-Log, FX-Locking, Multi-Currency. Native-UX mit Haptics an 24 Interaktionspunkten, Swipe-Actions, Bottom-Sheet-3-Snap-Points. 5 Ausgaben gratis statt 3 (Splitwise-Dark-Pattern vermeiden).

---

## 1. Personas & Flows

- **Lena (Organizer)** — bucht Villa-Anzahlung, will in 10 s loggen, Übersicht wer schuldet.
- **Marco (Teilnehmer)** — will 1-Tap zurückzahlen, Beleg als Bestätigung.
- **Noah (Reluctant)** — will nicht angeprangert werden, braucht klaren Zahlungslink.

**Flows mit Tap-Budget:**

| Flow | Splitwise | v2-Ziel |
|---|---|---|
| Expense hinzufügen | 7–9 | **3** (FAB → Amount+Desc → Save) |
| Schuld begleichen | 5–7 + externer App-Wechsel | **2** (Balance-Card → "124 € zahlen"-Deeplink) |
| "Was schulde ich / wer schuldet mir" | 2 | **1** (Tab-Home = Balance-Hero) |
| Disputed / Returned Expense | nicht unterstützt | **2** (Long-Press → "Dispute") |
| Event abschließen | 6+ | **3** (Event-Detail → "Close" → Bestätigen) |

---

## 2. Feature-Tiers

### Free (≤ 5 Expenses pro Event)
Equal/Custom/Percent-Split, Per-Participant-Exclusion, Live-Balance-Card, Simplified-Debt-Graph, Cash-Settle mit Timestamp, Expense-Timeline, Offline-Queue, Dark/Light, WhatsApp-Share.

### Premium (Unlock bei 6. Ausgabe)
Unlimited Expenses, **Receipt-OCR** (OpenAI 4o-mini, ~0,2 ct/Beleg), **Multi-Payer**, **Recurring Templates**, **Smart-Split-Memory** (Pair-wise Historie), **Voice-Input**, **FX-Currency-Lock**, **Payment-Deep-Links** (SEPA/PayPal.me/Revolut/Wise), **Proof-Upload** für Cash, **Category-Budgets**, **AI-Category-Inference**, **Confetti + Haptic** bei Settlement, Smart-Reminders, CSV+PDF-Export.

### Enterprise / Organizer (EventBliss Pro)
Treasurer-Role, Approval-Workflow, Virtual-Kitty/Pot, Corporate-Card-Import, Tax-Export (DE USt), Audit-Log, Multi-Event-Dashboard, Webhooks zu Notion/Sheets, Split-Lock.

---

## 3. 12 Killer-Features (beat Splitwise)

1. **One-Tap-Settle via native Payment-Links** → Revolut/PayPal/SEPA pre-filled
2. **Receipt-OCR mit Itemized-Split** (snap → jedes Item einer Person zuordnen)
3. **Debt-Graph-Simplifier mit Visualisierung** (min-cost-flow, framer-motion SVG)
4. **Voice-Quick-Add** ("Hey Siri, 45 € Dinner, Split mit allen außer Noah")
5. **Awaiting-Proof-State für Cash** (Pending bis Empfänger bestätigt)
6. **Smart-Split-Memory** ("Letztes Mal 60/40 mit Maria — wieder so?")
7. **Timeline-View** mit Activity-Log (wer wann was)
8. **Per-Expense-Excluder mit Avatar-Grid** (Faces statt Checkboxen)
9. **FX-Locked Multi-Currency** (45 USD → 41,20 € @ 0,916, Rate per Date eingefroren)
10. **Recurring-Expenses** (Miete 1., Groceries täglich)
11. **AI-Category + Emoji-Inference** (Haiku-Call, 20-Kategorien-Classifier)
12. **Confetti + Receipt-Tear-Haptic** bei Settlement

---

## 4. Schema-Architektur (neu/erweitert)

### Erweitert
- `expenses`: `receipt_ocr_json`, `original_currency`, `exchange_rate`, `recurring_template_id`, `is_settled_cached`, `settled_at`, `notes`, `tags[]`, `category_id`, `created_via`, `created_by_user_id`
- `expense_shares`: `paid_amount`, `reminded_at`, `dispute_note`, `dispute_status`

### Neu
- **`expense_payers`** — Multi-Payer (2 Leute zahlen gemeinsam)
- **`expense_settlements`** — Zahlungen zwischen Teilnehmern, method + proof
- **`expense_recurring_templates`** — Wiederkehrende Expenses mit `next_run_date`
- **`expense_categories`** — Custom per-Event oder per-Agency
- **`expense_activity_log`** — Append-only Audit, Basis für Timeline
- **`fx_rates`** — Cached Exchange-Rates, nightly refresh

### RPCs & Triggers
- `simplified_debts(event_id)` — Greedy min-transfer algorithm
- `expense_balance_view` — Net-balance per Participant (materializable)
- Trigger `trg_expenses_activity` — schreibt Activity-Log bei jedem Change
- Trigger `trg_settlement_apply_shares` — verteilt Settlement-Betrag auf offene Shares
- Trigger `trg_free_tier_cap` — blockt Insert bei > 5 auf Free-Tier
- Trigger `trg_expense_cache_settled` — setzt `is_settled_cached` wenn alle Shares bezahlt

### Storage
- Bucket `expense-receipts` (private), Path `{event_id}/{expense_id}/{uuid}.ext`, Max 10 MB, Mime: jpg/png/heic/webp/pdf
- RLS: nur Event-Teilnehmer lesen/schreiben

---

## 5. Hooks (React-Query TypeScript)

```ts
useExpenses(eventId)                    // list + totals
useAddExpense()                         // with receipt, payers[], shares[]
useUpdateExpense()                      // partial patch
useDeleteExpense()                      // soft-delete with reason
useSettleDebt()                         // method + reference_url
useSimplifiedDebts(eventId)             // from → to → amount
useRecurringTemplates(eventId)          // list + create + toggle
useExpenseActivity(eventId, since)      // infinite timeline
useReceiptUpload()                      // → Storage + OCR dispatch
```

Invalidation: `['expenses', eventId]` + `['balances', eventId]` on mutate.

---

## 6. OCR-Pipeline

- **Provider:** OpenAI `gpt-4o-mini` Vision (~0,0015 $/Beleg bei ~1 MP)
- **Ort:** Supabase Edge Function `ocr-receipt`
- **Trigger:** Client-Upload (`useReceiptUpload`) ODER Storage-Webhook `on_object_created`
- **Return:** `{merchant, total, currency, date, line_items[], tax, confidence, raw_text}`
- **Budget:** ~200 $/Monat bei 100k Scans

---

## 7. Currency / FX

- Source: `exchangerate.host` primary, `frankfurter.app` fallback
- Cache: Tabelle `fx_rates (base, quote, rate_date, rate)`
- Refresh: Edge Function `fx-refresh` via `pg_cron` nightly 01:00 UTC
- Lock: `exchange_rate` wird bei Expense-Insert eingefroren → historische Salden driften nicht

---

## 8. Realtime & Offline

- **Realtime:** ein Channel pro Event `realtime:event:{id}`, invalidates debounced 300 ms
- **Balance:** niemals full-push, Clients berechnen aus gecachten Shares/Payers
- **Offline:** `idb-keyval` Persister + Mutation-Queue in `pending_mutations` IDB store
- **Conflicts:** CRDT-style für `paid_amount` (additive deltas), `last-write-wins` für Amounts mit Toast

---

## 9. Native UX — 9 Screens

1. **Expenses List** (Module-Home): sticky Header + Balance-Hero + Day-Grouped-Rows + FAB
2. **Balance-Card** (swipe-expandable 96→280 px, per-Member-Bars)
3. **Add-Expense-Sheet** (3 Snap-Points: 40% Quick / 85% Detail / 100% Split)
4. **Expense-Detail** (Full-Screen, Hero-Amount, Receipt, Activity-Log)
5. **Split-Configurator** (Segmented: Equal/Percent/Custom/Shares mit Lock-Icon)
6. **Receipt-Capture** (Fullscreen-Camera → Auto-Edge-Detect → OCR-Progress)
7. **Settlement-Flow** (Graph-Viz + Method-Picker + Mark-as-settled)
8. **Activity-Timeline** (pinch-to-zoom Days/Weeks/Months)
9. **Recurring-Templates** (Grid + Frequency-Chip + Pause/Resume)

### Nav-Tree
Root: Events → Event-Dashboard (segmented) → **Expenses** (module-home) → Add/Detail/Settle/Timeline/Recurring. Deep-Links: `eventbliss://event/{id}/expenses[/new?amount=&title=]`, Universal-Links `event-bliss.com/e/{id}/expenses`.

### Haptic-Table (24 Events)
FAB-tap = medium · Row-swipe-reveal = light · Delete-commit = warning · Paid-commit = success · Long-press = medium · Pinch-snap = light · Pull-refresh = success · Amount-keypress = selection · OCR-done = success · Shutter = heavy · Undo = success · Settlement-done = heavy+success chained · Error = error notif (+ 8px shake 3x) · … volle Tabelle im Code-Kommentar.

### Tokens (Dark-only)
```
Background        #0B0D12
Surface           #14171F
Surface-Elevated  #1B1F2A
Outline           #2A2E37
Text-Primary      #F4F5F7
Text-Secondary    #A1A7B3
Brand             #7C5CFF
Success           #2FD27A
Danger            #FF4D6D
Money-Positive    #36E0A0
Money-Negative    #FF6B8A
```

---

## 10. iOS/Android Besonderheiten

- **iOS:** Dynamic Island Live-Activity für pending Settlements, Control Center "Quick Add", Siri Shortcut "Add expense to {Event}", Shake-to-undo, Handoff via `NSUserActivity`
- **Android:** Material 3 FAB, Predictive-Back (API 34+), App-Shortcuts (long-press Icon → Add), Home-Widget (2x2 Glance), Share-Target für Fotos, Scoped-Storage für Receipts

---

## 11. Anti-Features (explizit NICHT)

- Cross-Event Debt-Netting (Privacy-Risk)
- Crypto-Settlements
- Built-in Chat (WhatsApp/iMessage gewinnen)
- Public Leaderboards ("most generous splitter")
- Ads / Freemium-Nag-Screens
- Manuelles IBAN-Tippen zum Settlen
- Desktop-Feature-Parity (Web = Read-only Dashboard + Export)

---

## 12. Rollout-Phasen

| # | Phase | Deliverables |
|---|---|---|
| 1 | **Schema** | Migrations 20260420000000 bis 20260420070000 (7 Files, idempotent) |
| 2 | **Hooks + Types** | `src/hooks/expenses/*` (10 Hooks), Zod-Schemas |
| 3 | **Core-UI** | BalanceCard, AddExpenseSheet, SplitConfigurator, ExpenseRow, SettlementFlow |
| 4 | **Receipt + OCR** | Edge Function `ocr-receipt`, Storage-Bucket, UI-Flow |
| 5 | **Advanced** | Recurring-Templates, Activity-Timeline, Multi-Currency+FX, Payment-Deep-Links |
| 6 | **Native-Polish** | Haptics an allen 24 Points, Live-Activity (iOS), Widget (Android), Shake-to-undo |
| 7 | **Feature-Flag** | `profiles.feature_flags->>'expenses_v2' = 'on'`, v1 läuft 4 Wochen parallel |

---

## 13. Security & Performance

**RLS Highlights:**
- Participant kann nicht fremde Events lesen
- Settlement-Confirmations nur durch betroffene User (via Trigger)
- Activity-Log nur SECURITY-DEFINER-Triggers
- Storage-Bucket: Path-basierte Event-Membership-Prüfung

**Performance-Budget:**
- `useExpenses(100)` p50 80 ms / p95 250 ms
- `useSimplifiedDebts(20 part.)` p50 40 ms / p95 120 ms
- `useAddExpense` p50 120 ms / p95 400 ms (via RPC `add_expense`)
- OCR E2E p50 2,5 s / p95 6 s (async mit Skeleton)
- Realtime-Fanout (20 Clients) p50 150 ms / p95 500 ms

---

## 14. Wow-Moment (erste 10 s)

User tippt pulsierenden **+**-FAB, Bottom-Sheet springt hoch, Custom-Numpad bereits aktiv und Amount-Field fokussiert, tippt `45`, spricht _"dinner with everyone"_, App erkennt "everyone" = alle 6, inferiert Kategorie ☕/🍽 mit Emoji, zeigt Split-Preview live (7,50 € each), speichert auf Keyboard-Dismiss. **Null Form-Felder. 3 Sekunden. Haptic-Confirm. Balance-Card updated mit 200ms Spring.**

→ Das ist wenn sie Splitwise löschen.
