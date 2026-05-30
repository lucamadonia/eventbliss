// OHRWURM Spotify App Remote — Capacitor plugin definitions.
//
// Plays a full Spotify track HIDDEN in the background (the Spotify app does the
// playback; our app shows a neutral screen) — like Hitster Premium. Requires:
//  - Spotify Premium account
//  - Spotify app installed on the device
//  - a Spotify Developer App (clientId + redirectUrl registered)
// Native only (iOS/Android). On web it is unavailable.

export interface ConnectOptions {
  /** Spotify Developer App Client ID. */
  clientId: string;
  /** Redirect URI registered in the Spotify dashboard, e.g. 'eventbliss://spotify-callback'. */
  redirectUrl: string;
}

export interface PlayOptions {
  /** Spotify track URI, e.g. 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6'. */
  uri: string;
}

export interface OhrwurmSpotifyPlugin {
  /** Is the native plugin + Spotify app available on this device? */
  isAvailable(): Promise<{ available: boolean }>;

  /**
   * Authorize + connect to the Spotify app (App Remote). Triggers the Spotify
   * auth flow on first use. Resolves { connected: true } on success.
   * Rejects if Spotify is not installed or the user is not Premium.
   */
  connect(options: ConnectOptions): Promise<{ connected: boolean }>;

  /** Play a track URI (full song, in the background). Premium required. */
  play(options: PlayOptions): Promise<void>;

  /** Pause playback. */
  pause(): Promise<void>;

  /** Resume playback. */
  resume(): Promise<void>;

  /** Disconnect from the Spotify app. */
  disconnect(): Promise<void>;
}
