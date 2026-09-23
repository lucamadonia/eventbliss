/** A participant may only undo their own unscored placement step. */
export function canNavigateBack(phase: string, destination: unknown, sender: unknown, activeId: string | undefined, counterId: string | null) {
  if (typeof sender !== 'string') return false;
  if (phase === 'place' && destination === 'draw') return sender === activeId;
  if (phase === 'counter' && destination === 'place') return sender === activeId;
  if (phase === 'counterPlace' && destination === 'counter') return sender === counterId;
  return false;
}

export function validTimelineSlot(slot: unknown, timelineLength: number): slot is number {
  return typeof slot === 'number' && Number.isInteger(slot) && slot >= 0 && slot <= timelineLength;
}
