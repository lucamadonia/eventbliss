export function completeTruth<T extends {score: number; truthCount: number}>(player: T): T {
  return { ...player, score: player.score + 1, truthCount: player.truthCount + 1 };
}
