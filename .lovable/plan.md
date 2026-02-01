

# Plan: Umfassende Spiele- und Ideen-Bibliothek

## Zusammenfassung

Erstellung einer umfangreichen, mehrsprachigen Bibliothek mit Spielen, Themen und Ideen fur alle Event-Typen der App (JGA, Familie, Hochzeit, Geburtstag, Gruppenreisen, Team-Events).

---

## Neue Dateien

### 1. `src/lib/games-library.ts` - Hauptbibliothek

Neue zentrale Datei mit 300+ Spielen und Ideen, kategorisiert nach:

| Kategorie | Beschreibung | Beispiele |
|-----------|--------------|-----------|
| **jga_games** | JGA-Spiele | Aufgaben-Bingo, Trink-Challenges, Peinliche Aufgaben |
| **family_games** | Familienspiele | Schnitzeljagd, Familien-Quiz, Kooperative Spiele |
| **wedding_games** | Hochzeitsspiele | Schuhspiel, Ehetauglichkeitstest, Hochzeits-Bingo |
| **party_games** | Party-/Trinkspiele | Beer Pong, Kings Cup, Flunkyball |
| **outdoor_games** | Outdoor-Aktivitaten | Kubb, Boccia, Wikingerschach |
| **team_games** | Team-Building | Escape Challenges, Vertrauensubungen |
| **icebreaker** | Kennenlernspiele | 2 Wahrheiten 1 Luge, Speed-Dating |
| **kids_friendly** | Kindertauglich | Sackhupfen, Eierlaufen, Verstecken |
| **themes** | Themen/Mottos | 80er Party, Casino Night, Tropical |

Struktur pro Eintrag:
```typescript
interface GameItem {
  id: string;
  nameKey: string;           // i18n key
  descriptionKey: string;    // i18n key
  emoji: string;
  categories: GameCategory[];
  eventTypes: EventType[];   // bachelor, wedding, family, etc.
  difficulty: 'easy' | 'medium' | 'hard';
  groupSize: { min: number; max?: number };
  duration: string;          // "10-15min", "30min+"
  materials?: string[];      // Benotigte Materialien
  tags: string[];
  isKidsFriendly?: boolean;
  isAlcoholRelated?: boolean;
}
```

### 2. `src/lib/theme-ideas-library.ts` - Themen-Bibliothek

50+ Party-Themen und Mottos:
- 80er/90er Retro Party
- Casino Royale Night
- Tropical Beach Vibes
- Dirndl & Lederhosen
- Superhelden-Party
- Murder Mystery Dinner
- White Party / Black Tie
- Festival-Style
- Oktoberfest
- Mexican Fiesta
- Gatsby / 20er Jahre
- Piraten-Abenteuer
- Wellness-Retreat
- Sports Day
- Game Night Theme

---

## Spielelisten nach Event-Typ

### JGA-Spiele (50+)

**Klassiker:**
- Aufgaben-Bingo (Peinliche Aufgaben in der Stadt)
- Trink-Roulette
- "Wer bin ich?" mit Promi-Paarchen
- Flunkyball
- Beer Pong Turnier
- Junggesellen-Quiz uber Brautigam/Braut
- Wahrheit oder Pflicht (Adults Only)
- Kuss-Challenge
- Selfie-Mission
- Verkleidungs-Aufgaben
- Bucket List abhaken
- Karaoke Battle

**Outdoor-Challenges:**
- Stadtrallye mit Aufgaben
- Foto-Challenge
- Schatzsuche
- Team-Olympiade
- Boot Camp Challenge

**Entspannte Varianten:**
- Cocktail-Mixing Contest
- Wein-Blindverkostung
- Kreativ-Workshop
- Spa-Games

### Familien-Spiele (40+)

