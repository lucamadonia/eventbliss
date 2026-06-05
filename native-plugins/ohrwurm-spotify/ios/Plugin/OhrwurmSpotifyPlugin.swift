import Foundation
import UIKit
import Capacitor
import SpotifyiOS

// OHRWURM — Spotify App Remote bridge (iOS).
// Plays a full track in the background via the installed Spotify app (Premium).
// Requires the SpotifyiOS framework (App Remote) added to the app project.
//
// Setup (see native-plugins/ohrwurm-spotify/SETUP.md):
//  - SpotifyiOS.xcframework is wired via the plugin's Package.swift (SPM).
//  - Register the redirect URL scheme (eventbliss) in Info.plist.
//  - Add `spotify` to LSApplicationQueriesSchemes in Info.plist.
//
// Robustness (Build 170+): the access token and the app config (clientId/
// redirectUrl) are persisted in UserDefaults so that
//  (a) `connect()` can re-attach silently with a stored token — no repeated
//      consent prompt, and
//  (b) the SPTSessionManager is recreated in `load()` from the stored config,
//      so the auth redirect is handled even after iOS terminated the app
//      during the Spotify app-switch (cold launch → would otherwise drop it).

@objc(OhrwurmSpotifyPlugin)
public class OhrwurmSpotifyPlugin: CAPPlugin, CAPBridgedPlugin, SPTAppRemoteDelegate, SPTSessionManagerDelegate, SPTAppRemotePlayerStateDelegate {

