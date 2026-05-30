import Foundation
import Capacitor
import SpotifyiOS

// OHRWURM — Spotify App Remote bridge (iOS).
// Plays a full track in the background via the installed Spotify app (Premium).
// Requires the SpotifyiOS framework (App Remote) added to the app project.
//
// Setup (see native-plugins/ohrwurm-spotify/SETUP.md):
//  - Add SpotifyiOS.xcframework to the App target.
//  - Register your redirect URL scheme (e.g. eventbliss) in Info.plist.
//  - Add `spotify` to LSApplicationQueriesSchemes in Info.plist.

@objc(OhrwurmSpotifyPlugin)
public class OhrwurmSpotifyPlugin: CAPPlugin, SPTAppRemoteDelegate, SPTSessionManagerDelegate {

    private var appRemote: SPTAppRemote?
    private var sessionManager: SPTSessionManager?
    private var connectCall: CAPPluginCall?
    private var pendingUri: String?

    @objc func isAvailable(_ call: CAPPluginCall) {
        // Spotify app installed? SPTAppRemote exposes this via the configuration.
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

        let configuration = SPTConfiguration(clientID: clientId, redirectURL: redirectURL)
        let manager = SPTSessionManager(configuration: configuration, delegate: self)
        self.sessionManager = manager

        let remote = SPTAppRemote(configuration: configuration, logLevel: .info)
        remote.delegate = self
        self.appRemote = remote

        self.connectCall = call

        // Request the scopes needed to control playback.
        let scope: SPTScope = [.appRemoteControl, .streaming]
        DispatchQueue.main.async {
            manager.initiateSession(with: scope, options: .clientOnly, campaign: nil)
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri") else {
            call.reject("uri is required")
            return
        }
        guard let remote = appRemote, remote.isConnected else {
            // Not connected yet — remember and connect lazily.
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
        appRemote?.connectionParameters.accessToken = session.accessToken
        appRemote?.connect()
    }

    public func sessionManager(manager: SPTSessionManager, didFailWith error: Error) {
        connectCall?.reject("auth_failed: \(error.localizedDescription)")
        connectCall = nil
    }

    // MARK: - SPTAppRemoteDelegate

    public func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
        connectCall?.resolve(["connected": true])
        connectCall = nil
        if let uri = pendingUri {
            appRemote.playerAPI?.play(uri, callback: { _, _ in })
            pendingUri = nil
        }
    }

    public func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        // Connection dropped — game falls back to preview on next play attempt.
    }

    public func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        connectCall?.reject("connect_failed: \(error?.localizedDescription ?? "unknown")")
        connectCall = nil
    }
}