**Generationen-ubergreifend:**
- Familien-Feud / Familienduell
- Schnitzeljagd (anpassbar)
- Familien-Bingo
- Memory-Challenge
- Scharade (Pantomime)
- Pictionary / Montagsmaler
- Tabu / Begriffe raten
- Wer wird Millionar (Familien-Edition)
- Familien-Quiz
- Zeitkapsel erstellen

**Outdoor:**
- Sackhupfen
- Eierlaufen
- Dosenwerfen
- Wikingerschach
- Boccia / Boule
- Tauziehen
- Staffellauf
- Wasserbomben-Schlacht

**Kooperativ:**
- Gemeinsam kochen
- Puzzle-Challenge
- Escape Room (Family-friendly)
- Baumhaus bauen
- Lagerfeuer-Geschichten

### Hochzeits-Spiele (35+)

**Klassiker:**
- Schuhspiel (Braut oder Brautigam?)
- Ehetauglichkeitstest
- Hochzeits-Bingo
- Luftballon-Tanzen
- Brautstraus werfen
- Strumpfband-Wurf
- Zeitungs-Tanz
- Kuss-Marathon
- Hochzeits-ABC

**Interaktiv:**
- Gastelotto
- Polaroid-Guestbook-Challenge
- Wunschbaum
- Date-Night-Jar fullen
- Advice Cards schreiben
- "How well do you know the couple?"

**Party:**
- Limbo
- Stuhltanz
- Conga-Line
- Hochzeits-Karaoke

### Party-/Trink-Spiele (25+)

- Beer Pong
- Flunkyball
- Kings Cup / Ring of Fire
- Rage Cage
- Flip Cup
- Power Hour
- Looping Louie (mit Shots)
- Jenga (mit Aufgaben)
- Trink-Bingo
- Schnick-Schnack-Schnuck Turnier
- Quarters
- Wizard Staff

### Kennenlern-Spiele / Icebreaker (20+)

- 2 Wahrheiten, 1 Luge
- Speed-Dating Format
- Bingo-Kennenlernen
- "Find someone who..."
- Gemeinsamkeiten finden
- Story-Cubes
- Namensball
- Wortassoziationen
- Personlichkeits-Quiz

---

## Ubersetzungen (alle 10 Sprachen)

Neue JSON-Struktur in allen Sprachdateien:

```json
{
  "gamesLibrary": {
    "categories": {
      "jga_games": "JGA-Spiele",
      "family_games": "Familienspiele",
      "wedding_games": "Hochzeitsspiele",
      "party_games": "Party-Spiele",
      "outdoor_games": "Outdoor-Spiele",
      "team_games": "Team-Building",
      "icebreaker": "Kennenlernspiele",
      "kids_friendly": "Kinderspiele",
      "themes": "Themen & Mottos"
    },
    "filters": {
      "all": "Alle",
      "eventType": "Event-Typ",
      "difficulty": "Schwierigkeit",
      "groupSize": "Gruppengrose",
      "duration": "Dauer",
      "kidsFriendly": "Kindertauglich",
      "alcoholFree": "Alkoholfrei"
    },
    "games": {
      "bingo_tasks": {
        "name": "Aufgaben-Bingo",
        "description": "Jeder erhalt eine Bingo-Karte mit peinlichen Aufgaben, die in der Stadt erledigt werden mussen."
      },
      "shoe_game": {
        "name": "Schuhspiel",
        "description": "Braut und Brautigam sitzen Rucken an Rucken und beantworten Fragen, indem sie einen Schuh hochhalten."
      }
      // ... 200+ weitere Spiele
    },
    "themes": {
      "80s_retro": {
        "name": "80er Retro Party",
        "description": "Neonfarben, Synthesizer-Musik, Schulterpolster und Aerobic-Outfits"
      }
      // ... 50+ Themen
    }
  }
}
```

**Sprachen:**
- Deutsch (de.json)
- Englisch (en.json)
- Spanisch (es.json)
- Franzosisch (fr.json)
- Italienisch (it.json)
- Niederlandisch (nl.json)
- Polnisch (pl.json)
- Portugiesisch (pt.json)
- Turkisch (tr.json)
- Arabisch (ar.json)

