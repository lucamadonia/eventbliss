# OHRWURM × Spotify App Remote — Setup (Stage 2)

Spielt den **vollen Song verdeckt im Hintergrund** über die installierte Spotify-App
(wie Hitster Premium). **Native iOS/Android only**, **Spotify Premium** + **Spotify-App
installiert** nötig.

> ⚠️ Dieses Plugin ist **nicht getestet** (kann in einer headless-Umgebung nicht
> kompiliert/geprüft werden) und ist **nicht** in den App-Build eingebunden — der
> Live-Build bleibt unberührt, bis du die Schritte unten ausführst. Du brauchst dafür
> **Xcode (Mac)** bzw. **Android Studio** und ein **echtes Gerät** mit Spotify Premium.

---

## 1. Spotify-Developer-App
1. https://developer.spotify.com/dashboard → **Create App**.
2. Notiere die **Client ID** (kein Secret im App-Client nötig).
3. **Redirect URIs** hinzufügen: `eventbliss://spotify-callback`
4. **Bundle ID (iOS)** + **Package + SHA1 (Android)** registrieren:
   - iOS Bundle ID: `app.eventbliss`
   - Android Package: `app.eventbliss` (oder dein applicationId) + Debug/Release-SHA1.

## 2. Secrets / Env
- **App-Client (Vite):** `.env` → `VITE_SPOTIFY_CLIENT_ID=deine_client_id`
- **Resolver (Supabase Edge Function `ohrwurm-spotify-track`):** im Supabase-Dashboard
  → Functions → Secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`. Danach:
  `npx supabase functions deploy ohrwurm-spotify-track`

## 3. Plugin bauen + installieren
```bash
cd native-plugins/ohrwurm-spotify && npm install && npm run build && cd ../..
# Im App-Projekt als lokale Abhängigkeit eintragen:
#   package.json → "dependencies": { "ohrwurm-spotify": "file:native-plugins/ohrwurm-spotify" }
npm install
npx cap sync
```

## 4. iOS (Xcode)
1. **SpotifyiOS.xcframework** laden (https://github.com/spotify/ios-sdk) und zum **App-Target**
   hinzufügen (Embed & Sign). Alternativ im Plugin-Podspec `vendored_frameworks` aktivieren.
2. `ios/App/App/Info.plist`:
   ```xml
   <key>LSApplicationQueriesSchemes</key>
   <array><string>spotify</string></array>
   <key>CFBundleURLTypes</key>
   <array><dict>
     <key>CFBundleURLSchemes</key><array><string>eventbliss</string></array>
   </dict></array>
   ```
3. Redirect im `AppDelegate.swift` durchreichen (Capacitor ruft `application(_:open:options:)`
   bereits auf; die Spotify-`SPTSessionManager` verarbeitet den Callback über die App-Remote-
   Connection — i.d.R. ohne Zusatzcode, da `options: .clientOnly` genutzt wird).
4. **AVAudioSession**: für Hintergrund-Audio ggf. `UIBackgroundModes → audio` in Info.plist.

## 5. Android (Android Studio)
1. **spotify-app-remote AAR** laden (https://github.com/spotify/android-sdk/releases),
   nach `android/app/libs/spotify-app-remote-release-0.8.0.aar` legen, in `android/app/build.gradle`
   `flatDir { dirs 'libs' }` + die `implementation(name: ..., ext: 'aar')`-Zeile (siehe Plugin-Gradle).
2. Redirect-Intent-Filter in `AndroidManifest.xml` (Auth-Activity der Spotify-Auth-Lib) gemäß
   Spotify-Doku, Scheme `eventbliss`, Host `spotify-callback`.

## 6. CI-Hinweis (GitHub Actions iOS)
Der TestFlight-Workflow baut auf macOS. Sobald das Plugin im App-Build ist, **muss das
SpotifyiOS-Framework verfügbar sein**, sonst bricht der Build. Optionen: Framework ins Repo
vendoren (groß) oder im Workflow vor dem Build herunterladen. **Erst aktivieren, wenn lokal
getestet** — sonst bricht der Live-TestFlight-Build.

## 7. Spiel-Anbindung (in `src/games/ohrwurm/OhrwurmGame.tsx`)
Die Abstraktion liegt in `src/games/ohrwurm/playback.ts` (`getSpotifyBridge()`,
`resolveSpotifyUri(song)`). Beim On-Device-Integrieren diese Punkte verdrahten:

1. **Beim Spielstart** (`handleStart`, wenn `cfg.playback === 'spotify'`): `getSpotifyBridge()`
   → in `spotifyBridgeRef` merken; bei `null` Toast + Preview (bereits vorhanden).
2. **Beim Ziehen** (`beginTurn`/`loadPreview`): zusätzlich `resolveSpotifyUri(card)` →
   `spotifyUriRef`.
3. **Play/Pause** (`togglePlay`, `replayAudio`, `startListening*`): wenn
   `spotifyBridgeRef.current && spotifyUriRef.current` → `bridge.play(uri)` / `bridge.pause()` /
   `bridge.resume()` **statt** des `<audio>`-Elements; `setIsAudioPlaying` für die Equalizer-Optik
   weiter setzen. Timer/Speed-Bonus bleiben identisch.
4. **Stoppen** (`stopAudio`): zusätzlich `spotifyBridgeRef.current?.pause()`.
5. **Render**: den `MysteryPlayer` auch zeigen, wenn der Spotify-Modus aktiv ist (nicht nur bei
   `previewUrl`).

> Diese Verdrahtung ist bewusst **nicht** im Live-Code, weil sie nur on-device verifizierbar ist
> und sonst den getesteten Preview-Pfad gefährdet. Der Spotify-Pfad ist erst aktiv, wenn die
> Bridge verbindet (native + Plugin + Client ID + Premium + Spotify-App).

## 8. Test (nur echtes Gerät)
- Gerät mit **Spotify Premium** + installierter, eingeloggter **Spotify-App**.
- Spiel → Einstellung **Spotify Premium** → Karte ziehen → ▶ → voller Song spielt verdeckt im
  Hintergrund, neutraler Screen, 60s-Timer + Speed-Bonus wie gehabt.
- Ohne Premium / ohne Spotify-App → automatischer Fallback auf 30s-Vorschau.
