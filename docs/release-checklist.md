# EventBliss — Release Checklist (iOS + Android)

App-Vorbereitung: Capacitor 8, App ID `app.eventbliss`, Version `1.0.0` (build `1`).

---

## Was bereits erledigt ist (Code/Config)

- [x] Capacitor 8 integriert (iOS + Android Folder, alle Plugins)
- [x] iOS `Info.plist` Privacy Descriptions: Camera, Photo Library, Location
- [x] iOS `ITSAppUsesNonExemptEncryption = false` (überspringt Export-Compliance Frage)
- [x] iOS Region auf `de` gesetzt
- [x] Android Permissions: Camera, Location (fine + coarse), Notifications (POST_NOTIFICATIONS für Android 13+), Photos
- [x] Android `google_maps_api_key` Placeholder in `strings.xml` + Manifest meta-data
- [x] Versions auf `1.0.0` / `versionCode 1` / `MARKETING_VERSION 1.0.0` synchronisiert
- [x] App-Icons generiert (12 Android Mipmaps, 1 iOS 1024×1024) aus `public/favicon.png` (500×500 Quelle)
- [x] PWA Icons (48-512px) regeneriert
- [x] `npx cap sync` erfolgreich

> **Logo-Hinweis:** Die Quelldatei ist 500×500. Apple verlangt für das App Store Listing ein **1024×1024** Icon. Das in-App-Icon wird hochskaliert und ist sichtbar leicht weicher. **Empfehlung:** vor finalem Submit ein 1024×1024 Logo nach `resources/icon-only.png` ablegen und `npx capacitor-assets generate --iconBackgroundColor '#1a1625'` erneut ausführen.

---

## Manuelle Schritte vor erstem Submit

### 1. Apple Developer Account & App Store Connect

- [ ] Apple Developer Membership aktiv ($99/Jahr)
- [ ] Bundle ID `app.eventbliss` registriert (developer.apple.com → Identifiers)
- [ ] App in App Store Connect erstellt
  - Name: **EventBliss**
  - Primärsprache: Deutsch
  - Bundle ID: `app.eventbliss`
  - SKU: `eventbliss-001` (oder beliebig)
- [ ] App Store Information ausfüllen:
  - Beschreibung (DE + EN, max 4000 Zeichen)
  - Schlüsselwörter (max 100 Zeichen, kommasepariert)
  - Support-URL + Marketing-URL
  - **Datenschutz-URL** (Pflicht — z.B. `eventbliss.app/privacy`)
  - Kategorie: Spiele → Party (Primär), Unterhaltung (Sekundär)
- [ ] **Privacy Nutrition Labels** ausfüllen (App Store Connect → App Privacy):
  - Standort (Optional, nicht zur Verfolgung)
  - Foto/Video (Optional, nicht zur Verfolgung)
  - Identifier (Spielername, falls gespeichert)
- [ ] **Altersfreigabe-Fragebogen** (Age Rating) — vermutlich 12+ wegen "Wahrheit oder Pflicht"
- [ ] Screenshots vorbereiten:
  - 6.7" iPhone (1290×2796): mind. 3, max 10
  - 6.5" iPhone (1242×2688 oder 1284×2778): mind. 3
  - 12.9" iPad Pro (2048×2732): mind. 2 (falls iPad supported)
- [ ] App Preview Video (optional, max 30s)

### 2. Apple — Signing & Build

- [ ] In Xcode öffnen: `npm run cap:ios`
- [ ] Target `App` → Signing & Capabilities
  - Team: dein Apple Developer Team
  - Automatically manage signing: ON
  - Bundle Identifier: `app.eventbliss`
- [ ] Capabilities aktivieren falls genutzt:
  - **Push Notifications** (sonst funktioniert `@capacitor/push-notifications` nicht)
  - **Background Modes** → Remote notifications
- [ ] Device-Target auf "Any iOS Device (arm64)"
- [ ] Product → Archive
- [ ] Window → Organizer → Distribute App → App Store Connect → Upload
- [ ] Nach Upload: TestFlight Beta einrichten, intern testen

### 3. Google Play Console

- [ ] Google Play Developer Account aktiv ($25 einmalig)
- [ ] App erstellen in Play Console
  - Name: **EventBliss**
  - Standardsprache: Deutsch (Deutschland)
  - App oder Spiel: **Spiel**
  - Kostenlos
- [ ] Store-Eintrag ausfüllen:
  - Kurzbeschreibung (max 80 Zeichen)
  - Vollständige Beschreibung (max 4000 Zeichen)
  - Grafik-Assets: Hi-Res Icon 512×512 PNG, Feature-Grafik 1024×500 PNG, mind. 2 Phone-Screenshots
  - **Datenschutz-URL**