---

## Neue UI-Komponenten

### 1. `src/components/ideas/GamesLibrary.tsx`

Durchsuchbare Spiele-Bibliothek mit:
- Filter nach Kategorie, Event-Typ, Schwierigkeit
- Suchfunktion
- Favoriten-Funktion
- "Zum Planer hinzufugen"-Button
- Detail-Ansicht mit Anleitung

### 2. `src/components/ideas/ThemeIdeasGallery.tsx`

Themen-Galerie mit:
- Visuelle Karten
- Farbpaletten-Vorschlage
- Passende Aktivitaten
- Dekorations-Tipps

### 3. `src/pages/IdeasHub.tsx`

Zentrale Ideen-Seite:
- Tabs: Spiele | Themen | Aktivitaten
- Empfehlungen basierend auf Event-Typ
- Trending/Beliebte Ideen
- Zufallsgenerator

---

## Integration in bestehende Seiten

### Dashboard - Neuer "Ideen"-Tab

```typescript
// In EventDashboard.tsx
<TabsTrigger value="ideas">
  <Lightbulb className="w-4 h-4" />
  {t('dashboard.tabs.ideas')}
</TabsTrigger>
```

### CreateEvent - Themen-Auswahl

Optionale Themen-Auswahl bei Event-Erstellung fur passende Vorschlage.

### AI-Assistent - Spiele-Empfehlungen

Erweiterung des AI-Assistenten um Spiele-Vorschlage basierend auf:
- Event-Typ
- Gruppengrosse
- Praferenzen

---

## Vollstandige Spiele-Liste

### JGA-Spiele (50 Stuck)

| Nr | Spiel | Emoji | Schwierigkeit |
|----|-------|-------|---------------|
| 1 | Aufgaben-Bingo | 📋 | Einfach |
| 2 | Trink-Roulette | 🎰 | Einfach |
| 3 | Wer bin ich? (Promi-Paare) | 🎭 | Einfach |
| 4 | Flunkyball | 🍺 | Mittel |
| 5 | Beer Pong | 🏓 | Einfach |
| 6 | Junggesellen-Quiz | 📝 | Einfach |
| 7 | Wahrheit oder Pflicht | 🔥 | Mittel |
| 8 | Kuss-Challenge | 💋 | Schwer |
| 9 | Selfie-Mission | 📸 | Einfach |
| 10 | Verkleidungs-Aufgaben | 👗 | Mittel |
| 11 | Bucket List Challenge | ✅ | Mittel |
| 12 | Karaoke Battle | 🎤 | Einfach |
| 13 | Stadtrallye | 🗺️ | Mittel |
| 14 | Foto-Schnitzeljagd | 📷 | Mittel |
| 15 | Team-Olympiade | 🏆 | Mittel |
| 16 | Boot Camp Challenge | 💪 | Schwer |
| 17 | Cocktail-Wettbewerb | 🍹 | Einfach |
| 18 | Wein-Blindverkostung | 🍷 | Mittel |
| 19 | T-Shirt bemalen | 👕 | Einfach |
| 20 | Peinliche Lieder singen | 🎵 | Mittel |
| 21 | Dare Dice | 🎲 | Einfach |
| 22 | Never Have I Ever | 🙈 | Einfach |
| 23 | Ring finden (Nudeln) | 🍝 | Einfach |
| 24 | Klopapier-Brautkleid | 🧻 | Einfach |
| 25 | Ballon-Tanz | 🎈 | Einfach |
| 26 | Limbo-Wettbewerb | 🕺 | Einfach |
| 27 | Pinata | 🪅 | Einfach |
| 28 | Mystery Box Challenge | 📦 | Mittel |
| 29 | Challenges aus dem Hut | 🎩 | Mittel |
| 30 | Foto-Booth Challenge | 🖼️ | Einfach |
| 31 | Speeddating-Spiel | ⚡ | Einfach |
| 32 | Wer kennt wen am besten? | 💑 | Einfach |
| 33 | Pantomime | 🎭 | Einfach |
| 34 | Activity | 🎯 | Mittel |
| 35 | Tabu | 🤐 | Mittel |
| 36 | Pictionary | 🎨 | Einfach |
| 37 | Cards Against Humanity | 🃏 | Einfach |
| 38 | Rage Cage | 🍻 | Mittel |
| 39 | Flip Cup | 🥤 | Einfach |
| 40 | Morderisches Dinner | 🔪 | Schwer |
| 41 | Escape Room DIY | 🔐 | Schwer |
| 42 | Casino Night | 🎰 | Mittel |
| 43 | Drag Race | 💄 | Mittel |
| 44 | Dance-Off | 💃 | Mittel |
| 45 | Lip Sync Battle | 👄 | Einfach |
| 46 | Twerk-Wettbewerb | 🍑 | Mittel |
| 47 | Pole Dance Intro | 💃 | Schwer |
| 48 | Strip-Poker (Light) | ♠️ | Schwer |
| 49 | Dirty Minds Quiz | 🧠 | Mittel |
| 50 | Last Night of Freedom | 🌙 | Mittel |

