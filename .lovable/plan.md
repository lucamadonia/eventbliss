
# Plan: Vollständige Spiele-Bibliothek mit TTS-Vorlesefunktion & Timer

## Übersicht

Dieser Plan umfasst drei Hauptbereiche:
1. **Vollständige Spielanleitungen** mit klarer visueller Trennung der Abschnitte
2. **Text-to-Speech (TTS)** zum Vorlesen der Anleitungen in der jeweiligen Sprache
3. **Spieltimer** mit voreinstellbaren Zeiten und Start/Pause/Reset-Funktionen

---

## 1. Spielanleitungen komplett ergänzen

### 1.1 Formatierung verbessern (alle Sprachen)

Die bestehenden Anleitungen werden visuell besser strukturiert:

| Abschnitt | Icon | Stil |
|-----------|------|------|
| **Vorbereitung** | 📋 | Gelber Hintergrund-Badge |
| **Spielablauf** | 🎮 | Grüner Hintergrund-Badge |
| **Regeln** | 📏 | Blauer Hintergrund-Badge |
| **Varianten** | 🔄 | Lila Hintergrund-Badge |
| **Tipps** | 💡 | Orange Hintergrund-Badge |

### 1.2 Fehlende Sprachen (4 Sprachen)

Übersetzungen für Portugiesisch, Polnisch, Türkisch und Arabisch hinzufügen.

### 1.3 Verbleibende Spiele (~40 Stück)

Alle noch nicht detaillierten Spiele erhalten vollständige Anleitungen (150-250 Wörter).

---

## 2. Text-to-Speech (TTS) Vorlesefunktion

### 2.1 Technische Implementierung

Integration von ElevenLabs TTS für natürliche Sprachausgabe:

```
┌─────────────────────────────────────────────────────────────┐
│                    GameCard (Rückseite)                      │
├─────────────────────────────────────────────────────────────┤
│  🏓 Beer Pong                              [📋] [📤] [🔊]   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📋 Vorbereitung                                      │    │
│  │ Stellt 10 Becher pro Team in Pyramiden-Formation... │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎮 Spielablauf                                       │    │
│  │ Zwei Teams stehen sich gegenüber...                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ... weitere Abschnitte ...                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         🔊 Anleitung vorlesen                        │    │
│  │  ▶️ Start   ⏸️ Pause   ⏹️ Stop   ⏩ Nächster Abschnitt│    │
│  │  ═══════════════════════○────────── 2:34 / 5:12     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [⬅️ Zurück]                              [➕ Zum Planer]   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Sprachauswahl basierend auf i18n

| Sprache | ElevenLabs Voice | Voice ID |
|---------|------------------|----------|
| Deutsch | "Laura" | FGY2WhTYpPnrIDTdsKH5 |
| Englisch | "Sarah" | EXAVITQu4vr4xnSDxMaL |
| Spanisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Französisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Italienisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Niederländisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Polnisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Portugiesisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Türkisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |
| Arabisch | "Laura" (multilingual) | FGY2WhTYpPnrIDTdsKH5 |

Das multilingual-Modell `eleven_multilingual_v2` erkennt automatisch die Sprache.

### 2.3 Edge Function für TTS

Neue Edge Function: `supabase/functions/game-tts/index.ts`

```
User klickt "Vorlesen"
       ↓
Frontend sendet Text + Sprache
       ↓
Edge Function → ElevenLabs API
       ↓
Audio-Stream zurück → Browser spielt ab
```

### 2.4 UI-Komponente: AudioPlayer

Neue Komponente `src/components/ideas/GameAudioPlayer.tsx`:
- Play/Pause/Stop-Buttons
- Fortschrittsbalken
- Lautstärkeregler
- Abschnittsnavigation (optional)

---

## 3. Spieltimer

### 3.1 Timer-Funktionen

```
┌─────────────────────────────────────────────────────────────┐
│                      🎮 SPIEL-TIMER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│     ┌─────────────────────────────────────────┐              │
│     │                                         │              │
│     │              ⏱️ 08:45                   │              │
│     │                                         │              │
│     └─────────────────────────────────────────┘              │
│                                                              │
│     Voreinstellungen:                                        │
│     [5 min] [10 min] [15 min] [20 min] [30 min] [⚙️ Custom] │
│                                                              │
│     ┌────────────────────────────────────────┐               │
│     │  ▶️ Start    ⏸️ Pause    🔄 Reset      │               │
│     └────────────────────────────────────────┘               │
│                                                              │
│     🔔 Benachrichtigung bei Ablauf:  [✓]                    │
│     🔊 Sound bei Ablauf:             [✓]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Timer-Features

