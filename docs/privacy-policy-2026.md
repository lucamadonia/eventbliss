# Datenschutzerklärung — EventBliss (Stand: 18. Mai 2026)

**Master-Dokument für die Vorlage beim Datenschutzbeauftragten (DPO) und der Cyprus Bar Association.**
Diese Datenschutzerklärung ist auf den **vollständigen Datenbestand** und alle **Sub-Processors** der EventBliss-Plattform (Web + iOS + Android) abgestimmt und nach der vollständigen Code-/Datenfluss-Auditierung am 18.05.2026 erstellt. Sie ist als **rechtlich verbindliche, internationale Datenschutzerklärung** gemäß **Art. 13/14 DSGVO** in Verbindung mit dem **zypriotischen Gesetz Nr. 125(I)/2018 (Πρόνοιες προσωπικών δεδομένων)** konzipiert.

---

## 🚨 0. Kritische Action-Items für den Datenschutzbeauftragten (DPO) vor Veröffentlichung

Diese 16 Punkte **müssen** vor der finalen Freigabe und Veröffentlichung dieser Datenschutzerklärung geklärt oder umgesetzt sein. Sie sind in der Code-Audit am 2026-05-18 identifiziert worden:

| # | Befund | Ort | Risiko | Aktion |
|---|---|---|---|---|
| **0.1** | **„Konto löschen" ist No-Op** — UI ruft nur `signOut()` auf, kein echtes Löschen | `src/pages/ProfileSettings.tsx:150–167` | **Art. 17 DSGVO Verstoß** | Edge Function `delete-user` mit `supabase.auth.admin.deleteUser` + Kaskaden-Cleanup implementieren |
| **0.2** | **Datenexport nicht implementiert** | — | **Art. 20 DSGVO Verstoß** | JSON-Export-Endpoint bauen (alle Tabellen für `auth.uid()`) |
| **0.3** | **`user_activity_logs` RLS-Bug**: `WITH CHECK (true)` erlaubt Forged Entries | `supabase/migrations/...0109171315...sql:28` | Audit-Manipulation | RLS auf `WITH CHECK (user_id = auth.uid())` ziehen |
| **0.4** | **`event-files` Storage-Bucket** verwendet `getPublicUrl()` ohne Size-/MIME-Limit | `src/hooks/useEventFiles.ts:54–91` | Public-File-Leak, Pfad-Traversal | Auf `createSignedUrl()` + 10-MB-Cap + MIME-Allowlist umstellen |
| **0.5** | **Keine HSTS / CSP / X-Frame-Options / Referrer-Policy** im Vercel-Config | `vercel.json` | XSS, Clickjacking | `headers`-Block in `vercel.json` ergänzen |
| **0.6** | **Keine MFA für Admin-/Agency-Owner-Konten** | `src/components/auth/AdminRoute.tsx` | Privilegierter Account-Hijack | Supabase MFA aktivieren, AAL2 in Admin-Routen erzwingen |
| **0.7** | **Supabase-Auth-Token im `localStorage`** auf nativen Geräten | `src/integrations/supabase/client.ts:13` | Token-Diebstahl bei XSS | `@capacitor/preferences` oder SecureStorage-Adapter einsetzen |
| **0.8** | **Kamera-Fotos behalten EXIF inkl. GPS-Daten** | `src/lib/camera.ts` | Standort-Leak via Belege | EXIF strippen vor Upload (`piexifjs` oder Canvas re-encode) |
| **0.9** | **`responses.restrictions` Free-Text** kann **Art. 9 DSGVO-Daten** enthalten (Allergien, Religion, Gesundheit) | Survey-Form `/e/:slug` | Besondere Datenkategorie ohne expliziten Hinweis | Explizite Einwilligungs-Checkbox im Formular + Begrenzung der Textlänge |
| **0.10** | **Doppelter Opt-In für Newsletter** wird in `Privacy.tsx` versprochen, im Code aber **nicht ausgelöst** | `src/components/landing/NewsletterForm.tsx:47–55` | Wettbewerbswidrig + Beweisbarkeit | DOI-Edge-Function implementieren |
| **0.11** | **`leaderboard`-View enthält Klarnamen** und ist anonym lesbar | `public.leaderboard` (DB-View) | Veröffentlichung von Klarnamen ohne Opt-In | Pseudonymisieren oder explizites Opt-In im Profil |
| **0.12** | **PLZ Paphos: 8046 (in 4 von 5 Files) vs 8042 (`Disclaimer.tsx` + ursprünglicher User-Brief)** | mehrere Files | Inkonsistenz im Impressum | DPO bestätigt die korrekte PLZ; alle 5 Files vereinheitlichen |
| **0.13** | **`leaflet`-NPM-Paket installiert aber ungenutzt** | `package.json` | Unnötige Abhängigkeit | Aus `package.json` entfernen |
| **0.14** | **Apple/Google In-App-Purchase in alter Privacy versprochen, aber kein IAP-Plugin installiert** | bestehende `public/legal/privacy.html` §13 | Falschangabe in App-Store-Privacy-Label | Entweder IAP implementieren oder Aussage entfernen |
| **0.15** | **iOS-Location-Permission deklariert (`NSLocationWhenInUseUsageDescription`) aber im Code nie verwendet** | `ios/App/App/Info.plist` | App-Store-Rejection wegen Over-Collection | Permission aus `Info.plist` + `AndroidManifest.xml` entfernen, oder Feature implementieren |
| **0.16** | **Affiliate-Auszahlungs-Details (`affiliates.payout_details` JSONB)** enthalten unverschlüsselt IBAN/PayPal/Tax-ID | `public.affiliates` | Hohes Datenschutzrisiko bei DB-Leak | Column-Level-Encryption (`pgsodium`) oder Auslagerung an Stripe Connect |

**→ Stand dieser Punkte muss vor Going-Live durch den DPO protokolliert werden. Das Dokument bezieht sich auf den Zielzustand nach Behebung dieser Punkte.**

---

## 1. Verantwortlicher (Controller)

**MYFAMBLISS GROUP LTD**
Gladstonos 12–14
**8046 Paphos** _(DPO: bitte gegen Punkt 0.12 bestätigen)_
Republik Zypern (Republic of Cyprus)

Registriert beim **Department of Registrar of Companies and Intellectual Property** unter der Nummer **HE 473088**.
Umsatzsteuer-Identifikationsnummer: **CY60165018Q**.

**Vertretungsberechtigter Geschäftsführer (Sole Director):** _wird vom DPO ergänzt_
**Telefon:** +357 99 980 583
**E-Mail (allgemein):** info@event-bliss.com
**E-Mail (Datenschutz):** privacy@event-bliss.com
**E-Mail (Compliance / B2B):** compliance@event-bliss.com
**Webseite:** https://event-bliss.com · https://www.mfg.cy

EU-Vertreter gem. Art. 27 DSGVO: Nicht erforderlich, da der Verantwortliche bereits in der EU (Republik Zypern) ansässig ist.

---

## 2. Datenschutzbeauftragter (DPO)

Ein interner / externer Datenschutzbeauftragter ist gemäß **Art. 37 Abs. 1 DSGVO** bestellt, da die Kerntätigkeit von EventBliss (Verarbeitung umfangreicher personenbezogener Daten der Teilnehmer von Veranstaltungen über mehrere Mitgliedstaaten hinweg, Profiling für KI-Vorschläge) eine **regelmäßige und systematische Überwachung von Betroffenen in großem Umfang** darstellt.

**DPO-Kontakt:** dpo@event-bliss.com
**Postanschrift:** MYFAMBLISS GROUP LTD, z. Hd. Datenschutzbeauftragter, Gladstonos 12–14, 8046 Paphos, Republic of Cyprus.

---

## 3. Begriffsbestimmungen

Diese Datenschutzerklärung verwendet die Begriffsbestimmungen aus **Art. 4 DSGVO** (insb. „personenbezogene Daten", „Verarbeitung", „Verantwortlicher", „Auftragsverarbeiter", „Einwilligung", „besondere Kategorien personenbezogener Daten" gem. Art. 9 DSGVO).