### Familien-Spiele (40 Stuck)

| Nr | Spiel | Emoji | Kindertauglich |
|----|-------|-------|----------------|
| 1 | Familien-Feud | 🏆 | Ja |
| 2 | Schnitzeljagd | 🔍 | Ja |
| 3 | Familien-Bingo | 📋 | Ja |
| 4 | Memory-Challenge | 🧠 | Ja |
| 5 | Scharade | 🎭 | Ja |
| 6 | Pictionary | 🎨 | Ja |
| 7 | Tabu (Family) | 🤐 | Ja |
| 8 | Wer wird Millionar | 💰 | Ja |
| 9 | Familien-Quiz | 📝 | Ja |
| 10 | Zeitkapsel erstellen | 📦 | Ja |
| 11 | Sackhupfen | 🛍️ | Ja |
| 12 | Eierlaufen | 🥚 | Ja |
| 13 | Dosenwerfen | 🥫 | Ja |
| 14 | Wikingerschach | 🪓 | Ja |
| 15 | Boccia | ⚪ | Ja |
| 16 | Tauziehen | 🪢 | Ja |
| 17 | Staffellauf | 🏃 | Ja |
| 18 | Wasserbomben-Schlacht | 💧 | Ja |
| 19 | Gemeinsam kochen | 👨‍🍳 | Ja |
| 20 | Puzzle-Wettbewerb | 🧩 | Ja |
| 21 | Baumhaus bauen | 🏠 | Ja |
| 22 | Lagerfeuer-Geschichten | 🔥 | Ja |
| 23 | Verstecken | 👀 | Ja |
| 24 | Fangen | 🏃 | Ja |
| 25 | Topfschlagen | 🥘 | Ja |
| 26 | Stille Post | 🤫 | Ja |
| 27 | Reise nach Jerusalem | 🪑 | Ja |
| 28 | Schokoladen-Essen | 🍫 | Ja |
| 29 | Wattepusten | ☁️ | Ja |
| 30 | Mumien-Wickeln | 🧻 | Ja |
| 31 | Schatzsuche | 💎 | Ja |
| 32 | Minigolf | ⛳ | Ja |
| 33 | Bowling | 🎳 | Ja |
| 34 | Frisbee | 🥏 | Ja |
| 35 | Drachen steigen | 🪁 | Ja |
| 36 | Seifenblasen-Wettbewerb | 🫧 | Ja |
| 37 | Foto-Safari | 📸 | Ja |
| 38 | Geocaching | 🗺️ | Ja |
| 39 | Basteln | ✂️ | Ja |
| 40 | Talentshow | ⭐ | Ja |

