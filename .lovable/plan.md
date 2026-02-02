

# Plan: Automatischer Modell-Download bei Play + Verbesserte UX

## Problem

Die neuronale TTS (menschlich klingende Stimme) ist zwar implementiert, aber das Modell muss erst manuell heruntergeladen werden (~50MB). Der Nutzer hat wahrscheinlich nicht auf den Download-Button geklickt und hoert daher weiterhin die roboterhafte Browser-Stimme.

---

## 1. Aenderungen an GameAudioPlayer.tsx

### 1.1 Automatischer Download bei Play-Klick

Wenn der Nutzer auf "Play" klickt und eine neuronale Stimme ausgewaehlt ist, wird automatisch das Modell heruntergeladen (falls noch nicht vorhanden) und danach abgespielt.

**Vorher (manuell):**
```text
1. Nutzer waehlt neuronale Stimme
2. Nutzer muss "Herunterladen" klicken
3. Warten auf Download
4. Dann "Play" klicken
```

**Nachher (automatisch):**
```text
1. Nutzer klickt "Play"
2. Modell wird automatisch heruntergeladen (mit Fortschrittsanzeige)
3. Audio startet automatisch nach Download
```

### 1.2 Verbesserte Ladeanzeige

- Zeige waehrend des Downloads einen Spinner mit Prozentangabe
- Zeige nach erfolgreichem Download eine Erfolgsmeldung

### 1.3 Automatisches Fallback entfernen

Aktuell faellt die Logik auf Web Speech API zurueck, wenn das Modell nicht bereit ist. Das soll NICHT passieren - stattdessen soll der Download gestartet werden.

---

## 2. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/ideas/GameAudioPlayer.tsx` | Automatischer Download in handlePlay() |

---

## 3. Implementierungsdetails

### Neue handlePlay() Logik

```text
handlePlay():
  1. Wenn neuronale Stimme UND Modell NICHT geladen:
     → Starte Download mit Fortschrittsanzeige
     → Nach Download: Starte automatisch Wiedergabe
  2. Wenn neuronale Stimme UND Modell geladen:
     → Starte VITS-Wiedergabe sofort
  3. Wenn Standard-Stimme:
     → Nutze Web Speech API
```

### UI-Aenderungen

1. **Download-Button entfernen** - nicht mehr noetig
2. **Play-Button zeigt Ladefortschritt** - waehrend Download
3. **Klarer Status-Text** - "Lade Stimmmodell..." waehrend Download

---

## 4. Uebersetzungs-Updates

Neue/aktualisierte Schluessel fuer de.json und en.json:
- `loadingVoice`: "Lade Stimmmodell..."
- `firstTimeDownload`: "Erster Start: Lade hochwertige Stimme (~50MB)"

---

## 5. Erwartetes Nutzererlebnis

1. Nutzer klickt "Play"
2. Sieht "Lade Stimmmodell... 45%" fuer ca. 10-30 Sekunden (je nach Internet)
3. Audio startet automatisch mit menschlich klingender Stimme
4. Bei weiteren Klicks: Sofortige Wiedergabe (Modell gecacht)