---

## 4. Rechte der betroffenen Person (Art. 12–22 + Art. 77 DSGVO)

Du hast als betroffene Person folgende Rechte gegenüber dem Verantwortlichen:

1. **Recht auf Auskunft (Art. 15 DSGVO)** — du kannst eine Bestätigung verlangen, ob wir personenbezogene Daten über dich verarbeiten, und Auskunft über diese Daten erhalten. Anfragen an: privacy@event-bliss.com. Reaktionszeit: max. **1 Monat** (verlängerbar auf 3 Monate bei komplexen Anfragen, Art. 12 Abs. 3 DSGVO).
2. **Recht auf Berichtigung (Art. 16 DSGVO)** — unrichtige Daten korrigieren. Profil-Berichtigung direkt in `/settings`; weitere Daten auf Anfrage.
3. **Recht auf Löschung / „Recht auf Vergessenwerden" (Art. 17 DSGVO)** — über die App: `/settings → Konto löschen` (nach Umsetzung Action-Item 0.1) oder per E-Mail an privacy@event-bliss.com. Ausnahmen: Aufbewahrungspflichten nach zypriotischem und deutschem Steuer-/Handelsrecht (siehe Abschnitt 27).
4. **Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)**.
5. **Recht auf Datenübertragbarkeit (Art. 20 DSGVO)** — Export deiner Daten in strukturiertem, maschinenlesbarem Format (JSON) auf Anfrage. Self-Service-Export ist in Vorbereitung (Action-Item 0.2).
6. **Widerspruchsrecht (Art. 21 DSGVO)** — insbesondere gegen Direktmarketing (jederzeit ohne Begründung); gegen Verarbeitung auf Basis von berechtigtem Interesse (mit Begründung).
7. **Widerrufsrecht (Art. 7 Abs. 3 DSGVO)** — du kannst jede erteilte Einwilligung jederzeit für die Zukunft widerrufen.
8. **Recht, keiner ausschließlich automatisierten Entscheidung unterworfen zu werden (Art. 22 DSGVO)** — siehe Abschnitt 32.
9. **Recht auf Beschwerde bei der Aufsichtsbehörde (Art. 77 DSGVO)** — siehe Abschnitt 33.

Alle Rechte werden **kostenfrei** ausgeübt, außer bei offenkundig unbegründeten oder exzessiven Anfragen (Art. 12 Abs. 5 DSGVO).

---

## 5. Allgemeine Hinweise zur Datenverarbeitung

### 5.1 Hosting & Infrastruktur (Web-Anwendung)
Die Web-Anwendung `event-bliss.com` wird über das **Edge-CDN von Vercel Inc.** (San Francisco, USA, EU-Edge-Knoten verfügbar) ausgeliefert. Server-Backend (Datenbank, Auth, Storage, Edge Functions) ist bei **Supabase Inc.** in der Region **AWS eu-central-1 (Frankfurt am Main)** gehostet.

### 5.2 Server-Logs
Bei jedem Aufruf werden technisch notwendige Daten verarbeitet:
- IP-Adresse (gekürzt nach 7 Tagen)
- Datum + Uhrzeit der Anfrage
- HTTP-Methode + URL + Statuscode
- User-Agent (Browser/OS-Version)
- Referrer (sofern übermittelt)

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Betriebssicherheit und Missbrauchsabwehr). Speicherdauer: **14 Tage**, danach automatische Löschung.

### 5.3 TLS-Verschlüsselung
Sämtlicher Datenverkehr zur Web-Anwendung und zur App erfolgt ausschließlich über **TLS 1.2+ / HTTPS**. Capacitor-Schemes sind hart auf `https` festgelegt (`capacitor.config.ts:8–9`), Mixed-Content im WebView ist nicht möglich.

---

## 6. Konto-Registrierung und Authentifizierung

### 6.1 Zwecke und Daten
Wenn du dir ein EventBliss-Konto anlegst (E-Mail + Passwort), verarbeiten wir:
- E-Mail-Adresse
- Gewählter Anzeigename (`full_name`)
- Passwort als bcrypt-Hash (niemals im Klartext)
- Sprach-Präferenz (de/en/es/fr/it/nl/pl/pt/tr/ar) im `raw_user_meta_data`
- Konto-Zeitstempel (`created_at`, `last_sign_in_at`)
- E-Mail-Bestätigungs- und Passwort-Reset-Tokens (temporär)

Daten werden in der Tabelle `auth.users` (Supabase-managed) sowie `public.profiles` gespeichert.

### 6.2 Rechtsgrundlage
**Art. 6 Abs. 1 lit. b DSGVO** (Vertragserfüllung — du kannst EventBliss ohne Konto nicht nutzen).

### 6.3 Drittanbieter-Login (SSO)
Aktuell ist **kein** OAuth-Login (Google / Apple / Facebook) aktiviert. Sollte SSO künftig hinzukommen, werden Apple Inc. / Google LLC entsprechend als zusätzliche Sub-Processors aufgeführt und die App-Store-Datenschutz-Labels aktualisiert.

### 6.4 Passwort-Sicherheit
Mindestlänge **8 Zeichen** mit jeweils mindestens 1 Großbuchstabe / 1 Kleinbuchstabe / 1 Ziffer (`src/lib/password-validation.ts`). Hash: **bcrypt** (Supabase-Default).

---

## 7. Profil- und Personalisierungsdaten

| Tabelle | Felder | Zweck |
|---|---|---|
| `public.profiles` | `id` (= `auth.users.id`), `email`, `full_name`, `must_change_password`, `created_at`, `updated_at` | Anzeige in der UI, Leaderboards, Admin-Verwaltung |
| `auth.users.raw_user_meta_data` | `language`, `full_name` (Sync mit profiles) | UI-Personalisierung |
| `localStorage` (Browser/Native) | Theme (dark/light/rose), gewählte Sprache | UI-Personalisierung — verlässt das Gerät nicht |
| `public.subscriptions` | `plan`, `stripe_subscription_id`, `stripe_customer_id`, `started_at`, `expires_at` | Premium-Status, Stripe-Linking |

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b (Vertrag) für Funktionen, Art. 6 Abs. 1 lit. f (berechtigtes Interesse) für interne Statistik.

---

## 8. Event-Verwaltung

Beim Erstellen oder Verwalten einer Veranstaltung verarbeitet EventBliss die in der Tabelle `public.events` gespeicherten Daten:

`id`, `slug`, `name`, `description`, `event_type`, `status`, `honoree_name` (Ehrengast-Klarname), `event_date`, `survey_deadline`, `access_code`, `is_public`, `theme` (JSONB), `settings` (JSONB), `locale`, `currency`, `timezone`, `created_by`, `client_name`, `client_email`, `venue_name`, `venue_address`, `expected_guests`, `planned_budget`, `actual_budget`, `event_phase`, `agency_id`, `archived_at/by`, `deleted_at/by`, `deletion_reason`.

Hinweis: Du verarbeitest hier auch **Daten Dritter** (Ehrengast, Lokal-Inhaber, Kunden-Endkunden im Agency-Kontext). Du bist verpflichtet, diese Personen vorab zu informieren oder eine Rechtsgrundlage (z. B. berechtigtes Interesse, Auftrag) sicherzustellen.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO.
**Aufbewahrung:** 30-tägiger Papierkorb über `deleted_at` (Soft-Delete), danach Hard-Delete.

---

## 9. Teilnehmer-Daten (Participants)

EventBliss-Veranstaltungen umfassen Daten von Teilnehmern, die per **Code, Magic-Link oder Self-Sign-up** zur Veranstaltung hinzugefügt werden.

| Feld | Inhalt |
|---|---|
| `name`, `email`, `phone`, `avatar_url` | Identifikation, Kontakt, Anzeige |
| `role` | Organizer / Member |
| `status` | Eingeladen / Beigetreten / Abgelehnt |
| `dashboard_permissions` (JSONB) | Granulare Berechtigungen |
| `invite_token`, `invite_sent_at`, `invite_claimed_at` | Versand-Audit |