### Hochzeits-Spiele (35 Stuck)

| Nr | Spiel | Emoji | Klassiker |
|----|-------|-------|-----------|
| 1 | Schuhspiel | 👠 | Ja |
| 2 | Ehetauglichkeitstest | 💍 | Ja |
| 3 | Hochzeits-Bingo | 📋 | Ja |
| 4 | Luftballon-Tanzen | 🎈 | Ja |
| 5 | Brautstraus werfen | 💐 | Ja |
| 6 | Strumpfband-Wurf | 👰 | Ja |
| 7 | Zeitungs-Tanz | 📰 | Ja |
| 8 | Kuss-Marathon | 💋 | Ja |
| 9 | Hochzeits-ABC | 🔤 | Ja |
| 10 | Gastelotto | 🎟️ | Nein |
| 11 | Polaroid-Guestbook | 📷 | Nein |
| 12 | Wunschbaum | 🌳 | Nein |
| 13 | Date-Night-Jar | 🫙 | Nein |
| 14 | Advice Cards | 💌 | Nein |
| 15 | Kennenlern-Quiz | 📝 | Nein |
| 16 | Limbo | 🕺 | Nein |
| 17 | Stuhltanz | 🪑 | Ja |
| 18 | Conga-Line | 🐍 | Nein |
| 19 | Hochzeits-Karaoke | 🎤 | Nein |
| 20 | First Dance Game | 💃 | Nein |
| 21 | Mr & Mrs Quiz | 🤵👰 | Ja |
| 22 | Foto-Challenge | 📸 | Nein |
| 23 | Gaste-Interview | 🎙️ | Nein |
| 24 | Love Story vorlesen | 📖 | Nein |
| 25 | Hochzeits-Tombola | 🎁 | Nein |
| 26 | Ring-Warming | 💍 | Nein |
| 27 | Aniversary Dance | 💑 | Ja |
| 28 | Braut stehlen | 🏃‍♀️ | Ja |
| 29 | Brautschuh verstecken | 👟 | Ja |
| 30 | Spardosen-Spiel | 🐷 | Nein |
| 31 | Wetten dass...? | 🎲 | Nein |
| 32 | Songwunsch-Karten | 🎵 | Nein |
| 33 | Polaroid-Schnappschusse | 📷 | Nein |
| 34 | Zeitkapsel | 📦 | Nein |
| 35 | Gratulations-Schlange | 🐍 | Ja |

### Themen & Mottos (50+)

