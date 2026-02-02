

# Plan: Neuronale TTS mit VITS-Web + Stimmenauswahl-Dropdown

## Problem

Die Web Speech API klingt roboterhaft und ist nicht mehr zeitgemaess. Die Qualitaet variiert stark je nach Browser und Betriebssystem.

## Loesung

Integration von **VITS-Web** - einer Bibliothek, die neuronale Text-to-Speech direkt im Browser ausfuehrt:
- Kein API-Key erforderlich
- Voellig kostenlos (MIT-Lizenz)
- Menschenaehnliche Stimmen durch neuronale Netzwerke
- Unterstuetzte Sprachen: de, en, es, fr, it, nl, pl, pt, tr (+ Fallback fuer ar)
- Modelle werden einmalig heruntergeladen und lokal gespeichert

---

## 1. Abhaengigkeit installieren

```text
@diffusionstudio/vits-web
```

Diese Bibliothek ermoeglicht ONNX-basierte neuronale TTS im Browser mit Piper-Modellen.

---

## 2. Verfuegbare Stimmen pro Sprache

| Sprache | Voice ID | Qualitaet |
|---------|----------|-----------|
| Deutsch | de_DE-thorsten-high | Hoch |
| Englisch | en_US-hfc_female-medium | Mittel |
| Spanisch | es_ES-sharvard-medium | Mittel |
| Franzoesisch | fr_FR-upmc-medium | Mittel |
| Italienisch | it_IT-riccardo-x_low | Niedrig |
| Niederlaendisch | nl_NL-mls-medium | Mittel |
| Polnisch | pl_PL-darkman-medium | Mittel |
| Portugiesisch | pt_PT-tux-medium | Mittel |
| Tuerkisch | tr_TR-dfki-medium | Mittel |
| Arabisch | Fallback: Web Speech API | - |

---

## 3. GameAudioPlayer erweitern

**Aenderungen:**

1. **Stimmenauswahl-Dropdown hinzufuegen**
   - Zeigt verfuegbare Stimmen fuer die aktuelle Sprache
   - Wechsel zwischen VITS (neural) und Web Speech (fallback)
   - Speichert Nutzer-Praeferenz in localStorage

2. **VITS-Integration**
   - Modell-Download mit Fortschrittsanzeige
   - Caching im Origin Private File System (OPFS)
   - Audio-Blob abspielen mit HTML5 Audio API

3. **Fallback-Strategie**
   - VITS als primaere Engine (wenn Modell verfuegbar)
   - Web Speech API als Fallback (fuer ar oder wenn VITS fehlschlaegt)

---

## 4. Architektur

```text
+------------------+
|  GameAudioPlayer |
+------------------+
         |
    +----+----+
    |         |
    v         v
+-------+  +------------+
| VITS  |  | Web Speech |
| (neu) |  | (fallback) |
+-------+  +------------+
    |
    v
+------------------+
| Lokales Modell   |
| (~50-80MB/Sprache)|
+------------------+
```

---

## 5. UI-Erweiterungen

- **Stimmen-Dropdown**: Kompakt unterhalb der Steuerungen
- **Download-Indikator**: Zeigt Fortschritt beim ersten Laden
- **Qualitaets-Badge**: Zeigt "Neural" vs "Standard" an
- **Modell-Status**: Info ob Modell bereits geladen ist

---

## 6. Technische Details

### VITS-Web Nutzung

```text
// Modell vorladen
await tts.download('de_DE-thorsten-high', onProgress);

// Sprache synthetisieren
const wav = await tts.predict({
  text: "Hallo Welt",
  voiceId: 'de_DE-thorsten-high'
});

// Audio abspielen
const audio = new Audio(URL.createObjectURL(wav));
audio.play();
```

### localStorage Schema

```text
{
  "tts-preferred-voice-de": "de_DE-thorsten-high",
  "tts-preferred-voice-en": "en_US-hfc_female-medium",
  ...
}
```

---

## 7. Implementierungsschritte

| Schritt | Aufgabe |
|---------|---------|
| 1 | @diffusionstudio/vits-web installieren |
| 2 | Voice-Konfiguration mit Mapping je Sprache erstellen |
| 3 | VITS-Integration in GameAudioPlayer einbauen |
| 4 | Stimmenauswahl-Dropdown hinzufuegen |
| 5 | Download-Fortschritt mit Ladebalken anzeigen |
| 6 | localStorage fuer Nutzerpraeferenz |
| 7 | Fallback auf Web Speech API implementieren |

---

## 8. Vorteile gegenueber ElevenLabs

| Aspekt | VITS-Web | ElevenLabs |
|--------|----------|------------|
| Kosten | Kostenlos | ~0.18$/1000 Zeichen |
| API-Key | Nicht noetig | Erforderlich |
| Privatsphaere | Lokal im Browser | Server-seitig |
| Offline | Ja (nach Download) | Nein |
| Qualitaet | Gut (neural) | Sehr gut |

---

## 9. Einschraenkungen

- Erster Download ~50-80MB pro Sprache
- Arabisch (ar) nicht direkt unterstuetzt - nutzt Web Speech API als Fallback
- Etwas langsamere Generierung als ElevenLabs (laeuft lokal)

