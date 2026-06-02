# Spotify „Extended Quota Mode" — Antrag für OHRWURM (EventBliss)

Ziel: Den Development-Mode-Web-API-Block aufheben, damit der Track-Resolver
(Suche) für ~1281 Songs läuft und OHRWURM die Spotify-Vollwiedergabe bieten kann.

## So reichst du ein
1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → App **OHRWURM** öffnen.
2. Oben/Settings nach **„Extension Request"** bzw. **„Request Extension / Extended Quota Mode"** suchen und starten.
3. Die Felder unten **1:1 übernehmen** (anpassen, wo in eckigen Klammern steht).
4. Falls ein **Demo-Video** verlangt wird: das Skript ganz unten abfilmen (Handy-Bildschirmaufnahme, ~60 s) und Link (YouTube „nicht gelistet" oder Drive) angeben.
5. Absenden. Review dauert i.d.R. einige Tage bis Wochen.

---

## Antwortbausteine (zum Kopieren)

**App name:** OHRWURM (a party game inside the EventBliss app)

**App website:** https://event-bliss.com

**Redirect URIs:** eventbliss://spotify-callback · https://event-bliss.com/spotify-callback

**Is your app commercial?**
EventBliss is a commercial event-planning app. OHRWURM is a free music party game included in it. No Spotify content is sold; playback always uses the end user's own Spotify Premium subscription.

**What does your application do? (Description)**
OHRWURM is a "guess the year" music party game (similar to Hitster). Players hear a song, then place it on a chronological timeline by guessing its release year. The game ships a fixed, curated catalogue of ~1281 well-known songs (artist, title, year). On a player's own device, Premium users hear the full track played in the background through the official Spotify app via the iOS/Android App Remote SDK; non-Premium users hear a 30-second preview from another source. Spotify is never used to download or store audio.

**How do you use the Spotify Web API? (Be specific)**
We use exactly ONE Web API endpoint: **Search** (`GET /v1/search?type=track`). For each of our pre-defined songs we search by `track:<title> artist:<artist>` to resolve the matching `spotify:track:…` URI. These URIs are resolved ONCE (offline batch) and cached in the app; we do not call the Web API at game time. The resolved URI is then handed to the App Remote SDK so the user's own Spotify app plays the full track. We do NOT use audio-features, recommendations, user library, playlists, or any personal-data endpoints.

**Which SDKs do you use?**
iOS App Remote SDK and Android App Remote SDK (playback control on the user's Premium account). Optionally the Web Playback SDK is not used in production.

**How many users do you expect?**
A few thousand monthly active users (party-game usage), scaling with the EventBliss app.

**How do you handle user data / privacy?**
Minimal. The OAuth access token stays on the user's device (and is used only to control playback / to resolve track URIs during the one-time offline batch). We store no Spotify personal data on our servers. Privacy policy: https://event-bliss.com/legal · Data protection (DE): https://event-bliss.com/legal/datenschutz.html

**Do you comply with the Spotify Developer Terms, Design Guidelines and Branding Guidelines?**
Yes. We attribute Spotify, do not modify content, do not store audio, and playback runs on the user's own Premium subscription via the official Spotify app.

**Platforms:** iOS (TestFlight, App Store planned), Android, Web.

---

## Demo-Video-Skript (~60 s, falls verlangt)
1. EventBliss-App öffnen → Spiel **OHRWURM** starten.
2. Spieler anlegen, Genre wählen, **„Spotify Premium"-Wiedergabe** aktivieren.
3. Karte ziehen → zeigen, dass **Spotify** (nicht angezeigter Songtitel) den **vollen Track** im Hintergrund über die Spotify-App abspielt.
4. Song korrekt auf der Timeline einordnen → kurz die Timeline zeigen.
5. Sagen/Untertitel: „Spotify Web API wird nur genutzt, um Track-URIs für eine feste Songliste aufzulösen; Wiedergabe läuft über App Remote mit dem Premium-Konto des Nutzers."

---

## Nach der Freigabe (mein Teil — dauert ~2 Min)
1. `node scripts/spotify-bake.mjs` (Login mit dem freigegebenen Premium-Konto) ODER der Edge-Resolver befüllt `src/games/ohrwurm/spotify-uris.json`.
2. committen → Web-Deploy + iOS-Build.
3. OHRWURM spielt dann die **Vollversion** statt der 30s-Vorschau.

> Hinweis: Erst nach Spotifys Freigabe funktioniert die Suche. Bis dahin ist alles
> code-seitig bereit; es ändert sich am App-Verhalten nichts (30s-Vorschau bleibt).