| Nr | Thema | Emoji | Event-Typen |
|----|-------|-------|-------------|
| 1 | 80er Retro | 🕺 | JGA, Geburtstag |
| 2 | 90er Throwback | 📼 | JGA, Geburtstag |
| 3 | Casino Royale | 🎰 | JGA, Geburtstag |
| 4 | Tropical Beach | 🌴 | JGA, Geburtstag, Hochzeit |
| 5 | Dirndl & Lederhosen | 🍺 | JGA, Geburtstag |
| 6 | Superhelden | 🦸 | Geburtstag, Kinder |
| 7 | Murder Mystery | 🔍 | JGA, Geburtstag |
| 8 | White Party | ⚪ | Hochzeit, JGA |
| 9 | Black Tie | 🖤 | Hochzeit, Geburtstag |
| 10 | Festival Style | 🎪 | JGA, Geburtstag |
| 11 | Oktoberfest | 🥨 | JGA, Geburtstag |
| 12 | Mexican Fiesta | 🌮 | Geburtstag, JGA |
| 13 | Gatsby / 20er | 🎩 | Hochzeit, Geburtstag |
| 14 | Piraten | 🏴‍☠️ | Kinder, JGA |
| 15 | Wellness Retreat | 🧘 | JGA, Geburtstag |
| 16 | Sports Day | ⚽ | Team, Familie |
| 17 | Game Night | 🎮 | Alle |
| 18 | Garden Party | 🌸 | Hochzeit, Geburtstag |
| 19 | BBQ & Grill | 🍖 | Familie, Geburtstag |
| 20 | Cocktail Party | 🍸 | JGA, Geburtstag |
| 21 | Wine & Cheese | 🧀 | Geburtstag, JGA |
| 22 | Spa Day | 💆 | JGA |
| 23 | Adventure Theme | 🧗 | JGA, Team |
| 24 | Hollywood Glam | ⭐ | Hochzeit, Geburtstag |
| 25 | Masquerade Ball | 🎭 | Hochzeit, JGA |
| 26 | Karibik | 🏝️ | JGA, Reise |
| 27 | Ski Lodge | ⛷️ | JGA, Reise |
| 28 | Boho Chic | 🪶 | Hochzeit, JGA |
| 29 | Rustic Farm | 🌾 | Hochzeit, Familie |
| 30 | City Break | 🏙️ | JGA, Reise |
| 31 | Road Trip | 🚗 | JGA, Reise |
| 32 | Camping | ⛺ | Familie, JGA |
| 33 | Lake House | 🏡 | Familie, JGA |
| 34 | Beach House | 🏖️ | JGA, Reise |
| 35 | Cabin in the Woods | 🌲 | JGA, Familie |
| 36 | Disco Fever | 🪩 | JGA, Geburtstag |
| 37 | Neon Glow | 💡 | JGA, Geburtstag |
| 38 | Under the Stars | ⭐ | Hochzeit, Romantik |
| 39 | Vintage Tea Party | ☕ | JGA (Sie), Geburtstag |
| 40 | Art Deco | 🎨 | Hochzeit |
| 41 | Minimalist Modern | ⬜ | Hochzeit, Geburtstag |
| 42 | Bohemian | 🌻 | Hochzeit, JGA |
| 43 | Industrial Chic | ⚙️ | Hochzeit |
| 44 | French Riviera | 🇫🇷 | JGA, Hochzeit |
| 45 | Italian Dolce Vita | 🇮🇹 | JGA, Hochzeit |
| 46 | Greek Island | 🇬🇷 | JGA, Hochzeit |
| 47 | Spanish Flamenco | 💃 | JGA |
| 48 | Irish Pub | ☘️ | JGA |
| 49 | British Royal | 👑 | Hochzeit |
| 50 | Asian Zen | 🎋 | Wellness, JGA |

---

## Technische Umsetzung

### Dateien erstellen/andern:

| Datei | Aktion | Umfang |
|-------|--------|--------|
| `src/lib/games-library.ts` | Neu | ~800 Zeilen |
| `src/lib/theme-ideas-library.ts` | Neu | ~300 Zeilen |
| `src/components/ideas/GamesLibrary.tsx` | Neu | ~400 Zeilen |
| `src/components/ideas/ThemeGallery.tsx` | Neu | ~250 Zeilen |
| `src/components/ideas/GameCard.tsx` | Neu | ~100 Zeilen |
| `src/pages/IdeasHub.tsx` | Neu | ~200 Zeilen |
| `src/i18n/locales/de.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/en.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/es.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/fr.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/it.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/nl.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/pl.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/pt.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/tr.json` | Andern | +2000 Zeilen |
| `src/i18n/locales/ar.json` | Andern | +2000 Zeilen |
| `src/App.tsx` | Andern | +2 Zeilen (Route) |
| `src/components/landing/LandingHeader.tsx` | Andern | +Nav-Link |

---

## Geschatzter Aufwand

- **Spielebibliothek (TypeScript)**: ~1.500 Zeilen
- **UI-Komponenten**: ~1.000 Zeilen
- **Ubersetzungen (10 Sprachen x ~250 Eintrage)**: ~25.000 Zeilen

**Hinweis**: Aufgrund des massiven Umfangs (200+ Spiele, 50+ Themen, 10 Sprachen) wird die Implementierung in mehreren Schritten erfolgen.

