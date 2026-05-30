package com.eventbliss.ohrwurmspotify

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote

// OHRWURM — Spotify App Remote bridge (Android).
// Plays a full track in the background via the installed Spotify app (Premium).
// Requires the spotify-app-remote AAR added to the app (see SETUP.md).
@CapacitorPlugin(name = "OhrwurmSpotify")
class OhrwurmSpotifyPlugin : Plugin() {

    private var appRemote: SpotifyAppRemote? = null
    private var pendingUri: String? = null

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val installed = SpotifyAppRemote.isSpotifyInstalled(context)
        val ret = JSObject()
        ret.put("available", installed)
        call.resolve(ret)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val clientId = call.getString("clientId")
        val redirectUrl = call.getString("redirectUrl")
        if (clientId == null || redirectUrl == null) {
            call.reject("clientId and redirectUrl are required")
            return
        }
        if (!SpotifyAppRemote.isSpotifyInstalled(context)) {
            call.reject("spotify_not_installed")
            return
        }

        val params = ConnectionParams.Builder(clientId)
            .setRedirectUri(redirectUrl)
            .showAuthView(true)
            .build()

        SpotifyAppRemote.connect(context, params, object : Connector.ConnectionListener {
            override fun onConnected(remote: SpotifyAppRemote) {
                appRemote = remote
                pendingUri?.let { remote.playerApi.play(it); pendingUri = null }
                val ret = JSObject()
                ret.put("connected", true)
                call.resolve(ret)
            }

            override fun onFailure(error: Throwable) {
                call.reject("connect_failed: ${error.message}")
            }
        })
    }

    @PluginMethod
    fun play(call: PluginCall) {
        val uri = call.getString("uri")
        if (uri == null) { call.reject("uri is required"); return }
        val remote = appRemote
        if (remote == null || !remote.isConnected) {
            pendingUri = uri
            call.reject("not_connected")
            return
        }
        remote.playerApi.play(uri)
        call.resolve()
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        appRemote?.playerApi?.pause()
        call.resolve()
    }

    @PluginMethod
    fun resume(call: PluginCall) {
        appRemote?.playerApi?.resume()
        call.resolve()
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        appRemote?.let { SpotifyAppRemote.disconnect(it) }
        appRemote = null
        call.resolve()
    }
}
