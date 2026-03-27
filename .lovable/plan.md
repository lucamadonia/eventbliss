

# Plan: Premium-Account für luca@madonia-freiburg.de erstellen

## Status

Der Benutzer existiert noch nicht in der Datenbank. Er muss zuerst angelegt und dann mit einem Lifetime-Premium-Abo versehen werden.

## Schritte

### 1. Benutzer anlegen
- Über die bestehende Edge Function `create-user` den Account erstellen
- E-Mail: `luca@madonia-freiburg.de`
- Plan: `premium` (Lifetime - ohne Ablaufdatum)
- Ein temporäres Passwort wird gesetzt, das beim ersten Login geändert werden muss

### 2. Lifetime-Premium-Subscription
- Subscription mit `plan: "premium"` und **ohne** `expires_at` (= Lifetime)
- Kein Stripe-Abo nötig, da manuell vergeben

## Technische Details

Ausführung über die `create-user` Edge Function mit anschließendem manuellen Subscription-Insert (da `create-user` ein Ablaufdatum setzt, muss die Subscription danach auf Lifetime aktualisiert werden).

| Aktion | Methode |
|--------|---------|
| User erstellen | Edge Function `create-user` |
| Subscription auf Lifetime setzen | SQL Update: `expires_at = NULL` |

## Hinweis

Du erhältst ein temporäres Passwort, das beim ersten Login geändert werden muss.

