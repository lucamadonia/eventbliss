/** An OS invitation takes precedence over routing for a restored party. */
export function controllerInvitationCode(pathname: string): string | null {
  const match = /^\/party\/join\/([^/]+)\/?$/.exec(pathname);
  return match ? match[1].toUpperCase() : null;
}

export function invitationAction(inviteCode: string | undefined, currentCode: string | undefined, busy: boolean): 'wait' | 'join' | 'confirm' | 'none' {
  if (!inviteCode) return 'none';
  if (busy) return 'wait';
  if (!currentCode) return 'join';
  return inviteCode.toUpperCase() === currentCode.toUpperCase() ? 'none' : 'confirm';
}

/** Never join the replacement if leaving/ending the existing party failed. */
export async function switchConfirmedParty(leave: () => Promise<void>, join: () => Promise<unknown>): Promise<void> {
  await leave();
  await join();
}