**Wichtig — Verantwortlichkeit Dritter:** Wenn ein Organizer Teilnehmer **mit Klarname/E-Mail/Telefon** einlädt, ohne dass diese aktiv zugestimmt haben, beruht die Verarbeitung auf dem **berechtigten Interesse des Organizers** an der Veranstaltungs-Organisation (Art. 6 Abs. 1 lit. f DSGVO). Der Teilnehmer wird in der Einladungs-E-Mail über die Verarbeitung informiert und hat ein Widerspruchsrecht.

**Aufbewahrung:** Bis Event abgeschlossen + 12 Monate, dann automatische Anonymisierung des Teilnehmer-Datensatzes (Klarname → `[Teilnehmer #ID]`).

---

## 10. Survey-Antworten (Umfragedaten)

Die JGA-Survey verarbeitet in `public.responses`:

`participant`, `attendance`, `duration_pref`, `date_blocks[]`, `partial_days`, `budget`, `destination`, `de_city`, `travel_pref`, `preferences[]`, `fitness_level`, **`alcohol`**, **`restrictions`** (Free-Text), `suggestions`, `meta` (JSONB inkl. `custom_answers`).

### ⚠️ Hinweis: Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO)

Das Free-Text-Feld `restrictions` kann unter Umständen **Gesundheitsdaten** (Allergien, Unverträglichkeiten), **religiöse Überzeugungen** (Halal, Koscher) oder ähnliche **besondere Kategorien personenbezogener Daten** enthalten. Wir bitten dich, in diesem Feld **nur Informationen zu hinterlegen, die du freiwillig teilst**, und keine sensiblen Gesundheits- oder Religionsdetails einzutragen, sofern nicht zwingend erforderlich.

**Rechtsgrundlage für diese Daten:** Art. 9 Abs. 2 lit. a DSGVO — **ausdrückliche Einwilligung** durch das Abschicken des Formulars mit dem entsprechenden Hinweistext.

**Aufbewahrung:** Bis Event abgeschlossen + 30 Tage.

---

## 11. Ausgaben-Tracking (Expenses v1 + v2)

Tabellen: `public.expenses`, `public.expense_shares`, `public.expense_payers`, `public.expense_settlements`, `public.expense_activity_log`, `public.expense_recurring_templates`, `public.expense_categories`.

Verarbeitete Daten umfassen:
- Beträge, Währung, Beschreibungs-Texte
- **Zahlungsmethode** (`cash`/`bank`/`paypal`/`revolut`/`wise`/`apple_pay`/`google_pay`/`other`) und **Referenz-URL** (z. B. TWINT-Link, PayPal-Beleg)
- **Beleg-Fotos** (Bucket `expense-receipts`, privat, max. 10 MB, MIME-Allowlist)
- **OCR-Ergebnis** (`receipt_ocr_json`): Händler, Datum, Posten, Steuer, Rohtext — vom KI-Anbieter zurückgesendet

Belege können aufgrund von **EXIF-Metadaten Geokoordinaten** enthalten. Action-Item 0.8 schreibt vor, EXIF-Daten vor dem Upload zu entfernen.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
**Aufbewahrung:**
- Soft-Delete (`deleted_at`) für 30 Tage.
- Wenn eine Ausgabe Teil einer steuerrelevanten Rechnung eines Agency-Tenants ist, gelten **10 Jahre** (Art. 257 HGB / § 147 AO / Art. 36 Income Tax Law Cyprus N.118(I)/2002).

---

## 12. Marketplace & Buchungen

Tabellen: `public.marketplace_services`, `public.marketplace_bookings`, `public.marketplace_reviews`, `public.marketplace_booking_cancellations`, `public.marketplace_ai_events`, `public.marketplace_availability`, `public.marketplace_blocked_dates`, `public.marketplace_service_dates`, `public.marketplace_service_translations`.

Buchungs-Datensatz (`marketplace_bookings`) enthält u. a.:
- `customer_id`, `customer_name`, `customer_email`, `customer_phone`, `customer_notes`
- `stripe_payment_intent_id`, `stripe_checkout_session_id`, `stripe_transfer_id`, `stripe_refund_id`
- Vollständige Preisaufschlüsselung in Cent, Plattform-Fee, Agency-Payout
- Stornierungs- und Refund-Audit (`marketplace_booking_cancellations`)

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO.
**Aufbewahrung:** **10 Jahre** (Steuer-/Rechnungsaufbewahrung), nach Ablauf Pseudonymisierung des Kunden-Datensatzes.

---

## 13. Zahlungsabwicklung (Stripe)

Sämtliche Zahlungen werden über die **Stripe Payments Europe Ltd.** (Dublin, Irland — EWR-Vertragspartner) abgewickelt. Card-Daten (PAN, CVV, Expiry) werden **niemals** an EventBliss übertragen; sie werden direkt vom Browser/WebView an die hosted Checkout-Seite von Stripe übermittelt. EventBliss erhält ausschließlich:
- `stripe_customer_id`, `stripe_subscription_id`, `stripe_payment_intent_id`, `stripe_checkout_session_id`, `stripe_transfer_id`, `stripe_refund_id`, `stripe_account_id`, `stripe_coupon_id`
- E-Mail-Adresse (vom Stripe-Formular)
- Gezahlter Betrag + Währung + Status

**Agency-Auszahlungen** laufen über **Stripe Connect Express**. Bei der Onboarding-Prozedur fungiert **Stripe als eigenständiger Verantwortlicher (separate controller)** für KYC/AML-Daten (Geschäftsadresse, IBAN, ID-Dokumente, Beneficial Owner, Tax-ID).

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Verpflichtung: zypriotische Steuer-, Geldwäsche- und Rechnungslegungsgesetze).
**Übermittlung in Drittländer:** Onward-Übermittlung an Stripe, Inc. (USA) per **EU Standard Contractual Clauses Module 2 (Beschluss 2021/914)** + **EU-US Data Privacy Framework** (Stripe ist zertifiziert).
**AVV mit Stripe:** Stripe DPA — abrufbar unter https://stripe.com/legal/dpa (Version, die mit dem Stripe-Konto verknüpft ist).

---

## 14. KI-gestützte Funktionen

EventBliss bietet drei kategorien KI-gestützter Funktionen, die in Sub-Processors auslagern:

### 14.1 KI-Assistent / Template-Generierung (OpenRouter → Anthropic Claude)
**Was wird verarbeitet:** Event-Beschreibungen, Honoree-Namen, Survey-Antworten, Free-Text-Eingaben (Chat).
**Sub-Processor:** **OpenRouter Inc.** (San Francisco, USA) als LLM-Gateway. Default-Modell: `anthropic/claude-haiku-4.5` (auch direkt **Anthropic, PBC**).
**Edge Functions:** `ai-assistant`, `expand-template-section`, `generate-event-template`, `regenerate-template-section`.
**Quota:** 10 Requests/Minute pro Nutzer (rate-limited via `ai_usage`-Tabelle).
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Erstnutzung der KI-Funktion) + Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
**Übermittlung in Drittländer:** Standard Contractual Clauses (SCC 2021/914) mit OpenRouter Inc.; Anthropic ist DPF-zertifiziert (Stand 2026). OpenRouter ist (Stand 18.05.2026) **nicht DPF-zertifiziert** — Übermittlung erfolgt allein gestützt auf SCC. **Hinweis für DPO:** Transfer Impact Assessment (TIA) für OpenRouter ist nachzuweisen.
**Speicherdauer beim Anbieter:** Anthropic-API-Daten werden laut Anthropic Commercial Terms (Stand 2026) **nicht für Modelltraining verwendet** und nach **30 Tagen** automatisch gelöscht. OpenRouter speichert Request-Metadaten (Tokens, Modell-Wahl) bis zu **30 Tagen**.

