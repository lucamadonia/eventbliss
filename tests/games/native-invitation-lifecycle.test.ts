import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSafeAuthRedirect } from '@/lib/auth-redirect';

const native = vi.hoisted(() => ({ addListener: vi.fn(), getLaunchUrl: vi.fn(), remove: vi.fn(), isNative: vi.fn(() => true) }));
vi.mock('@capacitor/app', () => ({ App: native }));
vi.mock('@/lib/platform', () => ({ isNative: native.isNative }));
import { initDeepLinks } from '@/lib/deep-links';

beforeEach(() => {
  vi.clearAllMocks();
  native.isNative.mockReturnValue(true);
  native.addListener.mockResolvedValue({ remove: native.remove });
});
describe('native invitation delivery', () => {
  it('delivers cold launch and subsequent warm invitations', async () => {
    native.getLaunchUrl.mockResolvedValue({ url: 'eventbliss://party/join/COLD01' });
    const navigate = vi.fn(); const dispose = initDeepLinks(navigate);
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledWith('/party/join/COLD01');
    native.addListener.mock.calls[0][1]({ url: 'eventbliss://party/join/WARM02' });
    expect(navigate).toHaveBeenLastCalledWith('/party/join/WARM02');
    dispose(); await Promise.resolve(); expect(native.remove).toHaveBeenCalledOnce();
  });
  it('does not overwrite a newer warm invitation with a delayed launch URL', async () => {
    let resolveLaunch!: (value: { url: string }) => void;
    native.getLaunchUrl.mockReturnValue(new Promise(resolve => { resolveLaunch = resolve; }));
    const navigate = vi.fn(); const dispose = initDeepLinks(navigate);
    native.addListener.mock.calls[0][1]({ url: 'eventbliss://party/join/WARM02' });
    resolveLaunch({ url: 'eventbliss://party/join/COLD01' }); await Promise.resolve();
    expect(navigate).toHaveBeenCalledOnce(); expect(navigate).toHaveBeenCalledWith('/party/join/WARM02'); dispose();
  });
  it('ignores a late launch response after unmount', async () => {
    native.getLaunchUrl.mockResolvedValue({ url: 'eventbliss://party/join/COLD01' });
    const navigate = vi.fn(); const dispose = initDeepLinks(navigate); dispose();
    await Promise.resolve(); expect(navigate).not.toHaveBeenCalled();
  });
  it('does not subscribe to native events on web', () => {
    native.isNative.mockReturnValue(false); initDeepLinks(vi.fn())();
    expect(native.addListener).not.toHaveBeenCalled();
  });
});
describe('authentication return destination', () => {
  it('preserves invitation and room query through login and registration', () => {
    expect(getSafeAuthRedirect('/party/join/ABCDEF')).toBe('/party/join/ABCDEF');
    expect(getSafeAuthRedirect('/games/bomb?room=ABCDEF&name=Anna')).toBe('/games/bomb?room=ABCDEF&name=Anna');
  });
  it.each([null, 'https://example.com', '//example.com', '/\\example.com', '/auth?redirect=/party', '/auth/login', '/party\n/join'])('rejects unsafe or recursive return %j', value => {
    expect(getSafeAuthRedirect(value)).toBe('/');
  });
});
