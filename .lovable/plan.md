
# Plan: Bessere TTS mit ElevenLabs Integration

## Problem

Die aktuelle Web Speech API (Browser-TTS) klingt roboterhaft und unnatürlich. Die Stimmenqualität variiert stark je nach Browser und Betriebssystem.

## Lösung

Integration von ElevenLabs TTS für natürliche, hochwertige Sprachausgabe. Der ElevenLabs Connector muss dafür eingerichtet werden.

---

## 1. ElevenLabs Connector einrichten

Der ElevenLabs Connector ist verfügbar und ermöglicht sichere API-Key-Verwaltung:

```text
User → GameAudioPlayer → Edge Function → ElevenLabs API → Audio Stream
```

**Vorteile:**
- Natürliche, menschenähnliche Stimmen
- Unterstützung für alle 10 Sprachen (multilingual v2 Modell)
- Konsistente Qualität auf allen Geräten

---

## 2. Neue Edge Function erstellen

**Datei:** `supabase/functions/game-tts/index.ts`

- Empfängt Text und Sprache vom Frontend
- Ruft ElevenLabs TTS API auf
- Streamt Audio zurück zum Browser
- Verwendet das `eleven_multilingual_v2` Modell für automatische Spracherkennung

---

## 3. Sprachauswahl

| Sprache | Stimme | Voice ID |
|---------|--------|----------|
| Deutsch | Laura | FGY2WhTYpPnrIDTdsKH5 |
| Englisch | Sarah | EXAVITQu4vr4xnSDxMaL |
| Alle anderen | Laura (multilingual) | FGY2WhTYpPnrIDTdsKH5 |

Das multilingual-Modell erkennt automatisch die Sprache des Textes.

---

## 4. GameAudioPlayer aktualisieren

**Datei:** `src/components/ideas/GameAudioPlayer.tsx`

Änderungen:
- Wechsel von Web Speech API zu ElevenLabs Edge Function
- Fetch-Aufruf an `/functions/v1/game-tts`
- Audio-Blob abspielen mit HTML5 Audio API
- Fallback auf Web Speech API wenn ElevenLabs nicht verfügbar

---

## 5. Implementierungsschritte

| Schritt | Aufgabe |
|---------|---------|
| 1 | ElevenLabs Connector verbinden (Approval erforderlich) |
| 2 | Edge Function `game-tts` erstellen |
| 3 | GameAudioPlayer auf ElevenLabs umstellen |
| 4 | Fallback für Web Speech API behalten |
| 5 | Testen in verschiedenen Sprachen |

---

## 6. Kosten-Hinweis

ElevenLabs berechnet nach Zeichen:
- ~$0.18 pro 1000 Zeichen
- Eine Spielanleitung hat ca. 500-1000 Zeichen
- Kosten pro Vorlesen: ca. $0.09-0.18

---

## Technische Details

### Edge Function Struktur

```text
POST /functions/v1/game-tts
Body: { text: string, language: string }
Response: audio/mpeg stream
```

### Voice Settings

- `stability`: 0.5 (natürliche Variation)
- `similarity_boost`: 0.75 (Stimmtreue)
- `model_id`: eleven_multilingual_v2