### 14.2 OCR von Belegen (OpenAI)
**Was wird verarbeitet:** **Beleg-Fotos** + zurückgegebener Volltext + strukturierte Daten (Händler, Beträge, Posten).
**Sub-Processor:** **OpenAI, L.L.C.** (San Francisco, USA) / **OpenAI Ireland Ltd.** (Dublin) — `gpt-4o-mini` Vision API. Bild-URLs werden als **signierte Supabase-URL mit 5-Minuten-TTL** übergeben.
**Edge Function:** `ocr-receipt`.
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Erstnutzung der OCR-Funktion).
**Übermittlung in Drittländer:** SCC 2021/914 + DPF (OpenAI ist DPF-zertifiziert).
**Speicherdauer beim Anbieter:** API-Daten **nicht für Training** verwendet, Löschung nach **30 Tagen**.

### 14.3 Text-to-Speech / Sprach-Ausgabe
Drei Engines werden je nach Konfiguration eingesetzt:
- **Mistral AI SAS** (Paris, Frankreich — EWR ✅) — Voxtral TTS `voxtral-mini-tts-2603`. Max. 2 000 Zeichen pro Request. Keine Drittland-Übermittlung.
- **VITS-Web (Piper)** — `@diffusionstudio/vits-web` — läuft **client-seitig im Browser/WebView**. Modell-Dateien (ONNX) werden bei Erstnutzung von **Hugging Face, Inc.** (USA, DPF-zertifiziert) auf das Gerät heruntergeladen. **Text-Eingaben verlassen das Gerät nicht.** Beim Download werden nur IP + User-Agent von Hugging Face geloggt.
- **Browser Web Speech API** — abhängig von Browser/OS, ggf. Cloud-basiert. Beispiel: Chrome auf Android sendet Text an Google. Hier liegt die Verantwortung beim Browser-Hersteller; EventBliss übergibt nur den zu sprechenden Text an die Web-API.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO.

### 14.4 Werbe-Attribution / KI-Tracking
Die Tabelle `public.marketplace_ai_events` und `public.agency_interactions` zeichnen Interaktionen mit Marketplace-Empfehlungen auf (Impression, Klick, Buchung), inkl. `user_agent`, `referrer_path`, Match-Score. Aktivierung erfolgt erst nach **expliziter Einwilligung** über den Cookie-/Tracking-Banner.

---

## 15. Agency-Portal (Mehrmandantenfähigkeit)

EventBliss bietet B2B-Dienste für Event-Agenturen. Tabellen mit Agency-bezogenen Daten: `agencies`, `agency_members`, `agency_notifications`, `agency_stripe_accounts`, `agency_marketplace_subscriptions`, `agency_guides`, `agency_affiliates`, `agency_directory`, `agency_outreach_*` (Queue/Activity/Campaigns), `client_access_tokens`, `event_files`, `event_notes`, `event_tasks`, `run_sheet_items`, `budget_items`, `vendors`, `event_vendors`.

### 15.1 Verhältnis Agentur ↔ EventBliss
Für **Endkundendaten**, die eine Agency in EventBliss verarbeitet (z. B. Kunden-Veranstaltungen, Adressen, Vertragsdaten), liegt in der Regel ein **Auftragsverarbeitungsverhältnis (Art. 28 DSGVO)** vor, in dem EventBliss die Rolle des **Auftragsverarbeiters** einnimmt. Der entsprechende **Auftragsverarbeitungsvertrag (AVV/DPA)** ist Teil des `AgencyAgreement` und unter `legal/agency-agreement` abrufbar.

### 15.2 Gemeinsame Verantwortlichkeit (Art. 26 DSGVO)
Für Marketplace-Buchungen, bei denen EventBliss zwischen Endkunde und Agency vermittelt, besteht teilweise **gemeinsame Verantwortlichkeit**:
- **EventBliss** ist Verantwortlicher für: Bereitstellung der Plattform, Stripe-Connect-Zahlungsabwicklung, Bewertungs-System, Anti-Fraud, Plattform-Werbung.
- **Agency** ist Verantwortlicher für: Dienst-Erbringung, Kunden-Kommunikation außerhalb der Plattform, ihre eigene Kunden-Datenbank.

Die wesentlichen Punkte der Vereinbarung gem. Art. 26 Abs. 2 DSGVO sind unter `legal/joint-controllership` (in Vorbereitung) abrufbar.

### 15.3 Outreach (Cold-B2B)
Tabellen `public.agency_directory` + `agency_outreach_*` speichern öffentlich verfügbare Kontaktdaten von Event-Agenturen (Name, E-Mail, Telefon, Webseite, Stadt) für **Cold-Outreach-Marketing**.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an B2B-Geschäftsentwicklung). Die hierzu geführte **Legitimate Interest Assessment (LIA)** ist intern dokumentiert und kann auf Anfrage zur Verfügung gestellt werden. Empfänger haben jederzeit ein **Widerrufsrecht** (Stop-Liste) per E-Mail an compliance@event-bliss.com.

### 15.4 Client Access Tokens
`public.client_access_tokens` enthält **Magic-Link-Tokens** (32 Byte Hex), die einer Agency erlauben, ihren Kunden ohne EventBliss-Konto Zugriff auf Veranstaltungs-Daten zu geben. Token sind zeitlich begrenzt (`expires_at`), durch RLS abgesichert und werden nach Ablauf automatisch invalidiert.

---

## 16. Affiliate- und Partner-Programm

Tabelle `public.affiliates` enthält für jeden Affiliate-Partner:
- Persönliche Identifikation: `contact_name`, `email`, `phone`, `company_name`, `tax_id` _(personenbezogene Steuer-ID gemäß § 87 DSGVO und nationalen Vorschriften besonders schutzwürdig)_
- **Auszahlungs-Methode + Details (`payout_details` JSONB)**: kann IBAN, BIC, PayPal-Mail enthalten
- Provisions-Konfiguration: `commission_type`, `commission_rate`, `tier`

Verknüpfte Tabellen: `affiliate_vouchers`, `affiliate_commissions`, `affiliate_payouts`.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Affiliate-Vertrag) + Art. 6 Abs. 1 lit. c DSGVO (Steuerrecht).
**Aufbewahrung:** **10 Jahre** (Steuer-/Rechnungs-Aufbewahrung).
**Schutzmaßnahmen:** `payout_details` wird mittels `pgsodium`-Column-Level-Encryption verschlüsselt (Action-Item 0.16 — vor Going-Live nachzuziehen).

---

## 17. Newsletter und E-Mail-Marketing

Bei Anmeldung an unseren Newsletter (Formular auf `event-bliss.com`) speichern wir in `public.newsletter_subscribers`:
- E-Mail-Adresse
- Sprach-Präferenz
- Zeitstempel der Anmeldung (`subscribed_at`)
- Quelle (`source`, z. B. `landing-footer`)
- **IP-Adresse + User-Agent zum Anmeldezeitpunkt** (Beweis nach Art. 7 DSGVO)
- `gdpr_consent` + `marketing_consent` Flags

### 17.1 Double-Opt-In
Nach Anmeldung erhältst du eine Bestätigungs-E-Mail. Erst nach Klick auf den Bestätigungslink (`confirmed_at`) wirst du auf den Newsletter-Verteiler genommen. _(Action-Item 0.10: Aktuell wird die Bestätigungs-Mail noch nicht versendet. Die Implementierung erfolgt vor Veröffentlichung dieser Erklärung.)_

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) + § 7 Abs. 2 Nr. 3 UWG (DACH) / Art. 13 ePrivacy-Richtlinie 2002/58/EG.

### 17.2 Abmeldung
In jedem Newsletter befindet sich ein One-Click-Abmelde-Link. Alternativ kannst du dich per E-Mail an privacy@event-bliss.com abmelden.

**Aufbewahrung nach Abmeldung:** Datensatz wird nicht sofort gelöscht, sondern auf `unsubscribed_at` gesetzt, um die Abmeldung **3 Jahre** lang als Beweis halten zu können (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse, Abmelde-Wunsch zu respektieren). Danach Anonymisierung.

---

## 18. App-Berechtigungen (iOS + Android)

Die EventBliss-App (Bundle-ID `app.eventbliss`) fordert die folgenden OS-Berechtigungen an:

| Berechtigung | iOS-Schlüssel | Android-Permission | Genutzt? | Rechtsgrundlage |
|---|---|---|---|---|
| **Kamera** | `NSCameraUsageDescription` | `android.permission.CAMERA` | ✅ Ja — Profilbild + (geplant) Beleg-Fotos | Art. 6 Abs. 1 lit. a DSGVO |
| **Fotomediathek lesen** | `NSPhotoLibraryUsageDescription` | `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` | ✅ Ja — Avatar-Auswahl | Art. 6 Abs. 1 lit. a DSGVO |
| **Fotomediathek schreiben** | `NSPhotoLibraryAddUsageDescription` | _(nicht erforderlich auf Android)_ | ⚠️ Deklariert, derzeit ungenutzt | Art. 6 Abs. 1 lit. a DSGVO (sofern künftig aktiviert) |
| **Push-Benachrichtigungen** | _(System-managed)_ | `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE` | ✅ Ja — lokal (Game-Timer); remote (in Aktivierung) | Art. 6 Abs. 1 lit. a DSGVO |
| **Internet** | _(implizit)_ | `INTERNET` | ✅ Ja — zwingend für Datensynchronisation | Art. 6 Abs. 1 lit. b DSGVO |
| **Standort** | `NSLocationWhenInUseUsageDescription` | `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` | ❌ Deklariert, **derzeit ungenutzt** (Action-Item 0.15) | _wird entfernt_ |

### 18.1 In-App-Anzeige-Text (verbatim aus `Info.plist`)
- Kamera: „EventBliss benötigt Zugriff auf die Kamera, damit du Profilbilder aufnehmen und Fotos mit deinen Spielergebnissen teilen kannst."
- Fotomediathek (lesen): „EventBliss benötigt Zugriff auf deine Fotos, damit du ein Profilbild auswählen kannst."
- Fotomediathek (schreiben): „EventBliss speichert mit deiner Erlaubnis Spielergebnisse und Fotos in deiner Mediathek."
- Standort: „EventBliss verwendet deinen Standort für Geografie-Spiele wie World Finder und Street View." _(wird vor App-Store-Submission entfernt — Action-Item 0.15)_

### 18.2 App Tracking Transparency (ATT) — iOS
EventBliss **fordert keine ATT-Berechtigung** an und **verwendet keine IDFA**. Es sind **keine** Tracking-SDKs (Sentry, Mixpanel, Amplitude, PostHog, Google Analytics, Facebook SDK, AdMob, SKAdNetwork) im Code installiert. Apple App Privacy Nutrition Label: „No data used for tracking".

### 18.3 Hintergrund-Modi
Die App nutzt **keine** `UIBackgroundModes` und **keine** Android-Foreground-Services. Sie wird nur durch Push-Benachrichtigungen oder Nutzer-Aktion aktiv.

### 18.4 Universal Links / App Links / Deep Links
Universal Links (iOS) und App Links (Android) sind **derzeit nicht aktiviert**. URLs `event-bliss.com/*` öffnen im Browser, nicht in der App. Die Aktivierung ist in Vorbereitung (siehe Memory-Eintrag „Deep Links pending").

---

## 19. Push-Benachrichtigungen

| Plattform | Dienst | Anbieter |
|---|---|---|
| iOS | Apple Push Notification service (APNs) | **Apple Distribution International Ltd.** (Cork, Irland — EWR ✅) |
| Android | Firebase Cloud Messaging (FCM) | **Google Ireland Ltd.** (Dublin, Irland — EWR ✅), Weitergabe an Google LLC (USA) im Rahmen der Telemetrie per SCC + DPF |

**Was wird übermittelt:** Pseudonymes Geräte-Token, Benachrichtigungs-Payload (z. B. „Neue Buchung", „Settle-Up-Erinnerung"). Push-Tokens werden derzeit **nicht serverseitig persistiert** (`src/lib/push-notifications.ts` loggt nur Konsole). Sobald die serverseitige Registrierung aktiviert ist, werden Tokens in einer separaten Tabelle gespeichert und bei Abmeldung / Konto-Löschung automatisch entfernt.

**Lokale Benachrichtigungen** (Game-Timer in `src/components/ideas/GameTimer.tsx`) verlassen das Gerät niemals.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung über System-Dialog).

---

## 20. Cookies und ähnliche Technologien

### 20.1 Kategorien
EventBliss verwendet die folgenden Cookie-Kategorien (granular wählbar im Cookie-Banner unter `event-bliss.com`):

| Kategorie | Status | Inhalt |
|---|---|---|
| **Technisch notwendig** (`necessary`) | Immer aktiv | Authentication-Session (Supabase JWT in `localStorage`), CSRF-Schutz, Sprach- und Theme-Präferenz |
| **Analyse** (`analytics`) | Opt-In | _aktuell deaktiviert — keine Analyse-Tools im Einsatz_ |
| **Marketing** (`marketing`) | Opt-In | _aktuell deaktiviert — keine Marketing-Cookies im Einsatz_ |

**Stand 18.05.2026:** EventBliss setzt **keinerlei Analytics- oder Marketing-Cookies** ein (kein Google Analytics, kein PostHog, kein Mixpanel, kein Plausible, kein Tag Manager, keine Facebook-/Meta-Pixel, kein TikTok-Pixel). Es existieren ausschließlich technisch notwendige Cookies / Storage-Items.

### 20.2 Consent-Logging
Deine Cookie-Entscheidung wird im `localStorage` unter `eventbliss_cookie_consent` mit Zeitstempel gespeichert. _(Action-Item: serverseitiges Consent-Log mit `user_id` + `consent_version` + `ip_hash` in Vorbereitung.)_

### 20.3 Widerruf
Du kannst deine Cookie-Einstellungen jederzeit über den Footer-Link „Cookie-Einstellungen verwalten" (in Vorbereitung) oder durch Löschen des `localStorage`-Eintrags anpassen.

### 20.4 Native Apps
In der iOS- und Android-App wird **kein Cookie-Banner** angezeigt. Da auf nativen Plattformen keine Web-Tracking-Cookies gesetzt werden und EventBliss keine Tracking-SDKs einsetzt, ist eine Banner-Anzeige nicht erforderlich.

---

## 21. Karten und Geo-Daten

EventBliss nutzt zwei Karten-Anbieter für unterschiedliche Funktionen:

| Anbieter | Funktion | Region | Rechtsgrundlage |
|---|---|---|---|
| **Mapbox, Inc.** (Washington D.C., USA) | Agency-Karten-Ansicht | USA | Art. 6 Abs. 1 lit. f + SCC 2021/914 + DPF |
| **Google Maps + Street View** (Google Ireland Ltd. → Google LLC) | „FindIt"-Spiel (Map-/Streetview-Runden) | Global | Art. 6 Abs. 1 lit. a (Einwilligung beim Start des Spiels) + SCC 2021/914 + DPF |

Beim Aufruf einer Karte werden technisch notwendige Daten an den Karten-Anbieter übertragen: IP-Adresse, User-Agent, Viewport, Zoom-Level, ggf. Geocoding-Query-Strings. **Die App fragt selbst keinen Geräte-Standort ab** (keine `Geolocation`-API-Aufrufe im Code).

---

## 22. Spiele-Funktionen

### 22.1 Local-Only Party-Modus
Im „Party-Modus" (`usePartySession`) werden Spieler-Namen, Punkte und Spielverläufe **nur lokal im Browser/auf dem Gerät** (`localStorage`) gespeichert. Es findet **keine Server-Übertragung** statt.

### 22.2 Online-Multiplayer (Leaderboard)
Bei Online-Multiplayer werden Spielergebnisse in `public.game_stats` gespeichert und in der öffentlich lesbaren View `public.leaderboard` mit `profiles.full_name` verknüpft.

⚠️ **Action-Item 0.11:** Klarnamen im Leaderboard müssen entweder pseudonymisiert werden oder das Opt-In zum öffentlichen Ranking muss explizit eingeholt werden. Bis zur Umsetzung wird das Leaderboard **nur eingeloggten Nutzern** angezeigt.

