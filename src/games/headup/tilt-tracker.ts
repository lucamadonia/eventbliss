export type TiltAction = 'correct' | 'skip' | null;

/** Calibrate at the forehead before the first word, not on the first gesture. */
export class HeadUpTiltTracker {
  private baseline: number | null = null;
  private smoothed: number | null = null;
  armed = false;

  reset() { this.baseline = null; this.smoothed = null; this.armed = false; }

  sample(pitch: number, playing: boolean): TiltAction {
    if (!Number.isFinite(pitch)) return null;
    if (!playing) {
      // A phone lying flat on a table is not the forehead's neutral pose.
      if (Math.abs(pitch) <= 40) { this.baseline = pitch; this.smoothed = pitch; this.armed = true; }
      else this.reset();
      return null;
    }
    if (this.baseline === null) {
      if (Math.abs(pitch) <= 40) { this.baseline = pitch; this.smoothed = pitch; this.armed = true; }
      return null;
    }
    this.smoothed = this.smoothed === null ? pitch : this.smoothed * 0.65 + pitch * 0.35;
    const delta = this.smoothed - this.baseline;
    if (!this.armed) {
      if (Math.abs(delta) < 12) this.armed = true;
      return null;
    }
    if (Math.abs(delta) <= 25) return null;
    this.armed = false;
    // W3C accelerationIncludingGravity.z is positive with the screen facing up.
    // At the forehead, nodding down makes the screen face down (negative z).
    return delta < 0 ? 'correct' : 'skip';
  }
}

export function gravityPitch(gravity: { x: number | null; y: number | null; z: number | null }): number | null {
  const { x, y, z } = gravity;
  if (x === null || y === null || z === null || ![x, y, z].every(Number.isFinite) || Math.hypot(x, y, z) < 1) return null;
  return Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI;
}