    // Capacitor-6+/8-Registrierung (ersetzt die alte .m-CAP_PLUGIN-Makro-Registrierung).
    public let identifier = "OhrwurmSpotifyPlugin"
    public let jsName = "OhrwurmSpotify"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isConnected", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "warmUp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveTrack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addToPlaylist", returnType: CAPPluginReturnPromise),
    ]

    private var appRemote: SPTAppRemote?
    private var sessionManager: SPTSessionManager?
    private var connectCall: CAPPluginCall?
    private var pendingUri: String?
    // Offener play()-Aufruf, der auf das Zustandekommen der App-Remote-Verbindung
    // wartet. Wird in appRemoteDidEstablishConnection aufgelöst bzw. bei
    // Fehlschlag/Timeout mit "not_connected" abgelehnt — damit das JS deterministisch
    // auf die 30s-Vorschau zurückfällt (statt stiller „läuft", obwohl nichts spielt).
    private var pendingPlayCall: CAPPluginCall?
    // Opt-in-Connect: ein wartender warmUp()-Aufruf, der per authorizeAndPlayURI die
    // App-Remote-Verbindung anwirft. Nach Verbindungsaufbau wird der (neutrale)
    // angeworfene Track sofort pausiert, damit nichts hörbar weiterläuft.
    private var pendingWarmUpCall: CAPPluginCall?
    private var warmupPauseOnConnect = false
    // true, solange ein Connect-Versuch mit gespeichertem Token läuft — schlägt
    // er fehl (Token abgelaufen), fallen wir auf die volle Zustimmung zurück.
    private var triedStoredToken = false
    // true, sobald der Spotify-Modus aktiv ist: dann versuchen wir die App-Remote-
    // Verbindung bei jedem applicationDidBecomeActive (der zuverlässige Zeitpunkt,
    // an dem Spotify frisch aktiv ist) erneut herzustellen.
    private var wantsConnection = false

    // UserDefaults-Schlüssel.
    private let kClientId = "ohrwurm.spotify.clientId"
    private let kRedirect = "ohrwurm.spotify.redirectUrl"
    private let kToken = "ohrwurm.spotify.accessToken"
    private let kExpiry = "ohrwurm.spotify.tokenExpiry" // timeIntervalSince1970

    // Capacitor leitet eingehende URLs (Spotify-Auth-Redirect) als Notification
    // weiter — wir reichen sie an den SessionManager durch.
    override public func load() {
        // WICHTIG: Capacitors typisiertes Symbol verwenden (nicht den String) —
        // identisch zu @capacitor/app. Ein abweichender rawValue wuerde das
        // Observer-Matching stillschweigend verhindern.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleOpenURL(_:)),
            name: Notification.Name.capacitorOpenURL,
            object: nil
        )
        // App-Remote-Verbindung erst herstellen, wenn unsere App wieder aktiv ist
        // (nach dem Spotify-Auth-Sprung). connect() direkt in didInitiate scheitert
        // oft still, weil Spotify in dem Moment noch nicht „warm" ist.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        // Aus gespeicherter Config SessionManager + AppRemote wiederherstellen,
        // damit ein Cold-Launch-Redirect (App wurde während des Spotify-
        // Wechsels beendet) trotzdem verarbeitet werden kann.
        let defaults = UserDefaults.standard
        if let clientId = defaults.string(forKey: kClientId),
           let redirect = defaults.string(forKey: kRedirect),
           let redirectURL = URL(string: redirect) {
            setupSpotify(clientId: clientId, redirectURL: redirectURL)
        }
    }

    @objc func handleOpenURL(_ notification: Notification) {
        // Capacitor postet object als [String: Any?] mit url=NSURL (siehe
        // @capacitor/app AppPlugin.makeUrlOpenObject). Ein Cast auf
        // [String: Any] (ohne ?) schlaegt fehl → fruehere Ursache, dass der
        // Spotify-Redirect den SessionManager nie erreichte.
        var url: URL?
        if let object = notification.object as? [String: Any?] {
            if let nsurl = object["url"] as? NSURL { url = nsurl as URL }
            else if let u = object["url"] as? URL { url = u }
        } else if let nsurl = notification.object as? NSURL {
            url = nsurl as URL
        } else if let u = notification.object as? URL {
            url = u
        }
        guard let target = url else { return }
        // Den Redirect IMMER an den SessionManager geben → sessionManager(didInitiate:)
        // feuert → Token wird persistiert, am AppRemote gesetzt, connect() gestartet
        // und connectCall aufgeloest (Bridge = ok). Ihn vorher abzufangen wuerde
        // didInitiate verhindern → Bridge null → 30s-Vorschau (alte Regression).
        sessionManager?.application(UIApplication.shared, open: target, options: [:])
    }

    // Unsere App ist (wieder) im Vordergrund. Ist der Spotify-Modus aktiv und die
    // App-Remote-Verbindung noch nicht hergestellt, jetzt verbinden — Spotify ist
    // nach dem Auth-Sprung frisch aktiv, sodass connect() zuverlaessig greift.
    @objc func handleDidBecomeActive() {
        guard wantsConnection, let remote = appRemote, !remote.isConnected else { return }
        if let token = storedValidToken() {
            remote.connectionParameters.accessToken = token
        }
        guard remote.connectionParameters.accessToken != nil else { return }
        DispatchQueue.main.async { remote.connect() }
    }

    // MARK: - Helpers

    private func setupSpotify(clientId: String, redirectURL: URL) {
        let configuration = SPTConfiguration(clientID: clientId, redirectURL: redirectURL)
        let manager = SPTSessionManager(configuration: configuration, delegate: self)
        self.sessionManager = manager
        let remote = SPTAppRemote(configuration: configuration, logLevel: .info)
        remote.delegate = self
        self.appRemote = remote
    }

    private func storedValidToken() -> String? {
        let defaults = UserDefaults.standard
        guard let token = defaults.string(forKey: kToken) else { return nil }
        let expiry = defaults.double(forKey: kExpiry)
        // 60s Puffer, damit wir nicht knapp vor Ablauf verbinden.
        guard expiry - 60 > Date().timeIntervalSince1970 else { return nil }
        return token
    }

    private func persistToken(_ session: SPTSession) {
        let defaults = UserDefaults.standard
        defaults.set(session.accessToken, forKey: kToken)
        defaults.set(session.expirationDate.timeIntervalSince1970, forKey: kExpiry)
    }

    private func clearToken() {
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: kToken)
        defaults.removeObject(forKey: kExpiry)
    }

    // MARK: - Methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        let installed = sessionManager?.isSpotifyAppInstalled ?? true
        call.resolve(["available": installed])
    }

    // Echte App-Remote-Verbindung (nicht nur „autorisiert"). Das JS routet die
    // Wiedergabe nur dann auf Spotify, wenn hier true zurückkommt — sonst Vorschau.
    @objc func isConnected(_ call: CAPPluginCall) {
        call.resolve(["connected": appRemote?.isConnected ?? false])
    }

    // Opt-in: Verbindung per kurzem Spotify-Wechsel „anwerfen". authorizeAndPlayURI
    // weckt die Spotify-App UND etabliert die App-Remote-Verbindung zuverlässig
    // (der stille connect() feuert keine Callback, wenn Spotify keine aktive
    // Session hat). Leere URI = aktiven/letzten Track resümieren → KEIN Karten-
    // Spoiler. Sobald verbunden, wird sofort pausiert (siehe didEstablishConnection).
    @objc func warmUp(_ call: CAPPluginCall) {
        guard let remote = appRemote else { call.reject("no_remote"); return }
        if remote.isConnected {
            call.resolve(["connected": true, "detail": "already"])
            return
        }
        let uri = call.getString("uri") ?? ""
        wantsConnection = true
        warmupPauseOnConnect = true
        pendingWarmUpCall?.reject("superseded")
        pendingWarmUpCall = call
        if let token = storedValidToken() { remote.connectionParameters.accessToken = token }
        DispatchQueue.main.async { _ = remote.authorizeAndPlayURI(uri) }
        // Sicherheitsnetz: kommt binnen 10s keine Verbindung, ablehnen (Diagnose).
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self] in
            guard let self = self, self.pendingWarmUpCall === call else { return }
            self.pendingWarmUpCall = nil
            self.warmupPauseOnConnect = false
            call.reject("warmup_timeout")
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let clientId = call.getString("clientId"),
              let redirect = call.getString("redirectUrl"),
              let redirectURL = URL(string: redirect) else {
            call.reject("clientId and redirectUrl are required")
            return
        }

        // Config persistieren (für Cold-Launch-Redirect-Handling in load()).
        let defaults = UserDefaults.standard
        defaults.set(clientId, forKey: kClientId)
        defaults.set(redirect, forKey: kRedirect)

        // SessionManager/AppRemote sicherstellen (load() hat sie evtl. schon
        // erstellt; bei geänderter Config neu aufsetzen).
        if appRemote == nil || sessionManager == nil {
            setupSpotify(clientId: clientId, redirectURL: redirectURL)
        }

        self.connectCall = call
        self.wantsConnection = true

        // Sicherheitsnetz: feuert keine App-Remote-Callback (z.B. Spotify-App
        // reagiert nicht / Token still ungültig), darf connect() nicht ewig
        // hängen → nach 15s mit Grund ablehnen UND Token verwerfen, damit der
        // nächste Versuch sauber neu autorisiert (statt erneut still zu hängen).
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self = self, self.connectCall === call else { return }
            self.connectCall = nil
            if self.triedStoredToken { self.clearToken() }
            self.triedStoredToken = false
            call.reject("connect_timeout")
        }

        // 1) Bereits verbunden? Sofort zurück.
        if let remote = appRemote, remote.isConnected {
            call.resolve(["connected": true])
            self.connectCall = nil
            return
        }

        // 2) Verbindung IMMER über den SessionManager herstellen: das weckt die
        //    Spotify-App per kurzem App-Wechsel und etabliert die App-Remote-
        //    Verbindung zuverlässig. Der stille appRemote.connect()-Pfad mit
        //    gespeichertem Token feuert oft GAR KEINE Callback (→ connect_timeout),
        //    wenn die Spotify-App nicht ohnehin schon verbunden ist.
        //    Nach der ersten Zustimmung fragt Spotify nicht erneut.
        triedStoredToken = false
        let scope: SPTScope = [.appRemoteControl, .streaming, .userLibraryModify, .playlistModifyPublic, .playlistModifyPrivate]
        DispatchQueue.main.async {
            self.sessionManager?.initiateSession(with: scope, options: .clientOnly, campaign: nil)
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri") else {
            call.reject("uri is required")
            return
        }
        guard let remote = appRemote else {
            call.reject("no_remote")
            return
        }
        if remote.isConnected {
            // Verbunden → versteckte Hintergrundwiedergabe, KEIN App-Wechsel,
            // KEIN sichtbarer Songname. Unsere Buttons (Pause/Resume) greifen.
            remote.playerAPI?.play(uri, callback: { _, error in
                if let error = error { call.reject("play_failed: \(error.localizedDescription)") }
                else { call.resolve() }
            })
        } else {
            // Noch nicht verbunden → Song einreihen und Verbindung herstellen
            // (Spotify ist gerade aktiv genug). Sobald didEstablishConnection
            // feuert, wird pendingUri im Hintergrund gespielt — ohne App-Wechsel.
            // KEIN authorizeAndPlayURI-Vordergrund-Fallback mehr: das würde Spotify
            // mit sichtbarem Songnamen öffnen (Spoiler im Jahres-Ratespiel). Klappt
            // die Verbindung nicht, wird der play()-Call abgelehnt → JS fällt auf
            // die 30s-Vorschau zurück.
            pendingUri = uri
            wantsConnection = true
            // Vorigen, noch offenen play()-Call ablehnen (überschriebene Anfrage).
            pendingPlayCall?.reject("superseded")
            pendingPlayCall = call
            if let token = storedValidToken() { remote.connectionParameters.accessToken = token }
            DispatchQueue.main.async { remote.connect() }
            // Sicherheitsnetz: kommt binnen 6s keine Verbindung zustande, den
            // play()-Call ablehnen (Vorschau-Fallback im JS), ohne Spotify zu öffnen.
            DispatchQueue.main.asyncAfter(deadline: .now() + 6) { [weak self] in
                guard let self = self, self.pendingPlayCall === call else { return }
                self.pendingPlayCall = nil
                if self.pendingUri == uri { self.pendingUri = nil }
                call.reject("not_connected")
            }
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else { call.reject("not_connected"); return }
        remote.playerAPI?.pause({ _, error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        })
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else { call.reject("not_connected"); return }
        remote.playerAPI?.resume({ _, error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        })
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        wantsConnection = false
        pendingUri = nil
        pendingPlayCall?.reject("disconnected")
        pendingPlayCall = nil
        pendingWarmUpCall?.reject("disconnected")
        pendingWarmUpCall = nil
        warmupPauseOnConnect = false
        appRemote?.disconnect()
        notifyListeners("connection", data: ["connected": false])
        call.resolve()
    }

    // Aktuellen User-Access-Token (für Web-API-Aufrufe wie „Track speichern").
    @objc func getToken(_ call: CAPPluginCall) {
        if let token = storedValidToken() { call.resolve(["token": token]) }
        else { call.resolve([:]) }
    }

    // MARK: - Spotify Web API (nativ, kein WebView-CORS)

    // Authentifizierter Request via URLSession. done(statusCode, body).
    private func spotifyApi(_ method: String, _ urlString: String, _ token: String, _ body: Data?,
                            _ done: @escaping (Int, Data?) -> Void) {
        guard let url = URL(string: urlString) else { done(0, nil); return }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if body != nil { req.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        req.httpBody = body
        URLSession.shared.dataTask(with: req) { data, resp, _ in
            done((resp as? HTTPURLResponse)?.statusCode ?? 0, data)
        }.resume()
    }

    // Track in die „Liked Songs" speichern. Liefert ok + detail (http_NNN/no_token).
    @objc func saveTrack(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri"), let id = uri.components(separatedBy: ":").last, !id.isEmpty else {
            call.resolve(["ok": false, "detail": "bad_uri"]); return
        }
        guard let token = storedValidToken() else { call.resolve(["ok": false, "detail": "no_token"]); return }
        spotifyApi("PUT", "https://api.spotify.com/v1/me/tracks?ids=\(id)", token, nil) { code, _ in
            call.resolve(["ok": (200...299).contains(code), "detail": "http_\(code)"])
        }
    }

    // Track in die Playlist „OHRWURM 🎵" legen (anlegen, falls nicht vorhanden).
    @objc func addToPlaylist(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri"), !uri.isEmpty else { call.resolve(["ok": false, "detail": "bad_uri"]); return }
        guard let token = storedValidToken() else { call.resolve(["ok": false, "detail": "no_token"]); return }
        let plName = "OHRWURM 🎵"

        func addTo(_ playlistId: String) {
            let body = try? JSONSerialization.data(withJSONObject: ["uris": [uri]])
            spotifyApi("POST", "https://api.spotify.com/v1/playlists/\(playlistId)/tracks", token, body) { code, _ in
                call.resolve(["ok": (200...299).contains(code), "detail": "add_\(code)"])
            }
        }

        // 1) /me → User-ID
        spotifyApi("GET", "https://api.spotify.com/v1/me", token, nil) { code, data in
            guard code == 200, let data = data,
                  let me = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
                  let userId = me["id"] as? String else {
                call.resolve(["ok": false, "detail": "me_\(code)"]); return
            }
            // 2) bestehende Playlist suchen
            self.spotifyApi("GET", "https://api.spotify.com/v1/me/playlists?limit=50", token, nil) { code2, data2 in
                var existing: String?
                if code2 == 200, let data2 = data2,
                   let obj = (try? JSONSerialization.jsonObject(with: data2)) as? [String: Any],
                   let items = obj["items"] as? [[String: Any]] {
                    existing = items.first(where: { ($0["name"] as? String) == plName })?["id"] as? String
                }
                if let pid = existing { addTo(pid); return }
                // 3) sonst anlegen
                let createBody = try? JSONSerialization.data(withJSONObject: [
                    "name": plName, "public": false, "description": "Songs aus dem OHRWURM-Spiel",
                ])
                let createURL = "https://api.spotify.com/v1/users/\(userId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? userId)/playlists"
                self.spotifyApi("POST", createURL, token, createBody) { code3, data3 in
                    guard (200...299).contains(code3), let data3 = data3,
                          let obj = (try? JSONSerialization.jsonObject(with: data3)) as? [String: Any],
                          let pid = obj["id"] as? String else {
                        call.resolve(["ok": false, "detail": "create_\(code3)"]); return
                    }
                    addTo(pid)
                }
            }
        }
    }

    // MARK: - SPTSessionManagerDelegate

    public func sessionManager(manager: SPTSessionManager, didInitiate session: SPTSession) {
        persistToken(session)
        triedStoredToken = false
        appRemote?.connectionParameters.accessToken = session.accessToken
        DispatchQueue.main.async { self.appRemote?.connect() }
        // Autorisierung erfolgreich → Bridge gilt als VERFÜGBAR und connect() wird
        // aufgelöst. WICHTIG: das ist NICHT „echt verbunden" — die App-Remote-
        // Verbindung feuert oft erst verzögert (handleDidBecomeActive nach dem Auth-
        // Sprung), manchmal kommt gar kein Callback. Würden wir hier auf
        // appRemoteDidEstablishConnection warten, liefe der 15s-connect_timeout ab
        // → Bridge null → 30s-Vorschau (genau dieser Bug). Das Routing auf Spotify
        // hängt stattdessen am echten Player-State: das JS spielt erst voll ab, wenn
        // das "connection"-Event (aus appRemoteDidEstablishConnection) true meldet.
        connectCall?.resolve(["connected": true])
        connectCall = nil
    }

    public func sessionManager(manager: SPTSessionManager, didFailWith error: Error) {
        clearToken()
        connectCall?.reject("auth_failed: \(error.localizedDescription)")
        connectCall = nil
    }

    // MARK: - SPTAppRemoteDelegate

    public func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
        triedStoredToken = false
        connectCall?.resolve(["connected": true])
        connectCall = nil
        // Echten Player-State abonnieren → das JS spiegelt damit den TATSÄCHLICHEN
        // Spotify-Zustand (Play/Pause), statt einen optimistischen Boolean zu führen.
        appRemote.playerAPI?.delegate = self
        appRemote.playerAPI?.subscribe(toPlayerState: { _, _ in })
        notifyListeners("connection", data: ["connected": true])
        // Opt-in-Warmup: der neutrale „Anwerf"-Track wird sofort pausiert, damit
        // nichts hörbar weiterläuft. Danach steht die Verbindung für versteckte Plays.
        if warmupPauseOnConnect {
            warmupPauseOnConnect = false
            appRemote.playerAPI?.pause({ _, _ in })
            pendingWarmUpCall?.resolve(["connected": true, "detail": "warmed"])
            pendingWarmUpCall = nil
        }
        if let uri = pendingUri {
            appRemote.playerAPI?.play(uri, callback: { [weak self] _, error in
                guard let self = self else { return }
                if let error = error { self.pendingPlayCall?.reject("play_failed: \(error.localizedDescription)") }
                else { self.pendingPlayCall?.resolve() }
                self.pendingPlayCall = nil
            })
            pendingUri = nil
        } else {
            // Verbindung kam ohne wartenden Song zustande (reiner connect()).
            pendingPlayCall?.resolve()
            pendingPlayCall = nil
        }
    }

    // MARK: - SPTAppRemotePlayerStateDelegate

    public func playerStateDidChange(_ playerState: SPTAppRemotePlayerState) {
        // WICHTIG: track.name / Jahr NICHT mitsenden (Spoiler-Schutz). Das JS
        // braucht nur isPaused (UI-Sync), uri (Stale-Event-Abgleich) und position.
        notifyListeners("playerState", data: [
            "isPaused": playerState.isPaused,
            "uri": playerState.track.uri,
            "position": playerState.playbackPosition,
        ])
    }

    public func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        // Verbindung abgebrochen — das Spiel fällt beim nächsten Play auf die
        // Vorschau zurück. JS informieren, damit Routing/Buttons nachziehen.
        pendingPlayCall?.reject("not_connected")
        pendingPlayCall = nil
        pendingWarmUpCall?.reject("disconnected")
        pendingWarmUpCall = nil
        warmupPauseOnConnect = false
        notifyListeners("connection", data: ["connected": false])
    }

    public func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        // Schlug der stille Connect mit gespeichertem Token fehl (z.B. Token
        // ungültig/abgelaufen)? Token verwerfen und volle Zustimmung anstoßen.
        if triedStoredToken {
            triedStoredToken = false
            clearToken()
            let scope: SPTScope = [.appRemoteControl, .streaming, .userLibraryModify, .playlistModifyPublic, .playlistModifyPrivate]
            DispatchQueue.main.async {
                self.sessionManager?.initiateSession(with: scope, options: .clientOnly, campaign: nil)
            }
            return
        }
        connectCall?.reject("connect_failed: \(error?.localizedDescription ?? "unknown")")
        connectCall = nil
        // Wartender Song/Warmup kann nicht abgespielt werden → JS auf Vorschau zurück.
        pendingPlayCall?.reject("not_connected")
        pendingPlayCall = nil
        pendingWarmUpCall?.reject("connect_failed: \(error?.localizedDescription ?? "unknown")")
        pendingWarmUpCall = nil
        warmupPauseOnConnect = false
        pendingUri = nil
        notifyListeners("connection", data: ["connected": false])
    }
}