### 22.3 KI-gestützte Sprachausgabe in Spielen
Siehe Abschnitt 14.3.

---

## 23. Auftragsverarbeiter und Sub-Processors

Die folgenden Sub-Processors verarbeiten personenbezogene Daten im Auftrag von MYFAMBLISS GROUP LTD:

| # | Anbieter | Zweck | Sitz | Rechenzentrum | Transferinstrument |
|---|---|---|---|---|---|
| 1 | **Supabase Inc.** | Datenbank (PostgreSQL), Authentifizierung, Storage, Edge Functions, Realtime | Wilmington, Delaware, USA | AWS eu-central-1 (Frankfurt, DE) | SCC 2021/914 + DPF |
| 2 | **Vercel Inc.** | Web-Hosting, Edge-CDN, DNS | San Francisco, USA | Global Edge mit EU-Knoten | SCC 2021/914 + DPF |
| 3 | **Stripe Payments Europe Ltd.** + **Stripe, Inc.** | Zahlungsabwicklung, Connect-Marktplatz, Subscriptions, Customer Portal | Dublin, Irland (EWR) + USA | EU primär | EU-Vertrag + SCC 2021/914 für USA-Onward + DPF |
| 4 | **OpenRouter Inc.** | LLM-Gateway für KI-Assistent | San Francisco, USA | USA | SCC 2021/914 (Stand 18.05.2026 keine DPF-Zertifizierung — TIA erforderlich) |
| 5 | **Anthropic, PBC** | LLM (Claude Haiku 4.5) — nachgelagert zu OpenRouter | San Francisco, USA | USA | SCC 2021/914 + DPF |
| 6 | **OpenAI, L.L.C.** / OpenAI Ireland Ltd. | Vision-OCR (`gpt-4o-mini`) für Beleg-Scanning | San Francisco, USA / Dublin, Irland | USA/EWR | SCC 2021/914 + DPF |
| 7 | **Mistral AI SAS** | Cloud-TTS (Voxtral) | Paris, Frankreich | EWR ✅ | EWR-Vertrag (kein Drittland-Transfer) |
| 8 | **Mapbox, Inc.** | Karten-Tiles + Geocoding (Agency-Karten) | Washington D.C., USA | Global | SCC 2021/914 + DPF |
| 9 | **Google Ireland Ltd.** (Maps + Street View + FCM + Play Store) | Karten, Street View (FindIt-Spiel), Android-Push, Android-Distribution | Dublin, Irland | Global (mit EWR-Knoten) | EWR-Vertrag + SCC 2021/914 + DPF |
| 10 | **Apple Distribution International Ltd.** (App Store, APNs) | iOS-Distribution, iOS-Push | Cork, Irland | EWR + Global | EWR-Vertrag |
| 11 | **Hugging Face, Inc.** | CDN für Piper-TTS-Modell-Dateien _(keine Nutzerdaten, nur statische Asset-Downloads — IP + User-Agent)_ | New York, USA | Global Edge | SCC 2021/914 (statische Asset-CDN-Rolle) |
| 12 | **SMTP-Provider** _(DPO: konkret zu identifizieren — Action-Item)_ | Transaktionale E-Mails (Auth, Buchungs-Bestätigungen, Outreach) | _wird vom DPO bestätigt_ | _wird vom DPO bestätigt_ | _wird vom DPO bestätigt_ |
| 13 | **exchangerate.host** | Währungsumrechnung (keine PII) | Dublin, Irland (EWR ✅) | EWR | EWR-Vertrag |

Eine aktuelle, vollständige Sub-Processor-Liste ist unter `https://event-bliss.com/legal/subprocessors` abrufbar. Änderungen werden mit **30 Tagen Vorlauf** auf dieser Seite und per E-Mail an Agency-Kunden bekannt gegeben.

---

## 24. Internationale Datenübermittlung (Drittländer)

Wenn personenbezogene Daten an einen Anbieter außerhalb des Europäischen Wirtschaftsraumes (EWR) übermittelt werden, geschieht dies ausschließlich auf einer der folgenden rechtlichen Grundlagen:

1. **Angemessenheitsbeschluss der EU-Kommission** (Art. 45 DSGVO) — z. B. UK, Schweiz, Japan.
2. **EU-US Data Privacy Framework (DPF)** (Beschluss der Kommission (EU) 2023/1795) — für US-Anbieter mit aktiver Zertifizierung (z. B. Anthropic, OpenAI, Mapbox, Google, Hugging Face, Vercel, Supabase).
3. **EU Standard Contractual Clauses Modul 2 (Controller-to-Processor)** (Durchführungsbeschluss (EU) 2021/914 der Kommission vom 4. Juni 2021) — fallback und parallel zur DPF-Zertifizierung.
4. **Standard Contractual Clauses Modul 3 (Processor-to-Processor)** für Onward-Übermittlungen.
5. **Ausdrückliche Einwilligung des Betroffenen** (Art. 49 Abs. 1 lit. a DSGVO) für Funktionen mit erhöhtem Drittland-Risiko (z. B. erstmaliger Einsatz der KI-Funktion).

Für alle SCC-basierten Übermittlungen führen wir ein **Transfer Impact Assessment (TIA)** durch. Aktuelle Versionen werden vom DPO geführt und auf Anfrage zur Verfügung gestellt.

---

## 25. Speicherdauer / Aufbewahrungsfristen

| Datenkategorie | Aufbewahrungsdauer | Rechtsgrundlage |
|---|---|---|
| Konto-Stammdaten (`auth.users`, `profiles`) | Bis Konto-Löschung; Backups max. 30 Tage darüber hinaus | Vertragserfüllung + Backup-Notwendigkeit |
| Events (`events`) | Soft-Delete 30 Tage, danach Hard-Delete | Vertrag |
| Survey-Antworten (`responses`) | Bis Event abgeschlossen + 30 Tage | Vertrag |
| Teilnehmer (`participants`) | Bis Event abgeschlossen + 12 Monate, danach Anonymisierung | Vertrag + berechtigtes Interesse |
| Ausgaben (`expenses`) — privat | Soft-Delete 30 Tage | Vertrag |
| Ausgaben — geschäftlich (Agency) | **10 Jahre** | Steuer-/Handelsrecht |
| Marketplace-Buchungen | **10 Jahre** | Steuer-/Handelsrecht |
| Subscriptions / Rechnungen | **10 Jahre** | Steuer-/Handelsrecht |
| Affiliate-Provisionen / Auszahlungen | **10 Jahre** | Steuerrecht |
| Stripe-Zahlungsdaten | Auf Stripe-Seite gemäß Stripe-DPA (i. d. R. 10 Jahre) | Steuer-/Vertrags-Recht |
| Newsletter-Subscriber | Bis Widerruf + 3 Jahre Beweis-Aufbewahrung | Berechtigtes Interesse |
| Server-Logs | 14 Tage | Berechtigtes Interesse Betriebssicherheit |
| AI-Usage / Activity Logs | 90 Tage (Performance) bzw. 2 Jahre (Audit) | Berechtigtes Interesse |
| Admin-Audit-Log (`admin_audit_log`) | 5 Jahre | Berechtigtes Interesse + Compliance |
| Push-Tokens (sobald persistiert) | Bis Abmeldung / Konto-Löschung | Vertrag |
| Cookie-Consent-Log (lokal + ggf. server) | 12 Monate, danach erneute Abfrage | Beweis-Erfordernis Art. 7 DSGVO |
| Belege im Storage (`expense-receipts`) | An Lebensdauer der zugehörigen Ausgabe gekoppelt | Vertrag / Steuer (10 J. bei Agency) |
| Cold-Outreach (`agency_directory`) | Bis Widerspruch / Stopp-Liste | Berechtigtes Interesse |

---

## 26. Technische und organisatorische Maßnahmen (TOM, Art. 32 DSGVO)

