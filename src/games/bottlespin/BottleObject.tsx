import bottle from './assets/bottle-photoreal.png';

/** Transparent overhead glass bottle; neck and rotation axis point to player zero. */
export function BottleObject() {
  return <img src={bottle} className="table-bottle" alt="" aria-hidden="true" draggable={false} />;
}
