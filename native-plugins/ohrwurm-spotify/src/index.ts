import { registerPlugin } from '@capacitor/core';
import type { OhrwurmSpotifyPlugin } from './definitions';

const OhrwurmSpotify = registerPlugin<OhrwurmSpotifyPlugin>('OhrwurmSpotify', {
  web: () => import('./web').then((m) => new m.OhrwurmSpotifyWeb()),
});

export * from './definitions';
export { OhrwurmSpotify };