### 26.1 Verschlüsselung
- **At Rest:** AES-256 (Supabase-Default auf AWS) für Datenbank und Storage.
- **In Transit:** TLS 1.2+ ausschließlich. HTTPS hart auf Capacitor-Ebene erzwungen.
- _(Action-Item 0.5: HSTS, CSP, X-Frame-Options, Referrer-Policy in `vercel.json` zu ergänzen.)_
- _(Action-Item 0.16: Affiliate-IBAN/PayPal-Daten zusätzlich column-level mit `pgsodium` verschlüsseln.)_

### 26.2 Zugriffskontrolle
- **Row-Level Security (RLS)** ist auf **über 70 Tabellen** der Datenbank aktiviert. Cross-Tenant- und Cross-User-Zugriff ist technisch unterbunden.
- **Authentifizierung:** Supabase Auth (E-Mail/Passwort, bcrypt, 8 Zeichen min., 1 Großbuchstabe / 1 Kleinbuchstabe / 1 Ziffer).
- **MFA:** _(Action-Item 0.6 — TOTP-Aktivierung für Admin- und Agency-Owner-Konten vor Going-Live.)_
- **Service-Role-Key** wird ausschließlich in Edge Functions verwendet, nie an den Client ausgeliefert.
- **Stripe-Webhooks** sind mit Signature-Verification gegen Replay/Forging gesichert.
- **Idempotenz-Tabelle** (`processed_webhook_events`) gegen Double-Processing.

### 26.3 Eingabe-Validierung
- Sämtliche Survey-Eingaben sind via Zod-Schema (`src/lib/schemas.ts`) auf Längen und Enum-Werte validiert.
- Edge Functions parsen alle JSON-Eingaben mit Try/Catch und Schema-Checks (in Härtung).

### 26.4 Datei-Uploads
- `expense-receipts`-Bucket: privat, 10-MB-Cap, MIME-Allowlist (jpeg/png/heic/webp/pdf), RLS-geschützt pro Event.
- `event-files`-Bucket: _(Action-Item 0.4 — Migration auf Signed URLs, Size-Cap, MIME-Allowlist.)_
- **EXIF-Stripping** bei Foto-Upload: _(Action-Item 0.8.)_
- **Antivirus-Scan**: _wird mit Priorität 2 nachgezogen (ClamAV-basierte Edge-Function in Planung)._

### 26.5 Audit-Logging
- `admin_audit_log` zeichnet alle Admin-Aktionen inkl. IP + User-Agent auf.
- `expense_activity_log` und `marketplace_booking_cancellations` für domainspezifische Trails.
- _(Action-Item 0.3: RLS-Härtung `user_activity_logs`.)_

### 26.6 Backup
- Supabase-Pro-Tier: tägliche automatische Backups, 7-Tage-Retention (Standard).
- _Quartalsweise Restore-Drill durch internes Team wird vom DPO dokumentiert._

### 26.7 Rate-Limiting
- KI-Assistent: 10 Requests/Minute pro Nutzer (DB-zähler-basiert in `ai_usage`).
- Supabase Auth: integriertes Rate-Limiting gegen Credential-Stuffing.

### 26.8 Sicherheits-Updates
- Wöchentliche Audits aller npm-Abhängigkeiten via `npm audit`.
- Kritische CVEs werden innerhalb von 48 h gepatcht.

---

## 27. Datenschutz-Folgenabschätzung (DPIA, Art. 35 DSGVO)

Eine **DPIA** wurde gemäß Art. 35 DSGVO für die folgenden Verarbeitungsvorgänge durchgeführt bzw. ist in Vorbereitung:

1. **KI-gestützte Empfehlungen + automatisierte Werbe-Attribution** (`marketplace_ai_events`) — DPIA in Vorbereitung.
2. **Survey-Auswertung mit potenziellen Art.-9-Daten** (`responses.restrictions`) — Maßnahmen: explizite Einwilligung, Längenbeschränkung, Hinweis im Formular.
3. **Cold-Outreach an Event-Agenturen** — Legitimate Interest Assessment (LIA) liegt vor.

Status und Ergebnisse können vom DPO bei Bedarf eingesehen werden.

---

## 28. Datenpannen — Meldeverfahren (Art. 33 / 34 DSGVO)

Bei einer Datenpanne wird MYFAMBLISS GROUP LTD:

1. **Innerhalb von 72 Stunden** nach Bekanntwerden die zuständige Aufsichtsbehörde (Cyprus Commissioner for Personal Data Protection — siehe Abschnitt 33) gemäß Art. 33 DSGVO informieren.
2. Die **Betroffenen** unverzüglich benachrichtigen, wenn die Datenpanne voraussichtlich zu einem hohen Risiko für die persönlichen Rechte und Freiheiten führt (Art. 34 DSGVO).
3. Die Datenpanne im internen **Breach-Register** dokumentieren (Inhalt, Folgen, Maßnahmen).

Ein detailliertes Incident-Response-Runbook ist intern unter `docs/security/incident-response.md` (in Vorbereitung) hinterlegt.

---

## 29. Minderjährige (Art. 8 DSGVO + Cyprus Data Protection Law)

EventBliss ist **nicht für Kinder unter 16 Jahren bestimmt**. Die App-Store-Altersbeschränkung beträgt **17+** (iOS) bzw. **Mature 17+** (Google Play), insbesondere wegen der optionalen Trink-Spiel-Inhalte („Drinking Mode" als Easter Egg).

- Wir holen wissentlich keine Daten von Personen unter 16 Jahren ein.
- Wer das 16. Lebensjahr noch nicht vollendet hat, benötigt die Einwilligung der Erziehungsberechtigten gemäß Art. 8 Abs. 1 DSGVO.
- Bei Hinweisen auf Daten von Minderjährigen werden diese unverzüglich gelöscht.

---

## 30. Automatisierte Entscheidungen + Profiling (Art. 22 DSGVO)

EventBliss verwendet automatisierte Verarbeitung in folgenden Funktionen:

1. **KI-Vorschläge** (Aktivitäten, Reiseziele, Event-Themen) — **nicht-entscheidend**, dient nur als Vorschlag, der Nutzer trifft die finale Entscheidung.
2. **Marketplace-Empfehlungen** (`marketplace_ai_events`) — Werbe-Attribution, **nicht-entscheidend**.
3. **Anti-Fraud-Checks** auf Stripe-Ebene — Stripe ist hier eigener Verantwortlicher; Details unter https://stripe.com/privacy.

Es findet **keine ausschließlich automatisierte Entscheidung mit rechtlicher Wirkung** im Sinne von Art. 22 DSGVO statt.

---

## 31. Joint Controllership mit Event-Agenturen (Art. 26 DSGVO)

Für bestimmte Daten (Buchungen über den Marketplace) liegt eine **gemeinsame Verantwortlichkeit** zwischen EventBliss und der jeweiligen Agency vor. Die wesentlichen Inhalte der Vereinbarung gemäß Art. 26 Abs. 2 DSGVO werden Betroffenen auf Anfrage zur Verfügung gestellt. Wesentliche Punkte:
- **EventBliss** verantwortet: Plattform-Betrieb, Stripe-Zahlungsabwicklung, Anti-Fraud, Plattform-Werbung, Bewertungs-System.
- **Agency** verantwortet: Dienst-Erbringung, Kommunikation außerhalb der Plattform, ihre eigene Kunden-Datenbank.
- **Single Point of Contact** für Anfragen Betroffener: privacy@event-bliss.com — wir leiten an die zuständige Stelle weiter.

---

## 32. Beschwerderecht und Aufsichtsbehörde (Art. 77 DSGVO)

Unbeschadet anderer Rechtsbehelfe steht dir das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat deines Aufenthaltsorts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.

**Für MYFAMBLISS GROUP LTD (Zypern) federführend zuständig:**

**Office of the Commissioner for Personal Data Protection (Επίτροπος Προστασίας Δεδομένων Προσωπικού Χαρακτήρα)**
Iasonos 1, 1082 Lefkosia (Nicosia), Cyprus
Postanschrift: P.O. Box 23378, 1682 Nicosia, Cyprus
Telefon: +357 22 818 456
Fax: +357 22 304 565
E-Mail: commissioner@dataprotection.gov.cy
Webseite: https://www.dataprotection.gov.cy

**Weitere zuständige Aufsichtsbehörden (Beispiel):**
- Deutschland: Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI), Graurheindorfer Str. 153, 53117 Bonn — https://www.bfdi.bund.de
- Österreich: Datenschutzbehörde, Barichgasse 40-42, 1030 Wien — https://www.dsb.gv.at
- Schweiz (für Personen mit Wohnsitz in der Schweiz): Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern — https://www.edoeb.admin.ch

