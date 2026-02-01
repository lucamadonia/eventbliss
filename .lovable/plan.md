
# Plan: Detaillierte Spiele-Anleitungen erweitern

## Problem

Die aktuellen Spielanleitungen in der Games Library sind zu kurz und oberflächlich. Die meisten Anleitungen bestehen nur aus 1-2 Sätzen und bieten nicht genug Informationen für die Durchführung der Spiele.

**Beispiel (aktuell):**
```
"beer_pong": { 
  "instructions": "Stellt Becher in Dreiecksform auf. Abwechselnd werfen die Teams. Treffer = Gegner trinkt und Becher wird entfernt. Team ohne Becher verliert." 
}
```

**Was fehlt:**
- Detaillierte Schritt-für-Schritt-Anleitung
- Vorbereitung und Setup
- Varianten und Abwandlungen
- Tipps und Tricks
- Häufige Fehler

---

## Lösung

Erweitern aller 70+ Spielanleitungen mit detaillierten Beschreibungen:

### Neue Struktur pro Spiel

Jede Anleitung wird von ~30-50 Wörtern auf ~150-250 Wörter erweitert mit folgenden Abschnitten:

1. **Vorbereitung** - Was wird vor dem Spiel benötigt?
2. **Spielablauf** - Schritt-für-Schritt Erklärung
3. **Regeln** - Wichtige Spielregeln
4. **Varianten** - Alternative Spielweisen
5. **Tipps** - Empfehlungen für mehr Spaß

---

## Beispiel: Erweiterte Anleitung

**Beer Pong (aktuell - 38 Wörter):**
```
"Stellt Becher in Dreiecksform auf. Abwechselnd werfen die Teams. Treffer = Gegner trinkt und Becher wird entfernt. Team ohne Becher verliert."
```

**Beer Pong (erweitert - ~200 Wörter):**
```
**Vorbereitung:** Stellt 10 Becher pro Team in einer Pyramiden-Formation (4-3-2-1) auf beiden Seiten eines langen Tisches auf. Füllt jeden Becher zu etwa einem Drittel mit Bier. Stellt zusätzlich Wasserbecher zum Reinigen der Bälle bereit.

**Spielablauf:** Zwei Teams stehen sich gegenüber. Abwechselnd wirft jeder Spieler einen Tischtennisball und versucht, ihn in einen gegnerischen Becher zu werfen. Trifft der Ball, muss das gegnerische Team den Becher leertrinken und ihn entfernen.

**Regeln:** 
• Bei "On Fire" (2+ Treffer hintereinander) darf weiter geworfen werden
• "Ellbow-Regel": Der Ellbogen darf die Tischkante nicht überqueren
• "Re-Rack": Jedes Team darf 1-2 mal eine Neuformierung der Becher verlangen
• Beide Spieler treffen = Bälle zurück, nochmal werfen

**Varianten:** 
• "Death Cup" - Wer in einen noch vollen Becher trifft, während jemand trinkt, gewinnt sofort
• "Bounce-Shot" - Ein abgeprallter Ball zählt doppelt, darf aber abgewehrt werden

**Tipps:** Übung macht den Meister! Der perfekte Wurf hat einen leichten Bogen. Für alkoholfreie Varianten: Wasser in den Bechern, Shots daneben zum Trinken.
```

---

## Technische Umsetzung

### Zu ändernde Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/i18n/locales/de.json` | Update | ~70 Spielanleitungen erweitern |
| `src/i18n/locales/en.json` | Update | ~70 Spielanleitungen erweitern (Englisch) |

**Hinweis:** Die anderen 8 Sprachen werden vorerst nicht aktualisiert, da sie entweder nur Fallback auf DE/EN nutzen oder separat übersetzt werden müssten.

### UI-Anpassungen

Die `GameCard.tsx` ist bereits für längere Texte vorbereitet:
- ScrollArea für die Anleitung
- Card-Flip Animation für Details
- Copy-Button für Anleitung

**Optional (kleinere Verbesserungen):**
- Markdown-Unterstützung für formatierte Anleitungen (Fett, Listen)
- Abschnitte visuell trennen

---

## Priorisierte Spiele (Phase 1 - Top 30)

Diese Spiele werden zuerst erweitert, da sie am häufigsten genutzt werden:

### JGA-Klassiker (10)
1. Beer Pong
2. Flunkyball
3. Wahrheit oder Pflicht
4. Aufgaben-Bingo
5. Junggesellen-Quiz
6. Trink-Roulette
7. Ich hab noch nie
8. Stadtrallye
9. Kuss-Challenge
10. Klopapier-Brautkleid

### Hochzeitsspiele (10)
11. Schuhspiel
12. Mr & Mrs Quiz
13. Zeitungs-Tanz
14. Braut stehlen
15. Hochzeits-Bingo
16. Polaroid-Gästebuch
17. Jubiläums-Tanz
18. Brautstrauß werfen
19. Ring-Wärmen
20. Kuss-Marathon

### Party & Familie (10)
21. Scharade
22. Activity
23. Tabu
24. Cards Against Humanity
25. Schnitzeljagd
26. Mörderisches Dinner
27. Wikingerschach
28. Sackhüpfen
29. Eierlaufen
30. Reise nach Jerusalem

---

## Aufwand & Zeitplan

| Phase | Inhalt | Spiele | Status |
|-------|--------|--------|--------|
| Phase 1 | Top 30 Spiele | 30 | Zu implementieren |
| Phase 2 | Weitere JGA/Party | 25 | Später |
| Phase 3 | Icebreaker & Team | 15 | Später |

**Geschätzter Aufwand pro Spiel:** ~5-10 Minuten (Recherche + Schreiben)

---

## Erwartetes Ergebnis

Nach der Erweiterung:
- Jede Spielanleitung hat 150-250 Wörter statt 20-50
- Klare Struktur mit Vorbereitung, Ablauf, Regeln, Varianten
- Praktisch umsetzbare Anleitungen für sofortige Nutzung
- Bessere User Experience in der Ideas Hub