- [ ] **Inhaltliche Einstufung** (IARC-Fragebogen) — vermutlich PEGI 12
- [ ] **Datensicherheit-Formular** ausfüllen:
  - Standort: Optional, nicht geteilt
  - Personenbezogene Daten: nur Spielername (falls gespeichert)
  - App-Aktivität: Spielinteraktionen
- [ ] Zielgruppe + Inhalte: Alter 13+ (wegen Wahrheit oder Pflicht)

### 4. Google Play — Signing & Build

- [ ] **Upload-Keystore** erstellen (einmalig, sicher backuppen!):
  ```bash
  keytool -genkey -v -keystore eventbliss-upload.keystore \
    -alias eventbliss -keyalg RSA -keysize 2048 -validity 10000
  ```
  > **WICHTIG:** Backup an mehrere Orte. Bei Verlust kannst du nie wieder Updates veröffentlichen.
- [ ] `android/key.properties` erstellen (NICHT committen):
  ```properties
  storeFile=/absoluter/pfad/zu/eventbliss-upload.keystore
  storePassword=...
  keyAlias=eventbliss
  keyPassword=...
  ```
- [ ] `android/app/build.gradle` um signing config erweitern (siehe unten "Gradle Signing Snippet")
- [ ] **Google Maps API Key** für Android freischalten:
  - Google Cloud Console → Maps SDK for Android aktivieren
  - API Key erstellen, auf Package Name `app.eventbliss` + SHA-1 Fingerprint des Upload-Keystores beschränken
  - Key in `android/app/src/main/res/values/strings.xml` → `google_maps_api_key` einfügen (oder besser: über Gradle BuildConfig injizieren um nicht zu committen)
- [ ] **Firebase / FCM** für Push Notifications:
  - Firebase-Projekt anlegen
  - Android-App registrieren mit Package `app.eventbliss`
  - `google-services.json` nach `android/app/` legen (NICHT committen)
- [ ] Build:
  ```bash
  npm run cap:build
  cd android
  ./gradlew bundleRelease
  ```
  → `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] In Play Console → Interner Test → AAB hochladen → Tester einladen

### 5. Beide Plattformen — Pflicht-Inhalte

- [ ] **Datenschutz-Policy** auf öffentlich erreichbarer URL (Pflicht für beide Stores)
- [ ] **Impressum** (in DE rechtlich erforderlich)
- [ ] **AGB** (falls In-App-Käufe oder Premium-Features)
- [ ] **Cookie-Banner** (nur Web — Native ist davon nicht betroffen)

---

## Gradle Signing Snippet (manuell einfügen)

In `android/app/build.gradle` vor `android { ... }`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Innerhalb von `android { ... }`:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## Bekannte technische Vorbehalte

- **Bundle-Größe Web:** `index.js` ist 5.7 MB unkomprimiert (1.57 MB gzip). Sollte vor Release Code-Split werden für schnelleren App-Start. Niedrige Priorität — funktioniert auch so.
- **Service Worker / PWA:** Capacitor bündelt die Web-Assets statisch. Der PWA Service Worker wird im Native-Build vermutlich nicht aktiv sein (Capacitor lädt von `capacitor://localhost`). Keine Aktion nötig.
- **Google Maps in Native App:** Die `VITE_GOOGLE_MAPS_KEY` env wird beim Build in den JS-Bundle gehärtet. Für Native-Builds reicht das wenn die Maps via JS-API geladen werden. Falls native Maps SDK genutzt wird, zusätzlich der `com.google.android.geo.API_KEY` in `strings.xml` (bereits angelegt).
- **Logo-Auflösung:** 500×500 — siehe oben. Vor finalem Submit upgraden.
- **Keine deutsche Lokalisierung der Privacy Strings auf Apple Store-Seite:** Die `Info.plist` enthält DE-Strings. Für vollständige Lokalisierung könnten `InfoPlist.strings` Files pro Sprache ergänzt werden. Niedrige Priorität.

---

## Build-Befehle (Quick Reference)

```bash
# Web build + Capacitor sync (für beide Plattformen)
npm run cap:build

# iOS in Xcode öffnen
npm run cap:ios

# Android in Android Studio öffnen
npm run cap:android

# Live-Reload für Native Dev
npm run cap:dev:ios
npm run cap:dev:android

# Native icons regenerieren (nach Logo-Update)
npx capacitor-assets generate --iconBackgroundColor '#1a1625'

# Android Release AAB
cd android && ./gradlew bundleRelease

# iOS Archive: nur via Xcode (Product → Archive)
```
