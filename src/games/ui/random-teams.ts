/** Shuffle people into teams of nearly equal size. IDs keep duplicate names distinct. */
export function randomTeamAssignments(
  ids: readonly string[],
  teamCount: number,
  previous: Readonly<Record<string, number>> = {},
  rng: () => number = Math.random,
): Record<string, number> {
  if (!Number.isInteger(teamCount) || teamCount < 1) return {};

  const order = [...ids];
  for (let index = order.length - 1; index > 0; index--) {
    const pick = Math.min(index, Math.max(0, Math.floor(rng() * (index + 1))));
    [order[index], order[pick]] = [order[pick], order[index]];
  }

  const next = Object.fromEntries(order.map((id, index) => [id, index % teamCount]));
  // A second tap should visibly mix the teams even when the shuffle happens
  // to draw the previous arrangement again. Swapping two teams keeps balance.
  if (ids.length > 1 && ids.every((id) => previous[id] === next[id])) {
    const other = ids.find((id) => next[id] !== next[ids[0]]);
    if (other) [next[ids[0]], next[other]] = [next[other], next[ids[0]]];
  }
  return next;
}
