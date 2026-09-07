export function whoamiSnapshotFor<T extends { players: { id: string; character: string }[]; phase: string }>(state: T, recipient: string) {
  return { ...state, players: state.players.map(p => ({ ...p,
    character: p.id === recipient && state.phase !== 'gameOver' ? '' : p.character,
  })) };
}
