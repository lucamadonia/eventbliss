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
public class OhrwurmSpotifyPlugin: CAPPlugin, CAPBridgedPlugin, SPTAppRemoteDelegate, SPTSessionManagerDelegate {

    // Capacitor-6+/8-Registrierung (ersetzt die alte .m-CAP_PLUGIN-Makro-Registrierung).
    public let identifier = "OhrwurmSpotifyPlugin"
    public let jsName = "OhrwurmSpotify"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
    ]

    private var appRemote: SPTAppRemote?
    private var sessionManager: SPTSessionManager?
    private var connectCall: CAPPluginCall?
    private var pendingUri: String?
    // true, solange ein Connect-Versuch mit gespeichertem Token läuft — schlägt
    // er fehl (Token abgelaufen), fallen wir auf die volle Zustimmung zurück.
    private var triedStoredToken = false

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
        // Die Spotify-SDK liest Token/Code aus der URL; options sind nicht noetig.
        sessionManager?.application(UIApplication.shared, open: target, options: [:])
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

        // 1) Bereits verbunden? Sofort zurück.
        if let remote = appRemote, remote.isConnected {
            call.resolve(["connected": true])
            self.connectCall = nil
            return
        }

        // 2) Gültiges Token vorhanden? Still verbinden — keine erneute Zustimmung.
        if let token = storedValidToken(), let remote = appRemote {
            triedStoredToken = true
            remote.connectionParameters.accessToken = token
            DispatchQueue.main.async { remote.connect() }
            return
        }

        // 3) Volle Zustimmung (einmalig). Scopes für Playback-Steuerung.
        triedStoredToken = false
        let scope: SPTScope = [.appRemoteControl, .streaming]
        DispatchQueue.main.async {
            self.sessionManager?.initiateSession(with: scope, options: .clientOnly, campaign: nil)
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri") else {
            call.reject("uri is required")
            return
        }
        guard let remote = appRemote, remote.isConnected else {
            pendingUri = uri
            call.reject("not_connected")
            return
        }
        remote.playerAPI?.play(uri, callback: { _, error in
            if let error = error { call.reject("play_failed: \(error.localizedDescription)") }
            else { call.resolve() }
        })
    }

    @objc func pause(_ call: CAPPluginCall) {
        appRemote?.playerAPI?.pause({ _, error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        })
    }

    @objc func resume(_ call: CAPPluginCall) {
        appRemote?.playerAPI?.resume({ _, error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        })
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        appRemote?.disconnect()
        call.resolve()
    }

    // MARK: - SPTSessionManagerDelegate

    public func sessionManager(manager: SPTSessionManager, didInitiate session: SPTSession) {
        persistToken(session)
        triedStoredToken = false
        appRemote?.connectionParameters.accessToken = session.accessToken
        DispatchQueue.main.async { self.appRemote?.connect() }
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
        if let uri = pendingUri {
            appRemote.playerAPI?.play(uri, callback: { _, _ in })
            pendingUri = nil
        }
    }

    public func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        // Verbindung abgebrochen — das Spiel fällt beim nächsten Play auf die
        // Vorschau zurück.
    }

    public func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        // Schlug der stille Connect mit gespeichertem Token fehl (z.B. Token
        // ungültig/abgelaufen)? Token verwerfen und volle Zustimmung anstoßen.
        if triedStoredToken {
            triedStoredToken = false
            clearToken()
            let scope: SPTScope = [.appRemoteControl, .streaming]
            DispatchQueue.main.async {
                self.sessionManager?.initiateSession(with: scope, options: .clientOnly, campaign: nil)
            }
            return
        }
        connectCall?.reject("connect_failed: \(error?.localizedDescription ?? "unknown")")
        connectCall = nil
    }
}
