import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';

const harness = vi.hoisted(() => ({ slots: [] as unknown[], index: 0, outer: null as unknown, activate: vi.fn(), broadcastHook: vi.fn() }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useContext: () => harness.outer,
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [harness.slots[index], (next: unknown) => { harness.slots[index] = next; }];
  },
  useCallback: (callback: unknown) => callback,
  useSyncExternalStore: () => null,
}));
vi.mock('@/hooks/useTVBroadcast', () => ({ useTVBroadcast: (...args: unknown[]) => {
  harness.broadcastHook(...args);
  return { displayCode: 'JL2D6Z', isActive: false, activate: harness.activate };
} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'de' } }) }));
vi.mock('framer-motion', () => ({ motion: { div: 'div', button: 'button' }, AnimatePresence: 'section' }));
vi.mock('@/hooks/useHaptics', () => ({ haptics: { light: vi.fn(), success: vi.fn() } }));
vi.mock('@/lib/platform', () => ({ getBaseUrl: () => 'https://event-bliss.com' }));
vi.mock('@/components/native/party/TVRemote', () => ({ TVRemote: () => null }));
vi.mock('@/hooks/usePartySession', () => ({ getActivePartySession: () => null, subscribePartySession: vi.fn() }));
import { TVBroadcastProvider } from '@/contexts/TVBroadcastContext';
import { TVConnectButton } from '@/games/ui/TVConnectButton';

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children as ReactNode)];
}
function renderRoot() {
  harness.index = 0;
  const root = TVBroadcastProvider({ children: null, showConnectButton: false }) as ReactElement;
  return (root.type as (props: unknown) => Element)(root.props);
}
beforeEach(() => { harness.slots = []; harness.index = 0; harness.outer = null; vi.clearAllMocks(); });

describe('TV instructions from the party lobby', () => {
  it('mounts the panel with a hidden trigger and opens it through the shared context', () => {
    let root = renderRoot();
    let panel = elements(root).find(element => element.type === TVConnectButton)!;
    expect(panel.props.showTrigger).toBe(false);
    expect(panel.props.expanded).toBe(false);
    (root.props.value as { openConnection: () => void }).openConnection();
    expect(harness.activate).toHaveBeenCalledOnce();
    root = renderRoot();
    panel = elements(root).find(element => element.type === TVConnectButton)!;
    expect(panel.props.expanded).toBe(true);
    expect(panel.props.tvCode).toBe('JL2D6Z');
    (panel.props.onExpandedChange as (open: boolean) => void)(false);
    expect(elements(renderRoot()).find(element => element.type === TVConnectButton)!.props.expanded).toBe(false);
  });
  it('renders visible instructions, TV code and a close action without a floating trigger', () => {
    const onExpandedChange = vi.fn();
    const view = TVConnectButton({ tvCode: 'JL2D6Z', isActive: true, onActivate: vi.fn(), showTrigger: false, expanded: true, onExpandedChange });
    const nodes = elements(view);
    expect(nodes.some(node => node.props.role === 'dialog')).toBe(true);
    expect(nodes.some(node => node.props.children === 'JL2D6Z')).toBe(true);
    const close = nodes.find(node => node.props['aria-label'] === 'common.close')!;
    (close.props.onClick as () => void)();
    expect(onExpandedChange).toHaveBeenCalledWith(false);
  });
  it('does not display a floating button when the lobby panel is closed', () => {
    expect(TVConnectButton({ tvCode: 'JL2D6Z', isActive: true, onActivate: vi.fn(), showTrigger: false, expanded: false })).toBeNull();
  });
  it('reuses the outer provider instead of creating a second broadcast channel owner', () => {
    harness.outer = { openConnection: vi.fn() };
    const result = TVBroadcastProvider({ children: 'nested game' });
    expect(result.props.children).toBe('nested game');
    expect(harness.broadcastHook).not.toHaveBeenCalled();
  });
});
