type Task = { run: () => void; remaining: number; started: number; handle?: ReturnType<typeof globalThis.setTimeout> };

/** Keeps pending game/animation work, including partially elapsed delays, through a room pause. */
export class PausableTasks {
  private tasks = new Map<number, Task>();
  private sequence = 0;
  constructor(private enabled = true) {}

  private arm(id: number, task: Task) {
    task.started = Date.now();
    task.handle = globalThis.setTimeout(() => {
      this.tasks.delete(id);
      task.run();
    }, task.remaining);
  }
  setTimeout = (run: () => void, delay = 0): number => {
    const id = ++this.sequence;
    const task: Task = { run, remaining: Math.max(0, delay), started: Date.now() };
    this.tasks.set(id, task);
    if (this.enabled) this.arm(id, task);
    return id;
  };
  clearTimeout = (id: number | undefined) => {
    if (id === undefined) return;
    const task = this.tasks.get(id);
    if (task?.handle !== undefined) globalThis.clearTimeout(task.handle);
    this.tasks.delete(id);
  };
  setEnabled(enabled: boolean) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    for (const [id, task] of this.tasks) {
      if (enabled) this.arm(id, task);
      else if (task.handle !== undefined) {
        globalThis.clearTimeout(task.handle);
        task.remaining = Math.max(0, task.remaining - (Date.now() - task.started));
        task.handle = undefined;
      }
    }
  }
  clear = () => { for (const id of this.tasks.keys()) this.clearTimeout(id); };
}