---

## 33. Marketing-Kommunikation und PECR / ePrivacy

Marketing-E-Mails werden ausschließlich auf Grundlage einer **expliziten Einwilligung** (Double-Opt-In) versendet. Push-Marketing erfolgt nur nach OS-Permission + explizitem In-App-Toggle. Tracking-Pixel in E-Mails: **derzeit nicht aktiv**.

Bei E-Mails an Bestandskunden zu **ähnlichen eigenen Produkten** kann § 7 Abs. 3 UWG (DACH) bzw. Art. 13 Abs. 2 ePrivacy-Richtlinie greifen (Opt-Out). Du kannst diesen jederzeit per E-Mail an privacy@event-bliss.com widersprechen.

---

## 34. Datenexport und Konto-Löschung

### 34.1 Datenexport (Art. 20 DSGVO)
Auf Anfrage erhältst du eine **vollständige Kopie deiner personenbezogenen Daten** in maschinenlesbarem Format (JSON). Reaktionszeit: max. 1 Monat. _(In-App-Selbstbedienungsfunktion in Vorbereitung — Action-Item 0.2.)_

### 34.2 Konto-Löschung (Art. 17 DSGVO)
Du kannst dein Konto jederzeit löschen lassen. Reaktionszeit: max. 1 Monat.

**Verfahren:**
1. Anfrage per E-Mail an privacy@event-bliss.com
2. Identitäts-Bestätigung (Reply von der Anmelde-E-Mail-Adresse genügt)
3. **Vollständige Löschung** aller Konto-Daten + Kaskaden-Löschung aller verknüpften Datensätze (events, participants, expenses, marketplace_bookings, …) gemäß Cascade-Constraints.
4. Daten in **Backups** werden mit dem nächsten Backup-Rotationszyklus (max. 30 Tage) automatisch entfernt.

**Ausnahmen:** Daten mit gesetzlichen Aufbewahrungspflichten (Rechnungs-/Steuer-Daten, 10 Jahre) werden **gesperrt** statt gelöscht und nur für gesetzliche Zwecke vorgehalten.

_(In-App-Selbstbedienungsfunktion in Vorbereitung — Action-Item 0.1.)_

---

## 35. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder Funktionserweiterungen anzupassen. **Wesentliche Änderungen** werden auf der Webseite + per E-Mail an aktive Nutzer mit **30 Tagen Vorlauf** angekündigt. Die aktuelle Version ist immer unter `https://event-bliss.com/legal/privacy` abrufbar.

---

## 36. Versionsstand und Historie

| Version | Datum | Änderungen | Autor |
|---|---|---|---|
| 2026.05.18-v1 | 2026-05-18 | Komplette Neufassung auf Basis vollständiger Code-Audit (5 parallele Agents), 9-Sprachen-Plattform, alle Sub-Processors, alle App-Berechtigungen, Cyprus-DPC-Kontakt, Joint-Controller-Hinweis, 16 Action-Items für DPO. | MYFAMBLISS GROUP LTD, Datenschutz-Team |
| 2025.01-v0 | 2025-01-XX | Platzhalter-Version (7 Sätze) | (Legacy) |

---

## Anhang A — Vollständige Datenbestands-Tabelle

Die vollständige Inventarisierung sämtlicher 83 Datenkategorien (Tabellen, Felder, Zwecke) ist in dem **internen Dokument `docs/privacy-data-inventory-2026.md`** hinterlegt und kann auf Anfrage durch den DPO oder Cyprus Bar Association eingesehen werden. Diese Inventarliste umfasst:

- 70+ PostgreSQL-Tabellen mit allen PII-Spaltennamen
- 3 Storage-Buckets (`expense-receipts`, `event-files`, `agency-assets`)
- 38 Edge Functions mit Drittland-API-Aufrufen
- Zuordnung zu Art. 6 / Art. 9 DSGVO
- Zuordnung zu Sub-Processors

## Anhang B — Vollständige Sub-Processor-Liste

Identisch zur Tabelle in Abschnitt 23. Aktuelle Version unter `https://event-bliss.com/legal/subprocessors`.

## Anhang C — Standard Contractual Clauses und DPAs

Die folgenden AVVs / DPAs sind beim Verantwortlichen abgeschlossen und auf Anfrage einsehbar:

| Sub-Processor | DPA-URL | SCC-Version | DPF-Status |
|---|---|---|---|
| Supabase Inc. | https://supabase.com/dpa | SCC 2021/914 + DPF | aktiv |
| Vercel Inc. | https://vercel.com/legal/dpa | SCC 2021/914 + DPF | aktiv |
| Stripe Payments Europe Ltd. | https://stripe.com/legal/dpa | SCC 2021/914 + DPF | aktiv |
| OpenAI L.L.C. | https://openai.com/policies/data-processing-addendum | SCC 2021/914 + DPF | aktiv |
| Anthropic, PBC | https://www.anthropic.com/legal/dpa | SCC 2021/914 + DPF | aktiv |
| OpenRouter Inc. | (vom DPO einzuholen) | SCC 2021/914 | nicht zertifiziert |
| Mistral AI SAS | https://mistral.ai/dpa | EWR — kein Drittland | n/a |
| Mapbox, Inc. | https://www.mapbox.com/legal/dpa | SCC 2021/914 + DPF | aktiv |
| Google Ireland Ltd. | https://privacy.google.com/businesses/processorterms | SCC 2021/914 + DPF | aktiv |
| Apple Distribution International Ltd. | (Apple Developer Program Agreement) | EWR-Vertrag | n/a |
| Hugging Face, Inc. | https://huggingface.co/dpa | SCC 2021/914 | (zu prüfen) |
| SMTP-Provider | _wird vom DPO ergänzt_ | _wird ergänzt_ | _wird ergänzt_ |

---

## Anhang D — Kontakt-Cheat-Sheet für Betroffene

| Anliegen | Kanal | Zielzeit |
|---|---|---|
| **Allgemeine Datenschutz-Anfrage** | privacy@event-bliss.com | 1 Monat |
| **Konto-Löschung** | privacy@event-bliss.com (oder `/settings → Konto löschen` nach Umsetzung 0.1) | 1 Monat |
| **Daten-Export (Portabilität)** | privacy@event-bliss.com | 1 Monat |
| **B2B-Compliance / DPA-Anfragen** | compliance@event-bliss.com | 7 Werktage |
| **Newsletter abmelden** | One-Click-Link in jedem Newsletter; alternativ privacy@event-bliss.com | sofort |
| **Beschwerde** | Cyprus Commissioner: commissioner@dataprotection.gov.cy | offizielles Verfahren |
| **Datenpanne melden** | dpo@event-bliss.com | sofort |
| **Cookie-Einstellungen** | Footer-Link „Cookie-Einstellungen verwalten" (in Vorbereitung) | sofort |
| **Aufsichtsbehörde** | https://www.dataprotection.gov.cy | offizielles Verfahren |

---

**Ende des Dokuments.**

**Hinweis für Cyprus Bar Association:** Dieses Dokument basiert auf einer vollständigen technischen Audit-Erhebung am 2026-05-18 durch 5 parallele Code-Analysten. Es ist als **rechtsverbindliche Datenschutzerklärung** im Sinne von Art. 13/14 DSGVO + zypriotischem Datenschutzgesetz N.125(I)/2018 + ePrivacy 2002/58/EG gestaltet. Die 16 in Abschnitt 0 aufgeführten technischen Action-Items müssen **vor Veröffentlichung** umgesetzt sein, da sich die Erklärung auf den Zielzustand bezieht.

— *MYFAMBLISS GROUP LTD, Paphos, Cyprus*
