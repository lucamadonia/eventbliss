

# Plan: Performance-Optimierung der Ideas Hub Seite

## Probleme identifiziert

| Problem | Ursache | Auswirkung |
|---------|---------|------------|
| "Anleitung"-Button reagiert nicht | forwardRef fehlt bei GameCard | AnimatePresence kann Komponente nicht korrekt animieren |
| Seite laedt langsam | 200+ Spiele werden auf einmal gerendert | Hoher Speicherverbrauch und langsames Rendering |
| Seite haengt sich auf | Viele gleichzeitige Animationen | CPU-Ueberlastung durch framer-motion |

---

## 1. GameCard mit forwardRef korrigieren

**Datei:** `src/components/ideas/GameCard.tsx`

Der Konsolenfehler zeigt, dass AnimatePresence versucht, eine Ref an GameCard zu uebergeben, aber die Komponente unterstuetzt das nicht. Das verhindert korrekte Animationen und kann zu fehlerhaftem Verhalten fuehren.

**Aenderung:**
- Komponente mit `React.forwardRef` umschliessen
- Ref an das aeussere motion.div Element weitergeben

---

## 2. Virtualisierung / Lazy Loading einfuehren

**Datei:** `src/components/ideas/GamesLibrary.tsx`

Aktuell werden alle 200+ Spiele auf einmal gerendert. Das verursacht:
- Lange initiale Ladezeit
- Hoher Speicherverbrauch
- Viele gleichzeitige Animationen

**Aenderung:**
- "Mehr laden"-Button statt alle Spiele auf einmal
- Initial nur 12-18 Spiele anzeigen
- Bei Klick weitere 12 Spiele laden
- Animationen bei sichtbaren Karten reduzieren

---

## 3. Animationen optimieren

**Dateien:** `src/components/ideas/GameCard.tsx`, `src/components/ideas/FloatingEmojis.tsx`

**Aenderungen:**
- Tilt-Effekt (rotateY, rotateX) auf Hover reduzieren oder entfernen
- `layout` Animation bei AnimatePresence entfernen (verursacht Reflows)
- FloatingEmojis Anzahl reduzieren (von 15 auf 8)
- CSS `will-change` Eigenschaft nutzen fuer bessere GPU-Nutzung

---

## 4. Detaillierte Implementierung

### 4.1 GameCard.tsx - forwardRef

```text
// Vorher:
export const GameCard = ({ game, onAddToPlanner, index = 0 }: GameCardProps) => {

// Nachher:
export const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  ({ game, onAddToPlanner, index = 0 }, ref) => {
    // ... Komponenten-Code
    return (
      <motion.div ref={ref} ...>
        ...
      </motion.div>
    );
  }
);
GameCard.displayName = "GameCard";
```

### 4.2 GamesLibrary.tsx - Lazy Loading

```text
// Neue States:
const [displayCount, setDisplayCount] = useState(12);

// Gefilterte Spiele begrenzen:
const displayedGames = filteredGames.slice(0, displayCount);
const hasMore = displayCount < filteredGames.length;

// "Mehr laden" Button am Ende der Grid:
{hasMore && (
  <Button onClick={() => setDisplayCount(prev => prev + 12)}>
    Mehr anzeigen ({filteredGames.length - displayCount} weitere)
  </Button>
)}
```

### 4.3 AnimatePresence vereinfachen

```text
// Vorher:
<motion.div layout initial={...} animate={...} exit={...}>

// Nachher:
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
```

### 4.4 FloatingEmojis reduzieren

```text
// In IdeasHub.tsx:
// Vorher:
<FloatingEmojis emojis={floatingEmojis} count={15} />

// Nachher:
<FloatingEmojis emojis={floatingEmojis} count={6} />
```

---

## 5. Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/ideas/GameCard.tsx` | forwardRef hinzufuegen, Animationen vereinfachen |
| `src/components/ideas/GamesLibrary.tsx` | Lazy Loading mit "Mehr laden" Button |
| `src/pages/IdeasHub.tsx` | FloatingEmojis count reduzieren |

---

## 6. Erwartete Verbesserungen

- **Anleitung-Button**: Funktioniert wieder korrekt
- **Initiale Ladezeit**: Von ~200 auf ~12 Karten reduziert
- **Scroll-Performance**: Deutlich fluessiger
- **Speicherverbrauch**: Signifikant reduziert