- **Voreinstellungen**: 5, 10, 15, 20, 30 Minuten
- **Custom Timer**: Manuelle Eingabe
- **Countdown-Animation**: Kreisförmiger Fortschritt
- **Audio-Alarm**: Sound wenn Timer abläuft
- **Vibration**: Auf Mobilgeräten
- **Vollbild-Modus**: Timer groß anzeigen für die Gruppe
- **Pause/Resume**: Timer pausieren und fortsetzen
- **Reset**: Auf Anfangswert zurücksetzen

### 3.3 Timer-Komponente

Neue Komponente `src/components/ideas/GameTimer.tsx`:
- Standalone nutzbar
- In GameCard integrierbar
- Lokaler State (kein Backend nötig)
- Web Audio API für Alarm-Sound

---

## 4. Betroffene Dateien

### Neue Dateien erstellen

| Datei | Beschreibung |
|-------|--------------|
| `supabase/functions/game-tts/index.ts` | TTS Edge Function |
| `src/components/ideas/GameAudioPlayer.tsx` | Audio-Player UI |
| `src/components/ideas/GameTimer.tsx` | Timer-Komponente |
| `src/components/ideas/GameInstructionsSection.tsx` | Formatierte Abschnitte |

### Bestehende Dateien ändern

| Datei | Änderung |
|-------|----------|
| `src/components/ideas/GameCard.tsx` | Timer + TTS integrieren |
| `src/i18n/locales/de.json` | Fehlende Spiele + Timer/TTS Labels |
| `src/i18n/locales/en.json` | Fehlende Spiele + Timer/TTS Labels |
| `src/i18n/locales/pt.json` | Alle Spielanleitungen |
| `src/i18n/locales/pl.json` | Alle Spielanleitungen |
| `src/i18n/locales/tr.json` | Alle Spielanleitungen |
| `src/i18n/locales/ar.json` | Alle Spielanleitungen |
| `src/i18n/locales/es.json` | Fehlende Spiele ergänzen |
| `src/i18n/locales/fr.json` | Fehlende Spiele ergänzen |
| `src/i18n/locales/it.json` | Fehlende Spiele ergänzen |
| `src/i18n/locales/nl.json` | Fehlende Spiele ergänzen |

---

## 5. ElevenLabs API-Key

Für die TTS-Funktion wird ein ElevenLabs API-Key benötigt:

1. **Connector verwenden**: ElevenLabs Connector für sichere API-Key-Verwaltung
2. **Edge Function**: Ruft ElevenLabs API auf und streamt Audio zurück
3. **Kosten**: ~$0.18 pro 1000 Zeichen (ca. 2-3 Spielanleitungen)

---

## 6. Implementierungsreihenfolge

| Phase | Aufgabe | Priorität |
|-------|---------|-----------|
| 1 | Timer-Komponente erstellen | Hoch |
| 2 | GameCard mit Timer erweitern | Hoch |
| 3 | Instruktionen-Formatierung (visuelle Abschnitte) | Hoch |
| 4 | Fehlende Spiele in DE/EN ergänzen | Mittel |
| 5 | ElevenLabs Connector einrichten | Mittel |
| 6 | TTS Edge Function erstellen | Mittel |
| 7 | AudioPlayer-Komponente | Mittel |
| 8 | Übersetzungen PT/PL/TR/AR | Niedrig |
| 9 | Fehlende Spiele ES/FR/IT/NL | Niedrig |

---

## 7. Geschätzter Umfang

- **Timer-Feature**: ~200 Zeilen Code
- **TTS-Feature**: ~150 Zeilen Edge Function + ~250 Zeilen UI
- **Instruktionen-Formatierung**: ~100 Zeilen
- **Übersetzungen**: ~2000 Zeilen JSON pro Sprache
- **Gesamt**: ~3500 Zeilen neuer Code + Übersetzungen
