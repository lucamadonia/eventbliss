// Room identities belong to a browser tab, including reloads. Keys never leave
// this tab; presence contains only public keys. Targeted roles use ECDH/AES-GCM.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const b64 = (bytes: ArrayBuffer | Uint8Array) => {
  const array = new Uint8Array(bytes);
  let binary = '';
  for (let offset = 0; offset < array.length; offset += 32768) binary += String.fromCharCode(...array.subarray(offset, offset + 32768));
  return btoa(binary);
};
const unb64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

export interface PublicRoomIdentity {
  signingKey: JsonWebKey;
  encryptionKey: JsonWebKey;
}
export interface RoomIdentity extends PublicRoomIdentity {
  id: string;
  sign: (body: string) => Promise<string>;
  decrypt: (cipher: string, iv: string, peer: JsonWebKey) => Promise<string>;
  encrypt: (body: string, peer: JsonWebKey) => Promise<{ cipher: string; iv: string }>;
}

export async function identityId(key: JsonWebKey): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(`${key.crv}:${key.x}:${key.y}`));
  return `player-${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function verifyRoomSignature(body: string, signature: string, key: JsonWebKey): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey('jwk', key, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, unb64(signature), encoder.encode(body));
  } catch { return false; }
}

export async function createRoomIdentity(storage?: Storage): Promise<RoomIdentity> {
  let signing: CryptoKeyPair;
  let encryption: CryptoKeyPair;
  const importPair = async (privateKey: JsonWebKey, algorithm: 'ECDSA' | 'ECDH') => {
    const { d: _private, ...publicKey } = privateKey;
    delete publicKey.key_ops;
    return {
      privateKey: await crypto.subtle.importKey('jwk', privateKey, { name: algorithm, namedCurve: 'P-256' }, true, algorithm === 'ECDSA' ? ['sign'] : ['deriveKey']),
      publicKey: await crypto.subtle.importKey('jwk', publicKey, { name: algorithm, namedCurve: 'P-256' }, true, algorithm === 'ECDSA' ? ['verify'] : []),
    };
  };
  try {
    const saved = JSON.parse(storage?.getItem('eventbliss_room_identity') || 'null');
    if (!saved) throw new Error('New tab');
    signing = await importPair(saved.signing, 'ECDSA');
    encryption = await importPair(saved.encryption, 'ECDH');
  } catch {
    signing = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    encryption = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
    try {
      storage?.setItem('eventbliss_room_identity', JSON.stringify({ signing: await crypto.subtle.exportKey('jwk', signing.privateKey), encryption: await crypto.subtle.exportKey('jwk', encryption.privateKey) }));
    } catch { /* Private browsing may disable persistence. */ }
  }
  const signingKey = await crypto.subtle.exportKey('jwk', signing.publicKey);
  const encryptionKey = await crypto.subtle.exportKey('jwk', encryption.publicKey);
  const secret = async (peer: JsonWebKey) => {
    const publicKey = await crypto.subtle.importKey('jwk', peer, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    return crypto.subtle.deriveKey({ name: 'ECDH', public: publicKey }, encryption.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  return {
    id: await identityId(signingKey), signingKey, encryptionKey,
    sign: async body => b64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signing.privateKey, encoder.encode(body))),
    encrypt: async (body, peer) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      return { cipher: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await secret(peer), encoder.encode(body))), iv: b64(iv) };
    },
    decrypt: async (cipher, iv, peer) => decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await secret(peer), unb64(cipher))),
  };
}

/** sessionStorage is cloned by window.open/duplicate-tab. A live tab keeps its
 * identity; a copied tab creates new keys instead of impersonating that player. */
export async function claimTabIdentity(storage?: Storage): Promise<RoomIdentity> {
  let identity = await createRoomIdentity(storage);
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return identity;
  const channel = new BroadcastChannel('eventbliss-room-identities');
  const request = crypto.randomUUID();
  let occupied = false;
  channel.onmessage = ({ data }) => {
    if (data?.id !== identity.id) return;
    if (data.type === 'probe') channel.postMessage({ type: 'occupied', id: identity.id, request: data.request });
    if (data.type === 'occupied' && data.request === request) occupied = true;
  };
  channel.postMessage({ type: 'probe', id: identity.id, request });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (occupied) {
    try { storage?.removeItem('eventbliss_room_identity'); } catch { /* Optional persistence. */ }
    identity = await createRoomIdentity(storage);
  }
  // The document owns this lease. A reload closes it before importing keys.
  window.addEventListener('pagehide', () => channel.close(), { once: true });
  return identity;
}

/** Account sessions keep one identity per account across tabs; anonymous rooms one per tab. */
export function identityStorage(accountId: string | null): Storage | undefined {
  try {
    if (!accountId) return sessionStorage;
    const prefix = `eventbliss_account_${accountId}:`;
    return { getItem: key => localStorage.getItem(prefix + key), setItem: (key, value) => localStorage.setItem(prefix + key, value), removeItem: key => localStorage.removeItem(prefix + key) } as Storage;
  } catch { return undefined; /* SSR/private browsing */ }
}
