package com.eventbliss.ohrwurmspotify

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.spotify.protocol.types.PlayerState

// OHRWURM — Spotify App Remote bridge (Android).
// Plays a full track in the background via the installed Spotify app (Premium).
// Requires the spotify-app-remote AAR added to the app (see SETUP.md).
//
// Der echte Player-State (subscribeToPlayerState) wird ans JS gemeldet, sodass
// die App-UI den TATSÄCHLICHEN Spotify-Zustand spiegelt statt eines optimistischen
// Booleans. Routing auf Spotify nur bei echter Verbindung — sonst 30s-Vorschau.
@CapacitorPlugin(name = "OhrwurmSpotify")
class OhrwurmSpotifyPlugin : Plugin() {

    private var appRemote: SpotifyAppRemote? = null
    private var pendingUri: String? = null
    private var pendingPlayCall: PluginCall? = null
    // Für Reconnect-Versuche aus play() gemerkte Config.
    private var clientId: String? = null
    private var redirectUrl: String? = null

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val installed = SpotifyAppRemote.isSpotifyInstalled(context)
        val ret = JSObject()
        ret.put("available", installed)
        call.resolve(ret)
    }

    // Echte App-Remote-Verbindung (Routing-Gate fürs JS).
    @PluginMethod
    fun isConnected(call: PluginCall) {
        val ret = JSObject()
        ret.put("connected", appRemote?.isConnected == true)
        call.resolve(ret)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val cid = call.getString("clientId")
        val redirect = call.getString("redirectUrl")
        if (cid == null || redirect == null) {
            call.reject("clientId and redirectUrl are required")
            return
        }
        if (!SpotifyAppRemote.isSpotifyInstalled(context)) {
            call.reject("spotify_not_installed")
            return
        }
        clientId = cid
        redirectUrl = redirect
        connectInternal(call)
    }

    // Stellt die App-Remote-Verbindung her. Bei Erfolg: Player-State abonnieren,
    // connection-Event melden, ggf. wartenden Song spielen. resolveCall wird (falls
    // gesetzt) mit {connected:true} aufgelöst.
    private fun connectInternal(resolveCall: PluginCall?) {
        val cid = clientId
        val redirect = redirectUrl
        if (cid == null || redirect == null) { resolveCall?.reject("not_configured"); return }

        val params = ConnectionParams.Builder(cid)
            .setRedirectUri(redirect)
            .showAuthView(true)
            .build()

        SpotifyAppRemote.connect(context, params, object : Connector.ConnectionListener {
            override fun onConnected(remote: SpotifyAppRemote) {
                appRemote = remote
                // Echten Player-State abonnieren → ans JS melden (Single Source of Truth).
                remote.playerApi.subscribeToPlayerState().setEventCallback { state ->
                    notifyPlayerState(state)
                }
                notifyConnection(true)
                resolveCall?.let {
                    val ret = JSObject()
                    ret.put("connected", true)
                    it.resolve(ret)
                }
                // Wartenden Song im Hintergrund abspielen.
                pendingUri?.let { uri ->
                    remote.playerApi.play(uri)
                    pendingUri = null
                    pendingPlayCall?.resolve()
                    pendingPlayCall = null
                } ?: run {
                    pendingPlayCall?.resolve()
                    pendingPlayCall = null
                }
            }

            override fun onFailure(error: Throwable) {
                notifyConnection(false)
                resolveCall?.reject("connect_failed: ${error.message}")
                pendingPlayCall?.reject("not_connected")
                pendingPlayCall = null
                pendingUri = null
            }
        })
    }

    @PluginMethod
    fun play(call: PluginCall) {
        val uri = call.getString("uri")
        if (uri == null) { call.reject("uri is required"); return }
        val remote = appRemote
        if (remote == null || !remote.isConnected) {
            // Nicht verbunden → Song einreihen und EINMALIG verbinden. Klappt das
            // nicht, wird der Call abgelehnt → JS fällt auf die 30s-Vorschau zurück
            // (kein stilles „läuft", obwohl nichts spielt).
            pendingUri = uri
            pendingPlayCall?.reject("superseded")
            pendingPlayCall = call
            connectInternal(null)
            return
        }
        remote.playerApi.play(uri)
        call.resolve()
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        if (appRemote?.isConnected != true) { call.reject("not_connected"); return }
        appRemote?.playerApi?.pause()
        call.resolve()
    }

    @PluginMethod
    fun resume(call: PluginCall) {
        if (appRemote?.isConnected != true) { call.reject("not_connected"); return }
        appRemote?.playerApi?.resume()
        call.resolve()
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        pendingUri = null
        pendingPlayCall?.reject("disconnected")
        pendingPlayCall = null
        appRemote?.let { SpotifyAppRemote.disconnect(it) }
        appRemote = null
        notifyConnection(false)
        call.resolve()
    }

    // --- Event-Helfer -------------------------------------------------------

    // WICHTIG: track.name / Jahr NICHT mitsenden (Spoiler-Schutz).
    private fun notifyPlayerState(state: PlayerState) {
        val data = JSObject()
        data.put("isPaused", state.isPaused)
        data.put("uri", state.track?.uri ?: "")
        data.put("position", state.playbackPosition)
        notifyListeners("playerState", data)
    }

    private fun notifyConnection(connected: Boolean) {
        val data = JSObject()
        data.put("connected", connected)
        notifyListeners("connection", data)
    }
}
