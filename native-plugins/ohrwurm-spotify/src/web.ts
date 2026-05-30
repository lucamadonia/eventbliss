import { WebPlugin } from '@capacitor/core';
import type { OhrwurmSpotifyPlugin, ConnectOptions, PlayOptions } from './definitions';

// Web stub — the Spotify App Remote SDK is native only. The OHRWURM game treats
// "unavailable" as a signal to fall back to the 30s preview.
export class OhrwurmSpotifyWeb extends WebPlugin implements OhrwurmSpotifyPlugin {
  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }
  async connect(_options: ConnectOptions): Promise<{ connected: boolean }> {
    throw this.unavailable('Spotify App Remote is only available on native platforms.');
  }
  async play(_options: PlayOptions): Promise<void> {
    throw this.unavailable('Spotify App Remote is only available on native platforms.');
  }
  async pause(): Promise<void> {
    throw this.unavailable('Spotify App Remote is only available on native platforms.');
  }
  async resume(): Promise<void> {
    throw this.unavailable('Spotify App Remote is only available on native platforms.');
  }
  async disconnect(): Promise<void> {
    throw this.unavailable('Spotify App Remote is only available on native platforms.');
  }
}
